import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { AnimatedLogo } from "@/components/animated-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";

const emailLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type EmailLoginFormData = z.infer<typeof emailLoginSchema>;

export default function EmailLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordInputValue, setPasswordInputValue] = useState("");

  const form = useForm<EmailLoginFormData>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: EmailLoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/email/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.error || "Invalid email or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { token } = await response.json();
      localStorage.setItem("vyomai-email-token", token);
      localStorage.setItem("vyomai-email-address", data.email);

      toast({
        title: "Success",
        description: "Welcome to your email inbox",
      });

      setLocation("/email/inbox");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to email server. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Playful Background - Same as Admin Login */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-[hsl(262_83%_58%/0.05)] to-[hsl(24_95%_53%/0.08)] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-20 left-10 w-72 h-72 bg-[hsl(262_83%_58%/0.15)] rounded-full blur-3xl animate-float" style={{ animationDuration: "15s" }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[hsl(24_95%_53%/0.12)] rounded-full blur-3xl animate-float" style={{ animationDuration: "20s", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[hsl(200_80%_50%/0.1)] rounded-full blur-3xl animate-float" style={{ animationDuration: "18s", animationDelay: "4s" }} />
      </div>
      <div className="absolute inset-0 particle-bg opacity-20" />
      <div className="absolute inset-0 mandala-pattern opacity-8" />

      <Card className="w-full max-w-md glass-card border-0 relative">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <AnimatedLogo variant="login" showText={true} />
          </div>
          <CardTitle className="text-xl flex items-center justify-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Access
          </CardTitle>
          <CardDescription>
            Access your VyomAi business email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground ${isLoading ? "animate-email-buffer" : ""}`} />
                        <Input
                          {...field}
                          type="email"
                          placeholder="shekhar@vyomai.cloud"
                          disabled={isLoading}
                          className="pl-10"
                          data-testid="input-email"
                        />
                      </div>
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
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          disabled={isLoading}
                          className="pl-10 pr-10"
                          data-testid="input-password"
                          onChange={(e) => {
                            field.onChange(e);
                            setPasswordInputValue(e.target.value);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${passwordInputValue ? "animate-eye-blink" : ""}`}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full hover-elevate"
                data-testid="button-login-email"
              >
                {isLoading ? (
                  <>
                    <Mail className="w-4 h-4 mr-2 animate-spin" />
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

          <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Tip:</span> Use your full VyomAi email address (e.g., shekhar@vyomai.cloud) and the password you set in Hostinger.
            </p>
          </div>

          <div className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLocation("/")}
              className="w-full text-sm hover-elevate"
              data-testid="link-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
