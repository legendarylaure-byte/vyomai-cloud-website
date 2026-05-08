import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type PopupForm } from "@shared/schema";
import { 
  Plus, Trash2, Edit, Save, Loader2, Eye, Sparkles, Zap, MousePointer, 
  RotateCw, Move, Maximize, FlipHorizontal, MessageSquare, Gift, 
  Calendar, Mail, PartyPopper, Megaphone
} from "lucide-react";

const templateTypes = [
  { id: "custom", name: "Custom Form", icon: MessageSquare, description: "Build your own form from scratch" },
  { id: "marketing", name: "Marketing Offer", icon: Megaphone, description: "Promote special offers and discounts" },
  { id: "business", name: "Business Inquiry", icon: MessageSquare, description: "Capture business lead information" },
  { id: "greetings", name: "Festival Greetings", icon: PartyPopper, description: "Send festive wishes to visitors" },
  { id: "appointment", name: "Appointment Booking", icon: Calendar, description: "Allow visitors to book appointments" },
  { id: "email_collection", name: "Email Collection", icon: Mail, description: "Grow your email subscriber list" },
  { id: "welcome", name: "Welcome Message", icon: Gift, description: "Greet first-time visitors warmly" },
];

const animationStyles = [
  { id: "fade", name: "Fade In", icon: Sparkles, description: "Smooth fade effect" },
  { id: "slide", name: "Slide Up", icon: MousePointer, description: "Slides from bottom" },
  { id: "zoom", name: "Zoom In", icon: Zap, description: "Zooms from center" },
  { id: "glow", name: "Glow Effect", icon: Eye, description: "Glowing entrance" },
  { id: "bounce", name: "Bounce", icon: Move, description: "Bouncy entrance" },
  { id: "rotate", name: "Rotate In", icon: RotateCw, description: "Rotates while appearing" },
  { id: "scale", name: "Scale Up", icon: Maximize, description: "Grows from small" },
  { id: "flip", name: "Flip", icon: FlipHorizontal, description: "3D flip entrance" },
];



