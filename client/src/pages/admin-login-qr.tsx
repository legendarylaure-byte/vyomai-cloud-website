import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Mail, Shield, Smartphone, ArrowRight, RotateCcw, Sparkles, Eye, EyeOff } from "lucide-react";
import { AnimatedLogo } from "@/components/animated-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SeoHead } from "@/components/seo-head";
import { GoogleLogin } from "@react-oauth/google";
import { QRAuthModal } from "@/components/qr-auth-modal";
import { resetPasswordRequestSchema, verifyResetCodeSchema, resetPasswordSchema, type ResetPasswordRequest, type VerifyResetCode, type ResetPassword } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const totpSchema = z.object({
  token: z.string().min(6, "Code must be 6 digits").max(6),
});

const emailOtpSchema = z.object({
  otp: z.string().min(6, "Code must be 6 digits").max(6),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TotpFormData = z.infer<typeof totpSchema>;
type EmailOtpFormData = z.infer<typeof emailOtpSchema>;

interface LoginResponse {
  success?: boolean;
  token?: string;
  requires2FA?: boolean;
  method?: "email" | "totp" | "both";
  sessionId?: string;
  error?: string;
}

export default function AdminLoginQR() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"credentials" | "choose-2fa" | "totp" | "email-otp">("credentials");
  const [loginSession, setLoginSession] = useState<{ sessionId: string; method: string } | null>(null);
  const [showQRAuth, setShowQRAuth] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "code" | "password">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const totpForm = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: { token: "" },
  });

  const emailOtpForm = useForm<EmailOtpFormData>({
    resolver: zodResolver(emailOtpSchema),
    defaultValues: { otp: "" },
  });

  const resetEmailForm = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: { email: "" },
  });

  const resetCodeForm = useForm<VerifyResetCode>({
    resolver: zodResolver(verifyResetCodeSchema),
    defaultValues: { email: "", code: "" },
  });

  const resetPasswordForm = useForm<ResetPassword>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: "", code: "", newPassword: "", confirmPassword: "" },
  });

  const requestResetMutation = useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      return apiRequest("POST", "/api/admin/request-password-reset", data);
    },
    onSuccess: (body: any) => {
      if (body.emailDeliveryFailed) {
        toast({ title: "Warning", description: body.message || "Code stored but email server may not be configured. Contact support.", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Verification code sent to email" });
      }
      setResetEmail(resetEmailForm.getValues("email"));
      setResetStep("code");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to send reset code",
        variant: "destructive",
      });
    },
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async (data: VerifyResetCode) => {
      return apiRequest("POST", "/api/admin/verify-reset-code", data);
    },
    onSuccess: () => {
      setResetCode(resetCodeForm.getValues("code"));
      setResetStep("password");
      resetPasswordForm.setValue("email", resetEmail);
      resetPasswordForm.setValue("code", resetCodeForm.getValues("code"));
    },
    onError: () => {
      toast({ title: "Error", description: "Invalid or expired code", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPassword) => {
      return apiRequest("POST", "/api/admin/reset-password", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password reset successfully. Please login with your new password." });
      setIsForgotPasswordOpen(false);
      setResetStep("email");
      resetEmailForm.reset();
      resetCodeForm.reset();
      resetPasswordForm.reset();
      setResetEmail("");
      setResetCode("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to reset password", variant: "destructive" });
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body: LoginResponse = await res.json();
      if (res.ok && body.success && body.token) {
        localStorage.setItem("vyomai-admin-token", body.token);
        toast({ title: "Welcome back!", description: "You have successfully logged in." });
        setLocation("/admin/dashboard");
        return;
      }
      if (body.requires2FA) {
        setLoginSession({ sessionId: body.sessionId!, method: body.method! });
        if (body.method === "totp") {
          setStep("totp");
        } else if (body.method === "email") {
          setStep("email-otp");
          toast({ title: "Code Sent", description: "Check your email for the verification code." });
        } else if (body.method === "both") {
          setStep("choose-2fa");
        }
        return;
      }
      toast({
        title: "Login Failed",
        description: body.error || "Invalid username or password.",
        variant: "destructive",
      });
    } catch {
      toast({ title: "Login Failed", description: "Invalid username or password.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3D Card Tilt
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty("--tilt-x", `${-y * 6}deg`);
      card.style.setProperty("--tilt-y", `${x * 6}deg`);
    };
    const handleLeave = () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    };
    card.addEventListener("mousemove", handleMove);
    card.addEventListener("mouseleave", handleLeave);
    return () => {
      card.removeEventListener("mousemove", handleMove);
      card.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  const verify2FA = useCallback(async (method: "email" | "totp", code: string) => {
    if (!loginSession) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, code, sessionId: loginSession.sessionId }),
      });
      const body = await res.json();
      if (res.ok && body.success && body.token) {
        localStorage.setItem("vyomai-admin-token", body.token);
        toast({ title: "Welcome!", description: "Authentication successful!" });
        setLocation("/admin/dashboard");
      } else {
        toast({ title: "Verification Failed", description: body.error || "Invalid code.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Verification failed. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }, [loginSession, setLocation, toast]);

  const onTotpSubmit = (data: TotpFormData) => verify2FA("totp", data.token);
  const onEmailOtpSubmit = (data: EmailOtpFormData) => verify2FA("email", data.otp);

  const onGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const body = await res.json();
      if (res.ok && body.success && body.token) {
        localStorage.setItem("vyomai-admin-token", body.token);
        toast({ title: "Welcome!", description: "Google login successful!" });
        setLocation("/admin/dashboard");
      } else {
        toast({ title: "Google Login Failed", description: body.error || "Authentication failed.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Google login failed.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!loginSession) return;
    try {
      const res = await fetch("/api/admin/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: loginSession.sessionId }),
      });
      if (res.ok) {
        toast({ title: "OTP Resent", description: "Check your email for a new code." });
      } else {
        toast({ title: "Error", description: "Failed to resend OTP.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to resend OTP.", variant: "destructive" });
    }
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleLoginEnabled = !!googleClientId;

  return (
    <div className="min-h-screen bg-background flex items-center justify-between px-6 md:px-[6%] p-4 relative overflow-hidden">
      <SeoHead
        noindex
        title="Admin Login - VyomAi Cloud"
        description="Admin login portal for VyomAi Cloud."
        ogUrl="https://vyomai.cloud/admin"
        canonical="https://vyomai.cloud/admin"
      />
      {/* Hero-quality background: video + cosmic + stars + comets */}
      <div className="absolute inset-0 bg-[#0D0B1A]">
        <div className="hero-video-container" style={{ height: '100%' }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect fill='%230D0B1A' width='1' height='1'/%3E%3C/svg%3E"
          >
            <source
              src="https://api.getlayers.ai/storage/v1/object/public/public/assets/loopstack-f8c64439bf/flower.mp4"
              type="video/mp4"
            />
          </video>
        </div>
        <div className="hero-cosmic-bg" />
        <div className="hero-stars" />
        <div className="hero-comets" aria-hidden="true">
          <div className="hero-comet hero-comet-1" />
          <div className="hero-comet hero-comet-2" />
          <div className="hero-comet hero-comet-3" />
        </div>
        <div className="hero-brand-star hero-brand-star-1" aria-hidden="true" />
        <div className="hero-brand-star hero-brand-star-2" aria-hidden="true" />
        <div className="hero-brand-star hero-brand-star-3" aria-hidden="true" />
      </div>

      {/* Left side — Brand + Tagline */}
      <motion.div
        className="relative z-10 max-w-xl hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h1
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-display gradient-brand-text leading-tight tracking-tight"
          style={{ textShadow: "0 2px 12px rgba(138, 80, 232, 0.3)" }}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
        >
          VyomAi Cloud
        </motion.h1>

        <motion.div
          className="w-12 h-[3px] rounded-full mt-5 mb-5"
          style={{ background: "linear-gradient(90deg, #8a50e8, #c060d0, #e07040)" }}
          initial={{ opacity: 0, scaleX: 0, transformOrigin: "left" }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />

        <motion.h2
          className="text-2xl md:text-3xl font-bold font-display text-white leading-snug"
          style={{ textShadow: "0 2px 8px rgba(0, 0, 0, 0.4)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          Teaching Robots to Think.<br />Humans to Thrive.
        </motion.h2>

        <motion.p
          className="text-lg md:text-xl text-white/70 leading-relaxed mt-4 max-w-md"
          style={{ textShadow: "0 1px 4px rgba(0, 0, 0, 0.3)" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          Where AI meets good vibes — from Nepal to the world.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <Card
          ref={cardRef}
          className="admin-login-card w-full max-w-md card-3d-tilt relative z-10"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8a50e8]/5 to-transparent pointer-events-none" />

          <CardHeader className="text-center relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center justify-center mb-4"
            >
              <div className="relative">
                <AnimatedLogo variant="login" showText={true} />
                <motion.div
                  className="absolute -inset-4 bg-gradient-to-r from-[#8a50e8]/20 to-[#c060d0]/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <CardTitle className="text-xl gradient-brand-text">
                {step === "credentials" ? "Secure Portal" : "Two-Factor Authentication"}
              </CardTitle>
              <CardDescription>
                {step === "credentials" && "Sign in to access your VyomAi dashboard"}
                {step === "totp" && "Enter the 6-digit code from your authenticator app"}
                {step === "email-otp" && "Enter the verification code sent to your email"}
                {step === "choose-2fa" && "Choose your 2FA method"}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="relative">
            <AnimatePresence mode="wait">
              {step === "credentials" && (
                <motion.div
                  key="credentials"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 stagger-fade-in"
                >
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField control={form.control} name="username" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-[#8a50e8]" />
                            Username
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="admin"
                                {...field}
                                data-testid="input-admin-username"
                                className="pl-9 bg-white/5 dark:bg-black/20 border-[#8a50e8]/20 focus:border-[#8a50e8]/50 transition-all duration-300"
                              />
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a50e8]/50" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-[#8a50e8]" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                                data-testid="input-admin-password"
                                className="pl-9 pr-9 bg-white/5 dark:bg-black/20 border-[#8a50e8]/20 focus:border-[#8a50e8]/50 transition-all duration-300"
                              />
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a50e8]/50" />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a50e8]/50 hover:text-[#8a50e8] transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full relative overflow-hidden group admin-btn-glow transition-all duration-300"
                          data-testid="button-login-submit"
                        >
                          <motion.span
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                          />
                          {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                          ) : (
                            <><Lock className="w-4 h-4 mr-2" /> Sign In</>
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  </Form>

                  {googleLoginEnabled && (
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-[#8a50e8]/20" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>
                  )}

                  {googleLoginEnabled && (
                    <motion.div
                      className="flex justify-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="transform hover:scale-105 transition-transform duration-300">
                        <GoogleLogin
                          onSuccess={onGoogleSuccess}
                          onError={() => toast({ title: "Google Login Failed", description: "An error occurred.", variant: "destructive" })}
                          size="large"
                          theme="outline"
                          shape="rectangular"
                          text="signin_with"
                          itp_support={true}
                        />
                      </div>
                    </motion.div>
                  )}

                  <Dialog open={isForgotPasswordOpen} onOpenChange={(open) => {
                    setIsForgotPasswordOpen(open);
                    if (!open) {
                      setResetStep("email");
                      resetEmailForm.reset();
                      resetCodeForm.reset();
                      resetPasswordForm.reset();
                      setResetEmail("");
                      setResetCode("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="ghost" className="w-full text-sm hover-elevate group" data-testid="button-forgot-password-qr">
                        <Mail className="w-4 h-4 mr-2 group-hover:text-[#8a50e8] transition-colors" />
                        Forgot Password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md overflow-hidden border-[#8a50e8]/20">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-[#8a50e8]" />
                          Reset Password
                        </DialogTitle>
                      </DialogHeader>
                      {resetStep === "email" && (
                        <Form {...resetEmailForm}>
                          <form onSubmit={resetEmailForm.handleSubmit((data) => requestResetMutation.mutate(data))} className="space-y-4 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Enter your email to receive a verification code</p>
                            <FormField control={resetEmailForm.control} name="email" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Personal Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="your.email@example.com" data-testid="input-reset-email-qr" className="bg-white/5 dark:bg-black/20" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <div className="flex gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setIsForgotPasswordOpen(false)} className="flex-1">Cancel</Button>
                              <Button type="submit" disabled={requestResetMutation.isPending} className="flex-1 hover-elevate admin-btn-glow" data-testid="button-request-code-qr">
                                {requestResetMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : <><ArrowRight className="w-4 h-4 mr-2" /> Send Code</>}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      )}
                      {resetStep === "code" && (
                        <Form {...resetCodeForm}>
                          <form onSubmit={resetCodeForm.handleSubmit((data) => verifyCodeMutation.mutate(data))} className="space-y-4 animate-in fade-in duration-300">
                            <div>
                              <p className="text-sm text-muted-foreground">Verification code sent to:</p>
                              <p className="font-medium text-sm break-all">{resetEmail}</p>
                            </div>
                            <FormField control={resetCodeForm.control} name="email" render={({ field }) => (
                              <FormItem style={{ display: "none" }}>
                                <FormControl><Input {...field} value={resetEmail} onChange={() => {}} /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={resetCodeForm.control} name="code" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Verification Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="000000" maxLength={6} data-testid="input-code-qr" className="bg-white/5 dark:bg-black/20" {...field}
                                    onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 6); field.onChange(val); }} />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">6-digit code from your email</p>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <div className="flex gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => { setResetStep("email"); resetCodeForm.reset(); }} className="flex-1">Back</Button>
                              <Button type="submit" disabled={verifyCodeMutation.isPending || resetCodeForm.getValues("code").length !== 6} className="flex-1 hover-elevate admin-btn-glow" data-testid="button-verify-code-qr">
                                {verifyCodeMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : <><ArrowRight className="w-4 h-4 mr-2" /> Next</>}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      )}
                      {resetStep === "password" && (
                        <Form {...resetPasswordForm}>
                          <form onSubmit={resetPasswordForm.handleSubmit((data) => resetPasswordMutation.mutate(data))} className="space-y-4 animate-in fade-in duration-300">
                            <p className="text-sm text-muted-foreground">Create your new password</p>
                            <FormField control={resetPasswordForm.control} name="newPassword" render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl><Input type="password" placeholder="••••••••" data-testid="input-new-password-qr" className="bg-white/5 dark:bg-black/20" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={resetPasswordForm.control} name="confirmPassword" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl><Input type="password" placeholder="••••••••" data-testid="input-confirm-password-qr" className="bg-white/5 dark:bg-black/20" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <div className="flex gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => { setResetStep("code"); resetPasswordForm.reset(); }} className="flex-1">Back</Button>
                              <Button type="submit" disabled={resetPasswordMutation.isPending} className="flex-1 hover-elevate admin-btn-glow" data-testid="button-reset-password-qr">
                                {resetPasswordMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting...</> : <><Lock className="w-4 h-4 mr-2" /> Reset Password</>}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Sign Up link */}
                  <motion.div
                    className="text-center pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                  </motion.div>
                </motion.div>
              )}

              {step === "choose-2fa" && (
                <motion.div key="choose-2fa" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="w-full h-auto flex-col gap-2 py-6 border-[#8a50e8]/20 hover:border-[#8a50e8]/50 transition-all" onClick={() => setStep("totp")}>
                        <Smartphone className="w-6 h-6" />
                        <span>Authenticator App</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="w-full h-auto flex-col gap-2 py-6 border-[#8a50e8]/20 hover:border-[#8a50e8]/50 transition-all" onClick={() => setStep("email-otp")}>
                        <Mail className="w-6 h-6" />
                        <span>Email Code</span>
                      </Button>
                    </motion.div>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => { setStep("credentials"); setLoginSession(null); }}>
                    Back to Login
                  </Button>
                </motion.div>
              )}

              {step === "totp" && (
                <motion.div key="totp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <div className="flex justify-center mb-2">
                    <Shield className="w-12 h-12 text-[#8a50e8]" />
                  </div>
                  <Form {...totpForm}>
                    <form onSubmit={totpForm.handleSubmit(onTotpSubmit)} className="space-y-4">
                      <FormField control={totpForm.control} name="token" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Authenticator Code</FormLabel>
                          <FormControl>
                            <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest font-mono bg-white/5 dark:bg-black/20 border-[#8a50e8]/20" {...field}
                              onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 6); field.onChange(val); }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={isSubmitting || totpForm.getValues("token").length !== 6} className="w-full admin-btn-glow">
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : "Verify & Login"}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep("credentials"); setLoginSession(null); totpForm.reset(); }}>
                        Back to Login
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              )}

              {step === "email-otp" && (
                <motion.div key="email-otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <div className="flex justify-center mb-2">
                    <Mail className="w-12 h-12 text-[#8a50e8]" />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    A verification code has been sent to your registered email. It expires in 10 minutes.
                  </p>
                  <Form {...emailOtpForm}>
                    <form onSubmit={emailOtpForm.handleSubmit(onEmailOtpSubmit)} className="space-y-4">
                      <FormField control={emailOtpForm.control} name="otp" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Verification Code</FormLabel>
                          <FormControl>
                            <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest font-mono bg-white/5 dark:bg-black/20 border-[#8a50e8]/20" {...field}
                              onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 6); field.onChange(val); }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={isSubmitting || emailOtpForm.getValues("otp").length !== 6} className="w-full admin-btn-glow">
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : "Verify & Login"}
                      </Button>
                    </form>
                  </Form>
                  <Button type="button" variant="outline" className="w-full border-[#8a50e8]/20" onClick={handleResendOtp}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resend Code
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep("credentials"); setLoginSession(null); emailOtpForm.reset(); }}>
                    Back to Login
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      <QRAuthModal
        open={showQRAuth}
        onClose={() => setShowQRAuth(false)}
        onAuthenticate={() => {}}
      />
    </div>
  );
}
