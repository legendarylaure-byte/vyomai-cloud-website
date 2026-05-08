import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Mail, Shield, ArrowRight } from "lucide-react";
import { AnimatedLogo } from "@/components/animated-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QRAuthModal } from "@/components/qr-auth-modal";
import { resetPasswordRequestSchema, verifyResetCodeSchema, resetPasswordSchema, type ResetPasswordRequest, type VerifyResetCode, type ResetPassword } from "@shared/schema";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const emailOtpSchema = z.object({
  email: z.string().email("Invalid email"),
  otp: z.string().min(6, "OTP must be 6 digits"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type EmailOtpData = z.infer<typeof emailOtpSchema>;

export default function AdminLoginQR() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRAuth, setShowQRAuth] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "code" | "password">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const emailForm = useForm<EmailOtpData>({
    resolver: zodResolver(emailOtpSchema),
    defaultValues: { email: "", otp: "" },
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
        variant: "destructive"
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
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: "Invalid or expired code",
        variant: "destructive"
      });
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
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to reset password",
        variant: "destructive"
      });
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await apiRequest("POST", "/api/admin/login", data);
      if (result.success) {
        // Store the server-generated token immediately
        localStorage.setItem("vyomai-admin-token", result.token);
        setShowQRAuth(true);
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQRAuthenticate = (token: string) => {
    // QR is just for 2FA verification, token is already saved from server
    toast({
      title: "Welcome!",
      description: "QR authentication successful!",
    });
    setLocation("/admin/dashboard");
  };

  const onEmailOtpSubmit = async (data: EmailOtpData) => {
    setIsSubmitting(true);
    try {
      if (data.otp === "123456") {
        // Get the token that was saved during login, don't create a fake one
        const savedToken = localStorage.getItem("vyomai-admin-token");
        if (savedToken && !savedToken.startsWith("email-verified")) {
          toast({
            title: "Welcome!",
            description: "Email 2FA verified successfully!",
          });
          setLocation("/admin/dashboard");
        } else {
          toast({
            title: "Invalid OTP",
            description: "The OTP you entered is incorrect.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Invalid OTP",
          description: "The OTP you entered is incorrect.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Playful Background */}
      <div className="absolute inset-0">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-[hsl(262_83%_58%/0.05)] to-[hsl(24_95%_53%/0.08)] animate-pulse" style={{ animationDuration: "8s" }} />
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(262_83%_58%/0.15)] rounded-full blur-3xl animate-float" style={{ animationDuration: "15s" }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(24_95%_53%/0.12)] rounded-full blur-3xl animate-float" style={{ animationDuration: "20s", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[hsl(200_80%_50%/0.1)] rounded-full blur-3xl animate-float" style={{ animationDuration: "18s", animationDelay: "4s" }} />
      </div>

      {/* Particle effect */}
      <div className="absolute inset-0 particle-bg opacity-20" />
      {/* Mandala pattern */}
      <div className="absolute inset-0 mandala-pattern opacity-8" />

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
            <CardTitle className="text-xl">Secure Login</CardTitle>
            <CardDescription>
              Step 1: Enter credentials. Step 2: Choose 2FA method
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="credentials" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="credentials">Credentials</TabsTrigger>
                <TabsTrigger value="2fa">2FA Options</TabsTrigger>
              </TabsList>

              <TabsContent value="credentials" className="space-y-4 mt-4">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="admin"
                              {...field}
                              data-testid="input-admin-username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="••••••••"
                              {...field}
                              data-testid="input-admin-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                        data-testid="button-login-submit"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Continue to 2FA
                          </>
                        )}
                      </Button>
                    </motion.div>

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
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="w-full text-sm hover-elevate"
                          data-testid="button-forgot-password-qr"
                        >
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

                        {/* STEP 1: Email Entry */}
                        {resetStep === "email" && (
                          <Form {...resetEmailForm}>
                            <form onSubmit={resetEmailForm.handleSubmit((data) => requestResetMutation.mutate(data))} className="space-y-4 animate-in fade-in duration-300">
                              <p className="text-sm text-muted-foreground">Enter your email to receive a verification code</p>
                              <FormField
                                control={resetEmailForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Personal Email</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="email" 
                                        placeholder="your.email@example.com" 
                                        data-testid="input-reset-email-qr"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2 pt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsForgotPasswordOpen(false)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={requestResetMutation.isPending}
                                  className="flex-1 hover-elevate"
                                  data-testid="button-request-code-qr"
                                >
                                  {requestResetMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    <>
                                      <ArrowRight className="w-4 h-4 mr-2" />
                                      Send Code
                                    </>
                                  )}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        )}

                        {/* STEP 2: Code Verification */}
                        {resetStep === "code" && (
                          <Form {...resetCodeForm}>
                            <form onSubmit={resetCodeForm.handleSubmit((data) => verifyCodeMutation.mutate(data))} className="space-y-4 animate-in fade-in duration-300">
                              <div>
                                <p className="text-sm text-muted-foreground">Verification code sent to:</p>
                                <p className="font-medium text-sm break-all">{resetEmail}</p>
                              </div>
                              <FormField
                                control={resetCodeForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem style={{ display: "none" }}>
                                    <FormControl>
                                      <Input {...field} value={resetEmail} onChange={() => {}} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={resetCodeForm.control}
                                name="code"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Verification Code</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="000000" 
                                        maxLength={6}
                                        data-testid="input-code-qr"
                                        {...field}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                                          field.onChange(val);
                                        }}
                                      />
                                    </FormControl>
                                    <p className="text-xs text-muted-foreground">6-digit code from your email</p>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2 pt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setResetStep("email");
                                    resetCodeForm.reset();
                                  }}
                                  className="flex-1"
                                >
                                  Back
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={verifyCodeMutation.isPending || resetCodeForm.getValues("code").length !== 6}
                                  className="flex-1 hover-elevate"
                                  data-testid="button-verify-code-qr"
                                >
                                  {verifyCodeMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Verifying...
                                    </>
                                  ) : (
                                    <>
                                      <ArrowRight className="w-4 h-4 mr-2" />
                                      Next
                                    </>
                                  )}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        )}

                        {/* STEP 3: New Password */}
                        {resetStep === "password" && (
                          <Form {...resetPasswordForm}>
                            <form onSubmit={resetPasswordForm.handleSubmit((data) => resetPasswordMutation.mutate(data))} className="space-y-4 animate-in fade-in duration-300">
                              <p className="text-sm text-muted-foreground">Create your new password</p>
                              <FormField
                                control={resetPasswordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        data-testid="input-new-password-qr"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={resetPasswordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        data-testid="input-confirm-password-qr"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2 pt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setResetStep("code");
                                    resetPasswordForm.reset();
                                  }}
                                  className="flex-1"
                                >
                                  Back
                                </Button>
                                <Button 
                                  type="submit" 
                                  disabled={resetPasswordMutation.isPending}
                                  className="flex-1 hover-elevate"
                                  data-testid="button-reset-password-qr"
                                >
                                  {resetPasswordMutation.isPending ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Resetting...
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-4 h-4 mr-2" />
                                      Reset Password
                                    </>
                                  )}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        )}
                      </DialogContent>
                    </Dialog>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="2fa" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-auto flex-col gap-2 py-4"
                      onClick={() => setShowQRAuth(true)}
                      data-testid="button-qr-auth"
                    >
                      <Shield className="w-5 h-5" />
                      QR Code
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-auto flex-col gap-2 py-4"
                      onClick={() => {
                        setEmailOtpSent(true);
                        toast({
                          title: "OTP Sent",
                          description: "Check your email for the OTP code (Demo: 123456)",
                        });
                      }}
                      data-testid="button-email-otp"
                    >
                      <Mail className="w-5 h-5" />
                      Email 2FA
                    </Button>
                  </motion.div>
                </div>

                {emailOtpSent && (
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onEmailOtpSubmit)} className="space-y-3 mt-4 pt-4 border-t">
                      <FormField
                        control={emailForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="admin@vyomai.cloud" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={emailForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>OTP (Demo: 123456)</FormLabel>
                            <FormControl>
                              <Input placeholder="000000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify & Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <QRAuthModal
        open={showQRAuth}
        onClose={() => setShowQRAuth(false)}
        onAuthenticate={handleQRAuthenticate}
      />
    </div>
  );
}
