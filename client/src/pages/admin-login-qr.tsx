import { useState, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Mail, Shield, Smartphone, ArrowRight, RotateCcw, UserPlus, Sparkles, Eye, EyeOff } from "lucide-react";
import { AnimatedLogo } from "@/components/animated-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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

function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full animate-morph-blob bg-gradient-to-r from-purple-600/20 to-blue-600/10 animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full animate-morph-blob bg-gradient-to-r from-orange-500/15 to-pink-500/10 animate-pulse-glow" style={{ animationDelay: "-3s", borderRadius: "40% 60% 60% 40% / 50% 40% 60% 50%" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full animate-morph-blob bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-pulse-glow" style={{ animationDelay: "-6s" }} />
    </div>
  );
}

function OrbitingRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
      <div className="relative w-96 h-96">
        <div className="absolute inset-0 border border-purple-500/20 rounded-full animate-orbit" />
        <div className="absolute inset-0 border border-cyan-500/20 rounded-full animate-orbit-reverse" style={{ width: "70%", height: "70%", top: "15%", left: "15%" }} />
        <div className="absolute top-0 left-1/2 w-3 h-3 bg-purple-400 rounded-full shadow-lg shadow-purple-500/50 animate-orbit" />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-500/50 animate-orbit-reverse" />
      </div>
    </div>
  );
}

function GeometricShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div className="absolute top-[15%] right-[20%] animate-float-3d">
        <div className="w-16 h-16 border-2 border-purple-400/40 rounded-lg animate-rotate-3d" />
      </div>
      <div className="absolute bottom-[25%] left-[15%] animate-float-3d" style={{ animationDelay: "-2s" }}>
        <div className="w-12 h-12 border-2 border-cyan-400/40 rounded-full animate-rotate-3d-y" />
      </div>
      <div className="absolute top-[40%] left-[10%] animate-float-3d" style={{ animationDelay: "-4s" }}>
        <div className="w-8 h-8 border-2 border-orange-400/40 animate-rotate-3d" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
      </div>
      <div className="absolute bottom-[35%] right-[10%] animate-float-3d" style={{ animationDelay: "-1s" }}>
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-transparent rounded-lg animate-rotate-3d-y" />
      </div>
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number }[] = [];
    const MAX = 60;

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < MAX; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        life: Math.random() * 200 + 100,
      });
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = Math.random() * 200 + 100;
        }

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${p.alpha})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleField />
      <FloatingOrbs />
      <OrbitingRings />
      <GeometricShapes />

      {/* Grid overlay */}
      <div className="absolute inset-0 grid-3d-bg opacity-30" />

      {/* Scan line */}
      <div className="absolute inset-0 scanning-line" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10"
      >
        <Card
          ref={cardRef}
          className="w-full max-w-md card-3d-tilt border-0 relative overflow-hidden animate-border-glow"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />

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
                  className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-xl"
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
              <CardTitle className="text-xl bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
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
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Username
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="admin"
                                {...field}
                                data-testid="input-admin-username"
                                className="pl-9 bg-white/5 dark:bg-black/20 border-purple-500/20 focus:border-purple-500/50 transition-all duration-300"
                              />
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                {...field}
                                data-testid="input-admin-password"
                                className="pl-9 pr-9 bg-white/5 dark:bg-black/20 border-purple-500/20 focus:border-purple-500/50 transition-all duration-300"
                              />
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/50" />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400/50 hover:text-purple-400 transition-colors"
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
                          className="w-full relative overflow-hidden group bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 transition-all duration-300"
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
                        <span className="w-full border-t border-purple-500/20" />
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
                        <Mail className="w-4 h-4 mr-2 group-hover:text-purple-400 transition-colors" />
                        Forgot Password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md overflow-hidden border-purple-500/20">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-purple-400" />
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
                              <Button type="submit" disabled={requestResetMutation.isPending} className="flex-1 hover-elevate bg-gradient-to-r from-purple-600 to-cyan-600" data-testid="button-request-code-qr">
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
                              <Button type="submit" disabled={verifyCodeMutation.isPending || resetCodeForm.getValues("code").length !== 6} className="flex-1 hover-elevate bg-gradient-to-r from-purple-600 to-cyan-600" data-testid="button-verify-code-qr">
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
                              <Button type="submit" disabled={resetPasswordMutation.isPending} className="flex-1 hover-elevate bg-gradient-to-r from-purple-600 to-cyan-600" data-testid="button-reset-password-qr">
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
                      <Button variant="outline" className="w-full h-auto flex-col gap-2 py-6 border-purple-500/20 hover:border-purple-500/50 transition-all" onClick={() => setStep("totp")}>
                        <Smartphone className="w-6 h-6" />
                        <span>Authenticator App</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="w-full h-auto flex-col gap-2 py-6 border-purple-500/20 hover:border-purple-500/50 transition-all" onClick={() => setStep("email-otp")}>
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
                    <Shield className="w-12 h-12 text-purple-400" />
                  </div>
                  <Form {...totpForm}>
                    <form onSubmit={totpForm.handleSubmit(onTotpSubmit)} className="space-y-4">
                      <FormField control={totpForm.control} name="token" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Authenticator Code</FormLabel>
                          <FormControl>
                            <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest font-mono bg-white/5 dark:bg-black/20 border-purple-500/20" {...field}
                              onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 6); field.onChange(val); }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={isSubmitting || totpForm.getValues("token").length !== 6} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600">
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
                    <Mail className="w-12 h-12 text-purple-400" />
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
                            <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest font-mono bg-white/5 dark:bg-black/20 border-purple-500/20" {...field}
                              onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 6); field.onChange(val); }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={isSubmitting || emailOtpForm.getValues("otp").length !== 6} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600">
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : "Verify & Login"}
                      </Button>
                    </form>
                  </Form>
                  <Button type="button" variant="outline" className="w-full border-purple-500/20" onClick={handleResendOtp}>
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
