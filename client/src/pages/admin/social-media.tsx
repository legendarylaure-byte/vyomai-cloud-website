import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Linkedin, Instagram, Facebook, Youtube, MessageCircle, Phone,
  Link2, ExternalLink, Check, X, TrendingUp, Users, Heart, Share2,
  Save, RefreshCw, BarChart3, Eye, Globe, ArrowUpRight, Zap
} from "lucide-react";
import type { SiteSettings, SocialMediaIntegration } from "@shared/schema";

const socialPlatforms = [
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    icon: Linkedin, 
    color: "bg-blue-600",
    lightBg: "bg-blue-50",
    urlPlaceholder: "https://linkedin.com/company/vyomai",
    description: "Professional networking"
  },
  { 
    id: "instagram", 
    name: "Instagram", 
    icon: Instagram, 
    color: "bg-gradient-to-br from-pink-500 to-purple-600",
    lightBg: "bg-pink-50",
    urlPlaceholder: "https://instagram.com/vyomai",
    description: "Visual storytelling"
  },
  { 
    id: "facebook", 
    name: "Facebook", 
    icon: Facebook, 
    color: "bg-blue-500",
    lightBg: "bg-blue-50",
    urlPlaceholder: "https://facebook.com/vyomai",
    description: "Community engagement"
  },
  { 
    id: "youtube", 
    name: "YouTube", 
    icon: Youtube, 
    color: "bg-red-500",
    lightBg: "bg-red-50",
    urlPlaceholder: "https://youtube.com/@vyomai",
    description: "Video content"
  },
  { 
    id: "whatsapp", 
    name: "WhatsApp", 
    icon: MessageCircle, 
    color: "bg-green-500",
    lightBg: "bg-green-50",
    urlPlaceholder: "https://wa.me/9779812345678",
    description: "Direct messaging"
  },
  { 
    id: "viber", 
    name: "Viber", 
    icon: Phone, 
    color: "bg-purple-500",
    lightBg: "bg-purple-50",
    urlPlaceholder: "viber://chat?number=9779812345678",
    description: "Messaging platform"
  },
];

export default function SocialMediaAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedLinks, setEditedLinks] = useState<Record<string, string>>({});
  const [editedEnabled, setEditedEnabled] = useState<Record<string, boolean>>({});

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<SiteSettings>) => {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Success", description: "Social media settings saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const currentLinks = settings?.socialLinks || {};
    const currentEnabled = settings?.socialMediaEnabled || {};
    
    const newLinks = { ...currentLinks, ...editedLinks };
    const newEnabled = { ...currentEnabled, ...editedEnabled } as any;
    
    updateMutation.mutate({
      socialLinks: newLinks,
      socialMediaEnabled: newEnabled,
    });
  };

  const getLink = (platformId: string) => {
    return editedLinks[platformId] ?? (settings?.socialLinks as Record<string, string>)?.[platformId] ?? "";
  };

  const getEnabled = (platformId: string) => {
    return editedEnabled[platformId] ?? (settings?.socialMediaEnabled as Record<string, boolean>)?.[platformId] ?? true;
  };

  const connectedCount = socialPlatforms.filter(p => getLink(p.id)).length;
  const enabledCount = socialPlatforms.filter(p => getEnabled(p.id)).length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Share2 className="w-6 h-6 text-purple-600" />
              Social Media Dashboard
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage your social presence and track engagement
            </p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {updateMutation.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Connected Platforms</p>
                  <p className="text-3xl font-bold mt-1">{connectedCount}/{socialPlatforms.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Globe className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Visible on Site</p>
                  <p className="text-3xl font-bold mt-1">{enabledCount}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Eye className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Followers</p>
                  <p className="text-3xl font-bold mt-1">-</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-blue-200 mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Coming soon
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Engagement Rate</p>
                  <p className="text-3xl font-bold mt-1">-</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <Heart className="w-6 h-6" />
                </div>
              </div>
              <p className="text-xs text-pink-200 mt-2 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Coming soon
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Performance Analytics
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Track your social media metrics across all platforms
                </CardDescription>
              </div>
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                Analytics Coming Soon
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Reach", value: "-", icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Total Shares", value: "-", icon: Share2, color: "text-green-600", bg: "bg-green-50" },
                { label: "Link Clicks", value: "-", icon: Link2, color: "text-purple-600", bg: "bg-purple-50" },
                { label: "Profile Views", value: "-", icon: ArrowUpRight, color: "text-orange-600", bg: "bg-orange-50" },
              ].map((stat) => (
                <div key={stat.label} className={`p-4 rounded-xl ${stat.bg} border border-gray-100`}>
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-gray-600">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-600" />
              Platform Connections
            </CardTitle>
            <CardDescription className="text-gray-500">
              Configure your social media links and visibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon;
                const isEnabled = getEnabled(platform.id);
                const link = getLink(platform.id);
                
                return (
                  <div 
                    key={platform.id} 
                    className={`p-4 rounded-xl border transition-all ${
                      isEnabled 
                        ? "border-purple-200 bg-white shadow-sm" 
                        : "border-gray-200 bg-gray-50 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${platform.color}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{platform.name}</p>
                          <p className="text-xs text-gray-500">{platform.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => {
                          setEditedEnabled(prev => ({ ...prev, [platform.id]: checked }));
                        }}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder={platform.urlPlaceholder}
                        value={link}
                        onChange={(e) => {
                          setEditedLinks(prev => ({ ...prev, [platform.id]: e.target.value }));
                        }}
                        className="text-sm h-9"
                      />
                      {link && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 shrink-0"
                          onClick={() => window.open(link, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 text-gray-500" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Badge 
                        variant="secondary"
                        className={link ? "bg-green-100 text-green-700 text-xs" : "bg-gray-100 text-gray-500 text-xs"}
                      >
                        {link ? (
                          <><Check className="w-3 h-3 mr-1" /> Connected</>
                        ) : (
                          <><X className="w-3 h-3 mr-1" /> Not Set</>
                        )}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
