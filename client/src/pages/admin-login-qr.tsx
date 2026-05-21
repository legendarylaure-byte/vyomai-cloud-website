import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Mail, Shield, Smartphone, ArrowRight, RotateCcw } from "lucide-react";
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
    onSuccess: () => {
      toast({ title: "Success", description: "Verification code sent to email" });
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
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-[hsl(262_83%_58%/0.05)] to-[hsl(24_95%_53%/0.08)] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(262_83%_58%/0.15)] rounded-full blur-3xl animate-float" style={{ animationDuration: "15s" }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(24_95%_53%/0.12)] rounded-full blur-3xl animate-float" style={{ animationDuration: "20s", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[hsl(200_80%_50%/0.1)] rounded-full blur-3xl animate-float" style={{ animationDuration: "18s", animationDelay: "4s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md glass-card border-0 relative">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <AnimatedLogo variant="login" showText={true} />
            </div>
            <CardTitle className="text-xl">
              {step === "credentials" ? "Secure Login" : "Two-Factor Authentication"}
            </CardTitle>
            <CardDescription>
              {step === "credentials" && "Sign in to manage your website"}
              {step === "totp" && "Enter the 6-digit code from your authenticator app"}
              {step === "email-otp" && "Enter the verification code sent to your email"}
              {step === "choose-2fa" && "Choose your 2FA method"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === "credentials" && (
                <motion.div key="credentials" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField control={form.control} name="username" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="admin" {...field} data-testid="input-admin-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} data-testid="input-admin-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button type="submit" disabled={isSubmitting} className="w-full" data-testid="button-login-submit">
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
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>
                  )}

                  {googleLoginEnabled && (
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={onGoogleSuccess}
                        onError={() => toast({ title: "Google Login Failed", description: "An error occurred.", variant: "destructive" })}
                        size="large"
                        theme="outline"
                        shape="rectangular"
                        text="signin_with"
                      />
                    </div>
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
                      <Button type="button" variant="ghost" className="w-full text-sm hover-elevate" data-testid="button-forgot-password-qr">
                        <Mail className="w-4 h-4 mr-2" />
                        Forgot Password?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md overflow-hidden">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-primary" />
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
                                  <Input type="email" placeholder="your.email@example.com" data-testid="input-reset-email-qr" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <div className="flex gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => setIsForgotPasswordOpen(false)} className="flex-1">Cancel</Button>
                              <Button type="submit" disabled={requestResetMutation.isPending} className="flex-1 hover-elevate" data-testid="button-request-code-qr">
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
                                  <Input placeholder="000000" maxLength={6} data-testid="input-code-qr" {...field}
                                    onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 6); field.onChange(val); }} />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">6-digit code from your email</p>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <div className="flex gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => { setResetStep("email"); resetCodeForm.reset(); }} className="flex-1">Back</Button>
                              <Button type="submit" disabled={verifyCodeMutation.isPending || resetCodeForm.getValues("code").length !== 6} className="flex-1 hover-elevate" data-testid="button-verify-code-qr">
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
                                <FormControl><Input type="password" placeholder="••••••••" data-testid="input-new-password-qr" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={resetPasswordForm.control} name="confirmPassword" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl><Input type="password" placeholder="••••••••" data-testid="input-confirm-password-qr" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <div className="flex gap-2 pt-4">
                              <Button type="button" variant="outline" onClick={() => { setResetStep("code"); resetPasswordForm.reset(); }} className="flex-1">Back</Button>
                              <Button type="submit" disabled={resetPasswordMutation.isPending} className="flex-1 hover-elevate" data-testid="button-reset-password-qr">
                                {resetPasswordMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting...</> : <><Lock className="w-4 h-4 mr-2" /> Reset Password</>}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      )}
                    </DialogContent>
                  </Dialog>
                </motion.div>
              )}

              {step === "choose-2fa" && (
                <motion.div key="choose-2fa" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="w-full h-auto flex-col gap-2 py-6" onClick={() => setStep("totp")}>
                        <Smartphone className="w-6 h-6" />
                        <span>Authenticator App</span>
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="w-full h-auto flex-col gap-2 py-6" onClick={() => setStep("email-otp")}>
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
                    <Shield className="w-12 h-12 text-primary" />
                  </div>
                  <Form {...totpForm}>
                    <form onSubmit={totpForm.handleSubmit(onTotpSubmit)} className="space-y-4">
                      <FormField control={totpForm.control} name="token" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Authenticator Code</FormLabel>
                          <FormControl>
                            <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest font-mono" {...field}
                              onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 6); field.onChange(val); }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={isSubmitting || totpForm.getValues("token").length !== 6} className="w-full">
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
                    <Mail className="w-12 h-12 text-primary" />
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
                            <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest font-mono" {...field}
                              onChange={(e) => { const val = e.target.value.replace(/\D/g, "").slice(0, 6); field.onChange(val); }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={isSubmitting || emailOtpForm.getValues("otp").length !== 6} className="w-full">
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : "Verify & Login"}
                      </Button>
                    </form>
                  </Form>
                  <Button type="button" variant="outline" className="w-full" onClick={handleResendOtp}>
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
