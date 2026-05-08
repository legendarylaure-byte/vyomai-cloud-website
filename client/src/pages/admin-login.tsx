import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Mail, ArrowRight } from "lucide-react";
import { AnimatedLogo } from "@/components/animated-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { resetPasswordRequestSchema, verifyResetCodeSchema, resetPasswordSchema, type ResetPasswordRequest, type VerifyResetCode, type ResetPassword } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetStep, setResetStep] = useState<"email" | "code" | "password">("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const emailForm = useForm<ResetPasswordRequest>({
    resolver: zodResolver(resetPasswordRequestSchema),
    defaultValues: {
      email: "",
    },
  });

  const codeForm = useForm<VerifyResetCode>({
    resolver: zodResolver(verifyResetCodeSchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  const passwordForm = useForm<ResetPassword>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const requestResetMutation = useMutation({
    mutationFn: async (data: ResetPasswordRequest) => {
      return apiRequest("POST", "/api/admin/request-password-reset", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Verification code sent to email" });
      setResetEmail(emailForm.getValues("email"));
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
      setResetCode(codeForm.getValues("code"));
      setResetStep("password");
      passwordForm.setValue("email", resetEmail);
      passwordForm.setValue("code", codeForm.getValues("code"));
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
      emailForm.reset();
      codeForm.reset();
      passwordForm.reset();
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

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/admin/login", data);
      const result = await response.json();
      if (result.success) {
        localStorage.setItem("vyomai-admin-token", result.token);
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        setLocation("/admin/dashboard");
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
      
      <Card className="w-full max-w-md glass-card border-0 relative">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <AnimatedLogo variant="login" showText={true} />
          </div>
          <CardTitle className="text-xl">Admin Login</CardTitle>
          <CardDescription>
            Access the dashboard to manage your website content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter username"
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
                        placeholder="Enter password"
                        {...field}
                        data-testid="input-admin-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-admin-login"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 space-y-4">
            <Dialog open={isForgotPasswordOpen} onOpenChange={(open) => {
              setIsForgotPasswordOpen(open);
              if (!open) {
                setResetStep("email");
                emailForm.reset();
                codeForm.reset();
                passwordForm.reset();
                setResetEmail("");
                setResetCode("");
              }
            }}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-sm hover-elevate"
                  data-testid="button-forgot-password"
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
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit((data) => requestResetMutation.mutate(data))} className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-sm text-muted-foreground">Enter your email to receive a verification code</p>
                      <FormField
                        control={emailForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email" 
                                placeholder="your.email@example.com" 
                                data-testid="input-forgot-email"
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
                          data-testid="button-request-reset-code"
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
                  <Form {...codeForm}>
                    <form onSubmit={codeForm.handleSubmit((data) => verifyCodeMutation.mutate(data))} className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <p className="text-sm text-muted-foreground">Verification code sent to:</p>
                        <p className="font-medium text-sm break-all">{resetEmail}</p>
                      </div>
                      <FormField
                        control={codeForm.control}
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
                        control={codeForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Verification Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="000000" 
                                maxLength={6}
                                data-testid="input-forgot-code"
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
                            codeForm.reset();
                          }}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={verifyCodeMutation.isPending || codeForm.getValues("code").length !== 6}
                          className="flex-1 hover-elevate"
                          data-testid="button-verify-reset-code"
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
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit((data) => resetPasswordMutation.mutate(data))} className="space-y-4 animate-in fade-in duration-300">
                      <p className="text-sm text-muted-foreground">Create your new password</p>
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                data-testid="input-forgot-new-password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="••••••••" 
                                data-testid="input-forgot-confirm-password"
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
                            passwordForm.reset();
                          }}
                          className="flex-1"
                        >
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={resetPasswordMutation.isPending}
                          className="flex-1 hover-elevate"
                          data-testid="button-reset-password-login"
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

            <p className="text-xs text-muted-foreground text-center">
              Default: admin / admin123
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