export function PopupFormsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<PopupForm | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    formType: "custom",
    animationStyle: "fade",
    showDelay: "0",
    title: "",
    message: "",
    buttonText: "Submit",
    buttonLink: "",
    imageUrl: "",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    dismissable: true,
    enabled: false,
    collectEmail: false,
    collectPhone: false,
    collectName: false,
    successMessage: "Thank you!",
  });

  const { data: popupForms = [], isLoading } = useQuery<PopupForm[]>({
    queryKey: ["/api/popup-forms"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("POST", "/api/admin/popup-forms", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/popup-forms"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Popup form created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create popup form", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/popup-forms/${id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/popup-forms"] });
      setIsDialogOpen(false);
      setEditingForm(null);
      resetForm();
      toast({ title: "Popup form updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update popup form", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/popup-forms/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/popup-forms"] });
      toast({ title: "Popup form deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete popup form", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      formType: "custom",
      animationStyle: "fade",
      showDelay: "0",
      title: "",
      message: "",
      buttonText: "Submit",
      buttonLink: "",
      imageUrl: "",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      dismissable: true,
      enabled: false,
      collectEmail: false,
      collectPhone: false,
      collectName: false,
      successMessage: "Thank you!",
    });
  };

  const openEditDialog = (form: PopupForm) => {
    setEditingForm(form);
    setFormData({
      name: form.name || "",
      formType: form.formType || "custom",
      animationStyle: form.animationStyle || "fade",
      showDelay: form.showDelay || "0",
      title: form.title || "",
      message: form.message || "",
      buttonText: form.buttonText || "Submit",
      buttonLink: form.buttonLink || "",
      imageUrl: form.imageUrl || "",
      backgroundColor: form.backgroundColor || "#ffffff",
      textColor: form.textColor || "#1f2937",
      dismissable: form.dismissable ?? true,
      enabled: form.enabled ?? false,
      collectEmail: form.collectEmail ?? false,
      collectPhone: form.collectPhone ?? false,
      collectName: form.collectName ?? false,
      successMessage: form.successMessage || "Thank you!",
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingForm(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingForm) {
      updateMutation.mutate({ id: editingForm.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const applyTemplate = (templateId: string) => {
    setFormData(prev => ({ ...prev, formType: templateId }));
    
    switch (templateId) {
      case "marketing":
        setFormData(prev => ({
          ...prev,
          title: "Special Offer!",
          message: "Get 20% off on our premium AI services. Limited time offer!",
          buttonText: "Claim Offer",
          animationStyle: "bounce",
        }));
        break;
      case "greetings":
        setFormData(prev => ({
          ...prev,
          title: "Happy Holidays!",
          message: "Wishing you joy and happiness this festive season. From the VyomAi team.",
          buttonText: "Thank You",
          animationStyle: "glow",
        }));
        break;
      case "appointment":
        setFormData(prev => ({
          ...prev,
          title: "Book a Consultation",
          message: "Schedule a free 30-minute consultation with our AI experts.",
          buttonText: "Book Now",
          animationStyle: "slide",
        }));
        break;
      case "email_collection":
        setFormData(prev => ({
          ...prev,
          title: "Stay Updated",
          message: "Subscribe to our newsletter for the latest AI insights and updates.",
          buttonText: "Subscribe",
          animationStyle: "fade",
        }));
        break;
      case "welcome":
        setFormData(prev => ({
          ...prev,
          title: "Welcome to VyomAi!",
          message: "Thank you for visiting. Explore our AI solutions and discover how we can transform your business.",
          buttonText: "Explore",
          animationStyle: "zoom",
        }));
        break;
      case "business":
        setFormData(prev => ({
          ...prev,
          title: "Let's Work Together",
          message: "Tell us about your project and we'll get back to you within 24 hours.",
          buttonText: "Get Started",
          animationStyle: "scale",
        }));
        break;
    }
  };

  const getAnimationClass = (style: string) => {
    switch (style) {
      case "fade": return "animate-in fade-in duration-500";
      case "slide": return "animate-in slide-in-from-bottom duration-500";
      case "zoom": return "animate-in zoom-in duration-500";
      case "bounce": return "animate-bounce";
      case "rotate": return "animate-in spin-in duration-500";
      case "scale": return "animate-in zoom-in-50 duration-500";
      case "flip": return "animate-in flip-in-x duration-500";
      case "glow": return "ring-4 ring-purple-400/50 animate-pulse";
      default: return "";
    }
  };

  return (

    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Popup Forms
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage popup forms with templates and animations
          </p>
        </div>
        <Button onClick={openNewDialog} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Popup Form
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : popupForms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No popup forms yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Create your first popup form to engage visitors with marketing offers, greetings, or lead capture forms.
            </p>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Create Popup Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popupForms.map((form) => {
            const template = templateTypes.find(t => t.id === form.formType);
            const animation = animationStyles.find(a => a.id === form.animationStyle);
            const TemplateIcon = template?.icon || MessageSquare;
            
            return (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <TemplateIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{form.name || "Untitled Form"}</CardTitle>
                        <p className="text-xs text-gray-500">{template?.name || "Custom"}</p>
                      </div>
                    </div>
                    <Badge variant={form.enabled ? "default" : "secondary"}>
                      {form.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{form.title || "No title"}</p>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">{form.message || "No message"}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {animation?.icon && <animation.icon className="w-3 h-3" />}
                    <span>{animation?.name || "Fade"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(form)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => deleteMutation.mutate(form.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingForm ? "Edit Popup Form" : "Create Popup Form"}</DialogTitle>
            <DialogDescription>
              {editingForm ? "Update your popup form settings" : "Create a new popup form to engage visitors"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Form Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Holiday Promo Popup"
                />
              </div>

              <div>
                <Label className="mb-2 block">Template Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {templateTypes.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        formData.formType === template.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <template.icon className={`w-5 h-5 mb-1 ${
                        formData.formType === template.id ? "text-purple-600" : "text-gray-400"
                      }`} />
                      <p className={`text-xs font-medium ${
                        formData.formType === template.id ? "text-purple-700" : "text-gray-700"
                      }`}>{template.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Popup title"
                />
              </div>

              <div>
                <Label className="mb-2 block">Message</Label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Your popup message..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Button Text</Label>
                  <Input
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="Submit"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Button Link (optional)</Label>
                  <Input
                    value={formData.buttonLink}
                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Image URL (optional)</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Animation Style</Label>
                <div className="grid grid-cols-2 gap-2">
                  {animationStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, animationStyle: style.id })}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        formData.animationStyle === style.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <style.icon className={`w-4 h-4 mb-1 ${
                        formData.animationStyle === style.id ? "text-purple-600" : "text-gray-400"
                      }`} />
                      <p className={`text-xs font-medium ${
                        formData.animationStyle === style.id ? "text-purple-700" : "text-gray-700"
                      }`}>{style.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Display Delay (seconds)</Label>
                <Select value={formData.showDelay} onValueChange={(v) => setFormData({ ...formData, showDelay: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Immediately</SelectItem>
                    <SelectItem value="5">After 5 seconds</SelectItem>
                    <SelectItem value="10">After 10 seconds</SelectItem>
                    <SelectItem value="30">After 30 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block text-xs">Background</Label>
                  <Input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                    className="h-10 p-1"
                  />
                </div>
                <div>
                  <Label className="mb-2 block text-xs">Text Color</Label>
                  <Input
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="h-10 p-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Switch
                  checked={formData.dismissable}
                  onCheckedChange={(v) => setFormData({ ...formData, dismissable: v })}
                />
                <Label className="cursor-pointer">Allow users to dismiss popup</Label>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(v) => setFormData({ ...formData, enabled: v })}
                />
                <Label className="cursor-pointer">Enable this popup (only one can be active)</Label>
              </div>

              <div className="border rounded-xl p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 min-h-[200px] flex items-center justify-center">
                <div 
                  className={`rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center ${getAnimationClass(formData.animationStyle)}`}
                  style={{ 
                    backgroundColor: formData.backgroundColor,
                    color: formData.textColor,
                  }}
                >
                  {formData.imageUrl && (
                    <img src={formData.imageUrl} alt="Popup" className="w-16 h-16 mx-auto mb-3 rounded-xl object-cover" />
                  )}
                  <h3 className="text-xl font-bold mb-2">{formData.title || "Your Title"}</h3>
                  <p className="text-sm mb-4 opacity-80">{formData.message || "Your message here..."}</p>
                  <button 
                    className="px-5 py-2 rounded-xl font-medium shadow-lg text-white bg-purple-600 hover:bg-purple-700"
                  >
                    {formData.buttonText || "Button"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              <Save className="w-4 h-4 mr-2" />
              {editingForm ? "Update" : "Create"} Popup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
