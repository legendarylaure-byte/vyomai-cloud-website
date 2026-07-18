import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
// AdminLayout import removed
import { Button } from "@/components/ui/button";
// Textarea import removed
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type SiteSettings, type User } from "@shared/schema";
import { 
  Save, Loader2, Settings, PenLine, Globe, Shield, Lock, Server, Smartphone, Mail, QrCode
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRAuthModal } from "@/components/qr-auth-modal";
import { Separator } from "@/components/ui/separator";

export function SettingsPage() {
  const { toast } = useToast();
  
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [popupTitle, setPopupTitle] = useState("Welcome to VyomAi");
  const [popupMessage, setPopupMessage] = useState("Experience the future of AI solutions. Let us transform your business with intelligent automation.");
  const [popupButtonText, setPopupButtonText] = useState("Explore Now");
  const [popupImageUrl, setPopupImageUrl] = useState("");
  const [popupAnimationStyle, setPopupAnimationStyle] = useState("fade");
  const [popupDismissable, setPopupDismissable] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings?.welcomePopupEnabled !== undefined) setPopupEnabled(settings.welcomePopupEnabled);
    if (settings?.welcomePopupTitle) setPopupTitle(settings.welcomePopupTitle);
    if (settings?.welcomePopupMessage) setPopupMessage(settings.welcomePopupMessage);
    if (settings?.welcomePopupButtonText) setPopupButtonText(settings.welcomePopupButtonText);
    if (settings?.welcomePopupImageUrl) setPopupImageUrl(settings.welcomePopupImageUrl);
    if (settings?.welcomePopupAnimationStyle) setPopupAnimationStyle(settings.welcomePopupAnimationStyle);
    if (settings?.welcomePopupDismissable !== undefined) setPopupDismissable(settings.welcomePopupDismissable);

    // Sync Resend SMTP settings
    if (settings) {
      setSmtpConfig(prev => ({
        ...prev,
        host: settings.smtpHost || "",
        port: settings.smtpPort || "587",
        user: settings.smtpUser || "",
        password: settings.smtpPassword ? "" : "",
        secure: settings.smtpSecure || false
      }));
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/settings", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });
  const [configOpen, setConfigOpen] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: "587",
    user: "",
    password: "",
    secure: false
  });

  const [twoFactorMethod, setTwoFactorMethod] = useState<string>("none");
  const [showQrSetup, setShowQrSetup] = useState(false);

  const { data: userProfile } = useQuery<User>({
    queryKey: ["/api/admin/me"],
  });

  useEffect(() => {
    if (userProfile?.twoFactorMethod) {
      setTwoFactorMethod(userProfile.twoFactorMethod);
    }
  }, [userProfile]);

  const update2FAMutation = useMutation({
    mutationFn: async (method: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/user/2fa-settings", { twoFactorMethod: method }, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      toast({ title: "2FA settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update 2FA settings", variant: "destructive" });
    },
  });

  const handle2FAChange = (val: string) => {
    setTwoFactorMethod(val);
    if (val === "totp" || val === "both") {
      setShowQrSetup(true);
    }
    if (val === "none" || val === "email") {
      update2FAMutation.mutate(val);
    }
  };

  const emailConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/email-config", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Email configuration saved" });
      setConfigOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save configuration", variant: "destructive" });
    },
  });

  const handleSaveConfig = () => {
    const payload: any = {
      smtpHost: smtpConfig.host || "smtp.resend.com",
      smtpPort: smtpConfig.port || "587",
      smtpUser: smtpConfig.user || "resend",
      smtpSecure: smtpConfig.secure,
      emailProvider: "smtp",
      emailFeaturesEnabled: true,
    };
    // Only send password if user actually changed it (not the masked placeholder)
    if (smtpConfig.password && smtpConfig.password !== "") {
      payload.smtpPassword = smtpConfig.password;
    }
    emailConfigMutation.mutate(payload);
  };


  const handleSaveAll = () => {
    updateSettingsMutation.mutate({
      welcomePopupEnabled: popupEnabled,
      welcomePopupTitle: popupTitle,
      welcomePopupMessage: popupMessage,
      welcomePopupButtonText: popupButtonText,
      welcomePopupImageUrl: popupImageUrl,
      welcomePopupAnimationStyle: popupAnimationStyle,
      welcomePopupDismissable: popupDismissable,
    });
  };



  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({ title: "Error", description: "Please enter an email address", variant: "destructive" });
      return;
    }
    
    setIsTesting(true);
    try {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: testEmail }),
      });
      
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: `Test email sent via ${data.provider}!` });
        setTestEmail("");
      } else {
        toast({ title: "Error", description: data.error || "Failed to send test email", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send test email", variant: "destructive" });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-600" />
            Site Settings
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Configure site-wide settings and welcome popup
          </p>
        </div>
        <Button 
          onClick={handleSaveAll}
          disabled={updateSettingsMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {updateSettingsMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save All Settings
        </Button>
      </div>

      {/* Smart Email & AI Status Card */}
      <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-white to-purple-50/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin-slow" />
            Smart AI & Email System
          </CardTitle>
          <CardDescription className="text-gray-500">
            Real-time status of your autonomous agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex flex-col gap-2">
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">AI Brain</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-lg font-bold text-gray-900">Active</span>
              </div>
              <p className="text-xs text-green-600">Gemini 2.5 Flash Connected</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col gap-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Email System</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-lg font-bold text-gray-900">Forwarding</span>
              </div>
              <p className="text-xs text-blue-600">To: info@vyomai.cloud</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Configure</span>
                <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-purple-200 rounded-full">
                      <Settings className="w-3.5 h-3.5 text-purple-700" />
                    </Button>
                  </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Resend API Configuration</DialogTitle>
                      <DialogDescription>
                        Enter your Resend API key to enable email sending via Resend SMTP.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs text-muted-foreground">
                          Host
                        </Label>
                        <div className="col-span-3 text-sm font-mono text-muted-foreground">smtp.resend.com</div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs text-muted-foreground">
                          Port
                        </Label>
                        <div className="col-span-3 text-sm font-mono text-muted-foreground">587</div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs text-muted-foreground">
                          User
                        </Label>
                        <div className="col-span-3 text-sm font-mono text-muted-foreground">resend</div>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          API Key
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="re_..."
                          className="col-span-3"
                          value={smtpConfig.password}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleSaveConfig} disabled={emailConfigMutation.isPending}>
                        {emailConfigMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Configuration
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-lg font-bold text-gray-900">Settings</span>
              </div>
              <p className="text-xs text-purple-600">Resend API Key</p>
            </div>
          </div>

          {/* Quick Test */}
          <div className="flex items-end gap-4 p-4 bg-white/50 rounded-xl border border-gray-100">
            <div className="flex-1 space-y-2">
              <Label>Send Test Email</Label>
              <div className="flex gap-2">
                 {/* Input removed from import, replaced with standard input element to avoid import issues or need to import Input component */}
                 <input
                  type="email"
                  placeholder="Enter email to test..."
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <Button 
                  onClick={sendTestEmail}
                  disabled={isTesting}
                  variant="outline"
                >
                  {isTesting ? "Sending..." : "Test"}
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-400 pb-2">
              Verifies AI content generation and delivery.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security & 2FA Settings */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Security & Two-Factor Authentication
          </CardTitle>
          <CardDescription className="text-gray-500">
            Configure your 2FA preferences for login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">2FA Method</Label>
              <p className="text-sm text-muted-foreground">
                Choose how to secure your admin login
              </p>
            </div>
            <Select
              value={twoFactorMethod}
              onValueChange={handle2FAChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-2">None (Password only)</span>
                </SelectItem>
                <SelectItem value="email">
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email OTP</span>
                </SelectItem>
                <SelectItem value="totp">
                  <span className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> Authenticator App</span>
                </SelectItem>
                <SelectItem value="both">
                  <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Email or App (choose)</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Authenticator App</Label>
              <p className="text-sm text-muted-foreground">
                Set up TOTP with Google Authenticator or similar
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowQrSetup(true)}
              disabled={twoFactorMethod === "none"}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Setup QR Code
            </Button>
          </div>

          {update2FAMutation.isPending && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </p>
          )}
        </CardContent>
      </Card>

      <QRAuthModal
        open={showQrSetup}
        onClose={() => setShowQrSetup(false)}
        onAuthenticate={() => {
          setTwoFactorMethod("totp");
          update2FAMutation.mutate("totp");
          setShowQrSetup(false);
        }}
      />
    </div>
  );
}
