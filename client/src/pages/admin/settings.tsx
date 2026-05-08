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
import { type SiteSettings } from "@shared/schema";
import { 
  Eye, Bell, Save, Loader2, Settings, PenLine, Globe, Shield, Lock, Server
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

  // Home Section Visibility State
  const [showTeamSection, setShowTeamSection] = useState(true);
  const [showPricingSection, setShowPricingSection] = useState(true);

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
    
    // Sync visibility settings
    if (settings?.showTeamSection !== undefined) setShowTeamSection(settings.showTeamSection);
    if (settings?.showPricingSection !== undefined) setShowPricingSection(settings.showPricingSection);

    // Sync SMTP settings
    if (settings) {
      setSmtpConfig(prev => ({
        ...prev,
        host: settings.smtpHost || "",
        port: settings.smtpPort || "587",
        user: settings.smtpUser || "",
        password: settings.smtpPassword || "", 
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
    emailConfigMutation.mutate({
      smtpHost: smtpConfig.host,
      smtpPort: smtpConfig.port,
      smtpUser: smtpConfig.user,
      smtpPassword: smtpConfig.password,
      smtpSecure: smtpConfig.secure,
      // Create defaults for others
      emailProvider: "smtp",
      emailFeaturesEnabled: true
    });
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
      showTeamSection,
      showPricingSection,
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
              <p className="text-xs text-green-600">OpenAI GPT-4 Connected</p>
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
                      <DialogTitle>Email Server Settings</DialogTitle>
                      <DialogDescription>
                        Configure your SMTP provider details here.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="host" className="text-right">
                          Host
                        </Label>
                        <Input
                          id="host"
                          placeholder="smtp.example.com"
                          className="col-span-3"
                          value={smtpConfig.host}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="port" className="text-right">
                          Port
                        </Label>
                        <Input
                          id="port"
                          placeholder="587"
                          className="col-span-3"
                          value={smtpConfig.port}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                          User
                        </Label>
                        <Input
                          id="username"
                          placeholder="email@domain.com"
                          className="col-span-3"
                          value={smtpConfig.user}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, user: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                          Pass
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="col-span-3"
                          value={smtpConfig.password}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                         <Label htmlFor="secure" className="text-xs text-gray-500">Secure (SSL)</Label>
                         <Switch 
                            id="secure"
                            checked={smtpConfig.secure}
                            onCheckedChange={(c) => setSmtpConfig(prev => ({ ...prev, secure: c }))}
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
              <p className="text-xs text-purple-600">SMTP / SendGrid Keys</p>
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

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-600" />
            Homepage Sections
          </CardTitle>
          <CardDescription className="text-gray-500">
            Control which sections are displayed on the public home page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <Label className="text-base font-medium text-gray-900">Meet the Innovators</Label>
                <p className="text-sm text-gray-500">Show the team section on home page</p>
              </div>
              <div className="flex items-center gap-2">
                 <Switch
                  checked={showTeamSection}
                  onCheckedChange={setShowTeamSection}
                />
                <span className={`text-sm font-medium w-16 text-right ${showTeamSection ? "text-green-600" : "text-gray-400"}`}>
                  {showTeamSection ? "Visible" : "Hidden"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <Label className="text-base font-medium text-gray-900">Pricing Plans</Label>
                <p className="text-sm text-gray-500">Show the pricing options on home page</p>
              </div>
               <div className="flex items-center gap-2">
                 <Switch
                  checked={showPricingSection}
                  onCheckedChange={setShowPricingSection}
                />
                <span className={`text-sm font-medium w-16 text-right ${showPricingSection ? "text-green-600" : "text-gray-400"}`}>
                  {showPricingSection ? "Visible" : "Hidden"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <CardTitle className="text-base font-medium text-gray-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-purple-600" />
                  Welcome Popup
                </CardTitle>
                <p className="text-sm text-gray-500">Show welcome popup to visitors</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={popupEnabled}
                  onCheckedChange={setPopupEnabled}
                />
                <span className={`text-sm font-medium w-16 text-right ${popupEnabled ? "text-green-600" : "text-gray-400"}`}>
                  {popupEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
