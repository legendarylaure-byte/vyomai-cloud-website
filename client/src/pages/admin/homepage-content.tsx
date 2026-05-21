import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Save, Loader2, GripVertical, Eye, EyeOff, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DraggableList } from "@/components/draggable-list";
import { z } from "zod";

const heroFormSchema = z.object({
  badgeText: z.string().min(1, "Badge text is required"),
  titleLine1: z.string().min(1, "Title line 1 is required"),
  titleLine2: z.string().min(1, "Title line 2 is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  primaryButtonText: z.string().min(1, "Primary button text is required"),
  primaryButtonLink: z.string().min(1, "Primary button link is required"),
  secondaryButtonText: z.string().optional(),
  secondaryButtonLink: z.string().optional(),
  backgroundStyle: z.string().default("particles"),
  enabled: z.boolean().default(true),
});

const aboutFormSchema = z.object({
  badgeText: z.string().min(1, "Badge text is required"),
  titleHighlight: z.string().min(1, "Title highlight is required"),
  titleNormal: z.string().min(1, "Title normal is required"),
  description: z.string().min(1, "Description is required"),
  enabled: z.boolean().default(true),
});

const aboutValueFormSchema = z.object({
  icon: z.string().min(1, "Icon is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  enabled: z.boolean().default(true),
  order: z.number().default(0),
});

const servicesFormSchema = z.object({
  badgeText: z.string().min(1, "Badge text is required"),
  titleNormal: z.string().min(1, "Title normal is required"),
  titleHighlight: z.string().min(1, "Title highlight is required"),
  description: z.string().min(1, "Description is required"),
  enabled: z.boolean().default(true),
});

const serviceItemFormSchema = z.object({
  icon: z.string().min(1, "Icon is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  enabled: z.boolean().default(true),
  order: z.number().default(0),
});

const solutionsFormSchema = z.object({
  badgeText: z.string().min(1, "Badge text is required"),
  titleHighlight: z.string().min(1, "Title highlight is required"),
  titleNormal: z.string().min(1, "Title normal is required"),
  description: z.string().min(1, "Description is required"),
  enabled: z.boolean().default(true),
});

const solutionItemFormSchema = z.object({
  icon: z.string().min(1, "Icon is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  features: z.array(z.string()).default([]),
  gradientFrom: z.string().optional(),
  gradientTo: z.string().optional(),
  enabled: z.boolean().default(true),
  order: z.number().default(0),
});

type HeroFormData = z.infer<typeof heroFormSchema>;
type AboutFormData = z.infer<typeof aboutFormSchema>;
type AboutValueFormData = z.infer<typeof aboutValueFormSchema>;
type ServicesFormData = z.infer<typeof servicesFormSchema>;
type ServiceItemFormData = z.infer<typeof serviceItemFormSchema>;
type SolutionsFormData = z.infer<typeof solutionsFormSchema>;
type SolutionItemFormData = z.infer<typeof solutionItemFormSchema>;

const availableIcons = [
  "Target", "Users", "Lightbulb", "Heart", "Bot", "Brain", "Cloud", 
  "BarChart3", "Cog", "Shield", "Building2", "Mail", "Calendar", 
  "FileText", "Zap", "Globe", "Lock", "Settings", "Star", "Rocket"
];

export function HomepageContentPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("hero");

  // Section visibility toggles
  const { data: settings } = useQuery<any>({ queryKey: ["/api/settings"] });
  const [showHome, setShowHome] = useState(true);
  const [showAbout, setShowAbout] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showSolutions, setShowSolutions] = useState(true);
  const [showProjectDiscussion, setShowProjectDiscussion] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [showFaq, setShowFaq] = useState(true);
  const [showTestimonials, setShowTestimonials] = useState(true);

  useEffect(() => {
    if (settings) {
      setShowHome(settings.showHomeSection ?? true);
      setShowAbout(settings.showAboutSection ?? true);
      setShowServices(settings.showServicesSection ?? true);
      setShowSolutions(settings.showSolutionsSection ?? true);
      setShowProjectDiscussion(settings.showProjectDiscussionSection ?? true);
      setShowContact(settings.showContactSection ?? true);
      setShowFaq(settings.showFaqSection ?? true);
      setShowTestimonials(settings.showTestimonialsSection ?? true);
    }
  }, [settings]);

  const sectionToggleMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/settings", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Section visibility updated" });
    },
    onError: () => {
      toast({ title: "Failed to update section visibility", variant: "destructive" });
    },
  });

  const toggleSection = (field: string, value: boolean) => {
    sectionToggleMutation.mutate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Home Page Content</h1>
          <p className="text-muted-foreground">
            Manage all home page sections dynamically
          </p>
        </div>
      </div>

      {/* Section Visibility */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="w-4 h-4" />
            Section Visibility
          </CardTitle>
          <CardDescription>Show/hide sections on the public home page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Hero Section</Label>
              <Switch checked={showHome} onCheckedChange={(v) => { setShowHome(v); toggleSection("showHomeSection", v); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">About Section</Label>
              <Switch checked={showAbout} onCheckedChange={(v) => { setShowAbout(v); toggleSection("showAboutSection", v); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Services Section</Label>
              <Switch checked={showServices} onCheckedChange={(v) => { setShowServices(v); toggleSection("showServicesSection", v); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Solutions Section</Label>
              <Switch checked={showSolutions} onCheckedChange={(v) => { setShowSolutions(v); toggleSection("showSolutionsSection", v); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Project Discussion</Label>
              <Switch checked={showProjectDiscussion} onCheckedChange={(v) => { setShowProjectDiscussion(v); toggleSection("showProjectDiscussionSection", v); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Contact Section</Label>
              <Switch checked={showContact} onCheckedChange={(v) => { setShowContact(v); toggleSection("showContactSection", v); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Testimonials Section</Label>
              <Switch checked={showTestimonials} onCheckedChange={(v) => { setShowTestimonials(v); toggleSection("showTestimonialsSection", v); }} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">FAQ Section</Label>
              <Switch checked={showFaq} onCheckedChange={(v) => { setShowFaq(v); toggleSection("showFaqSection", v); }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="about">About Section</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="greeting">AI Greeting</TabsTrigger>
          <TabsTrigger value="footer">Footer</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <HeroSection />
        </TabsContent>

        <TabsContent value="about">
          <AboutSection />
        </TabsContent>

        <TabsContent value="services">
          <ServicesSection />
        </TabsContent>

        <TabsContent value="solutions">
          <SolutionsSection />
        </TabsContent>

        <TabsContent value="greeting">
          <GreetingSection />
        </TabsContent>

        <TabsContent value="footer">
          <FooterSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HeroSection() {
  const { toast } = useToast();
  const [isGeneratingSubtitle, setIsGeneratingSubtitle] = useState(false);
  
  const { data: heroContent, isLoading } = useQuery({
    queryKey: ["/api/content/hero"],
  });

  const form = useForm<HeroFormData>({
    resolver: zodResolver(heroFormSchema),
    defaultValues: heroContent || {
      badgeText: "",
      titleLine1: "",
      titleLine2: "",
      subtitle: "",
      primaryButtonText: "Get Started",
      primaryButtonLink: "#contact",
      secondaryButtonText: "",
      secondaryButtonLink: "",
      backgroundStyle: "particles",
      enabled: true,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: HeroFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/content/hero", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/hero"] });
      toast({ title: "Hero section updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update hero section", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  useEffect(() => {
    if (heroContent && !form.formState.isDirty) {
      form.reset(heroContent);
    }
  }, [heroContent]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
        <CardDescription>Edit the main hero banner content</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Section Enabled</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="badgeText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge Text</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pioneering AI Solutions from Nepal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titleLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title Line 1</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Transform Your" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="titleLine2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title Line 2 (Highlighted)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Business with AI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Subtitle</FormLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={async () => {
                      setIsGeneratingSubtitle(true);
                      try {
                        const token = localStorage.getItem("vyomai-admin-token");
                        const res = await fetch("/api/admin/ai/generate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ prompt: "Write a compelling subtitle for VyomAi Cloud's homepage hero section. VyomAi is an AI solutions company in Kathmandu, Nepal. The subtitle should be 1-2 sentences about transforming businesses with AI. Return ONLY the subtitle text.", system: "You are a marketing copywriter." }),
                        });
                        const data = await res.json();
                        if (data.text) field.onChange(data.text.trim());
                      } catch { toast({ title: "AI generation failed", variant: "destructive" }); }
                      setIsGeneratingSubtitle(false);
                    }} disabled={isGeneratingSubtitle} className="gap-1 h-7 text-xs text-purple-600">
                      {isGeneratingSubtitle ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea placeholder="Description text under the title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="primaryButtonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Button Text</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Get Started" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="primaryButtonLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Button Link</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., #contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="secondaryButtonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Button Text (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Watch Demo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondaryButtonLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Button Link</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., #media" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function AboutSection() {
  const { toast } = useToast();
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<any>(null);

  const { data: aboutData, isLoading } = useQuery<{ content: any; values: any[] }>({
    queryKey: ["/api/content/about"],
  });

  const contentForm = useForm<AboutFormData>({
    resolver: zodResolver(aboutFormSchema),
    defaultValues: {
      badgeText: "",
      titleHighlight: "",
      titleNormal: "",
      description: "",
      enabled: true,
    },
  });

  const valueForm = useForm<AboutValueFormData>({
    resolver: zodResolver(aboutValueFormSchema),
    defaultValues: {
      icon: "Target",
      title: "",
      description: "",
      enabled: true,
      order: 0,
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async (data: AboutFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/content/about", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/about"] });
      toast({ title: "About section updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update about section", variant: "destructive" });
    },
  });

  const createValueMutation = useMutation({
    mutationFn: async (data: AboutValueFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("POST", "/api/admin/content/about/values", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/about"] });
      setIsValueDialogOpen(false);
      valueForm.reset();
      toast({ title: "Value card added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add value card", variant: "destructive" });
    },
  });

  const updateValueMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AboutValueFormData }) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/content/about/values/${id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/about"] });
      setIsValueDialogOpen(false);
      setEditingValue(null);
      valueForm.reset();
      toast({ title: "Value card updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update value card", variant: "destructive" });
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/content/about/values/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/about"] });
      toast({ title: "Value card deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete value card", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (aboutData?.content && !contentForm.formState.isDirty) {
    contentForm.reset(aboutData.content);
  }

  const openEditDialog = (value: any) => {
    setEditingValue(value);
    valueForm.reset(value);
    setIsValueDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingValue(null);
    valueForm.reset({
      icon: "Target",
      title: "",
      description: "",
      enabled: true,
      order: aboutData?.values?.length || 0,
    });
    setIsValueDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About Section Header</CardTitle>
          <CardDescription>Edit the about section title and description</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...contentForm}>
            <form onSubmit={contentForm.handleSubmit((data) => updateContentMutation.mutate(data))} className="space-y-4">
              <FormField
                control={contentForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Section Enabled</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={contentForm.control}
                name="badgeText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge Text</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., About VyomAi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contentForm.control}
                  name="titleHighlight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Highlight</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pioneering AI" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contentForm.control}
                  name="titleNormal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Normal</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g.,  in Nepal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={contentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Description</FormLabel>
                      <Button type="button" variant="ghost" size="sm" onClick={async () => {
                        try {
                          const token = localStorage.getItem("vyomai-admin-token");
                          const res = await fetch("/api/admin/ai/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ prompt: "Write a compelling description for the About section of VyomAi Cloud, an AI solutions company in Kathmandu, Nepal. Describe the company's mission to transform businesses with AI. 2-3 sentences. Return ONLY the description text.", system: "You are a marketing copywriter for VyomAi Cloud." }),
                          });
                          const data = await res.json();
                          if (data.text) field.onChange(data.text.trim());
                        } catch { toast({ title: "AI generation failed", variant: "destructive" }); }
                      }} className="gap-1 h-7 text-xs text-purple-600">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea placeholder="About section description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={updateContentMutation.isPending}>
                {updateContentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Value Cards</CardTitle>
            <CardDescription>Manage the value/feature cards in the about section</CardDescription>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Value
          </Button>
        </CardHeader>
        <CardContent>
          <DraggableList
            items={aboutData?.values || []}
            onReorder={(items) => {
              const token = localStorage.getItem("vyomai-admin-token");
              const reordered = items.map((item, idx) => ({ id: item.id, order: idx }));
              fetch("/api/admin/content/about/values/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ items: reordered }),
              }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/content/about"] }));
            }}
            renderItem={(value: any) => (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{value.icon}</Badge>
                  <div>
                    <p className="font-medium">{value.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{value.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {value.enabled ? (
                    <Badge variant="default">Enabled</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(value)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteValueMutation.mutate(value.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingValue ? "Edit Value Card" : "Add Value Card"}</DialogTitle>
            <DialogDescription>
              {editingValue ? "Update the value card details" : "Add a new value card to the about section"}
            </DialogDescription>
          </DialogHeader>
          <Form {...valueForm}>
            <form onSubmit={valueForm.handleSubmit((data) => {
              if (editingValue) {
                updateValueMutation.mutate({ id: editingValue.id, data });
              } else {
                createValueMutation.mutate(data);
              }
            })} className="space-y-4">
              <FormField
                control={valueForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {availableIcons.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={valueForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Our Mission" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={valueForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Value description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={valueForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Enabled</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createValueMutation.isPending || updateValueMutation.isPending}>
                  {(createValueMutation.isPending || updateValueMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingValue ? "Update" : "Add"} Value
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ServicesSection() {
  const { toast } = useToast();
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: servicesData, isLoading } = useQuery<{ content: any; items: any[] }>({
    queryKey: ["/api/content/services"],
  });

  const contentForm = useForm<ServicesFormData>({
    resolver: zodResolver(servicesFormSchema),
    defaultValues: {
      badgeText: "",
      titleNormal: "",
      titleHighlight: "",
      description: "",
      enabled: true,
    },
  });

  const itemForm = useForm<ServiceItemFormData>({
    resolver: zodResolver(serviceItemFormSchema),
    defaultValues: {
      icon: "Bot",
      title: "",
      description: "",
      enabled: true,
      order: 0,
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async (data: ServicesFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/content/services", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/services"] });
      toast({ title: "Services section updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update services section", variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: ServiceItemFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("POST", "/api/admin/content/services/items", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/services"] });
      setIsItemDialogOpen(false);
      itemForm.reset();
      toast({ title: "Service added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add service", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ServiceItemFormData }) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/content/services/items/${id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/services"] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
      itemForm.reset();
      toast({ title: "Service updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update service", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/content/services/items/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/services"] });
      toast({ title: "Service deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete service", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (servicesData?.content && !contentForm.formState.isDirty) {
    contentForm.reset(servicesData.content);
  }

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    itemForm.reset(item);
    setIsItemDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    itemForm.reset({
      icon: "Bot",
      title: "",
      description: "",
      enabled: true,
      order: servicesData?.items?.length || 0,
    });
    setIsItemDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Services Section Header</CardTitle>
          <CardDescription>Edit the services section title and description</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...contentForm}>
            <form onSubmit={contentForm.handleSubmit((data) => updateContentMutation.mutate(data))} className="space-y-4">
              <FormField
                control={contentForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Section Enabled</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={contentForm.control}
                name="badgeText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge Text</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Our Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contentForm.control}
                  name="titleNormal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Normal</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., What We " {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contentForm.control}
                  name="titleHighlight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Highlight</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Offer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={contentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Description</FormLabel>
                      <Button type="button" variant="ghost" size="sm" onClick={async () => {
                        try {
                          const token = localStorage.getItem("vyomai-admin-token");
                          const res = await fetch("/api/admin/ai/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ prompt: "Write a compelling description for the Services section of VyomAi Cloud, an AI solutions company in Kathmandu, Nepal. List the types of AI services offered. 2-3 sentences. Return ONLY the description text.", system: "You are a marketing copywriter for VyomAi Cloud." }),
                          });
                          const data = await res.json();
                          if (data.text) field.onChange(data.text.trim());
                        } catch { toast({ title: "AI generation failed", variant: "destructive" }); }
                      }} className="gap-1 h-7 text-xs text-purple-600">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea placeholder="Services section description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateContentMutation.isPending}>
                {updateContentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Service Items</CardTitle>
            <CardDescription>Manage individual service offerings</CardDescription>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </CardHeader>
        <CardContent>
          <DraggableList
            items={servicesData?.items || []}
            onReorder={(items) => {
              const token = localStorage.getItem("vyomai-admin-token");
              const reordered = items.map((item, idx) => ({ id: item.id, order: idx }));
              fetch("/api/admin/content/services/items/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ items: reordered }),
              }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/content/services"] }));
            }}
            renderItem={(item: any) => (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{item.icon}</Badge>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.enabled ? (
                    <Badge variant="default">Enabled</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteItemMutation.mutate(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Service" : "Add Service"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the service details" : "Add a new service to the section"}
            </DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit((data) => {
              if (editingItem) {
                updateItemMutation.mutate({ id: editingItem.id, data });
              } else {
                createItemMutation.mutate(data);
              }
            })} className="space-y-4">
              <FormField
                control={itemForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {availableIcons.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AI Agent Templates" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Service description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={itemForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Enabled</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                  {(createItemMutation.isPending || updateItemMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingItem ? "Update" : "Add"} Service
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SolutionsSection() {
  const { toast } = useToast();
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [featuresInput, setFeaturesInput] = useState("");

  const { data: solutionsData, isLoading } = useQuery<{ content: any; items: any[] }>({
    queryKey: ["/api/content/solutions"],
  });

  const contentForm = useForm<SolutionsFormData>({
    resolver: zodResolver(solutionsFormSchema),
    defaultValues: {
      badgeText: "",
      titleHighlight: "",
      titleNormal: "",
      description: "",
      enabled: true,
    },
  });

  const itemForm = useForm<SolutionItemFormData>({
    resolver: zodResolver(solutionItemFormSchema),
    defaultValues: {
      icon: "Building2",
      title: "",
      description: "",
      features: [],
      gradientFrom: "blue-500/20",
      gradientTo: "green-500/20",
      enabled: true,
      order: 0,
    },
  });

  const updateContentMutation = useMutation({
    mutationFn: async (data: SolutionsFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/content/solutions", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/solutions"] });
      toast({ title: "Solutions section updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update solutions section", variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: SolutionItemFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("POST", "/api/admin/content/solutions/items", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/solutions"] });
      setIsItemDialogOpen(false);
      itemForm.reset();
      setFeaturesInput("");
      toast({ title: "Solution added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add solution", variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SolutionItemFormData }) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/content/solutions/items/${id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/solutions"] });
      setIsItemDialogOpen(false);
      setEditingItem(null);
      itemForm.reset();
      setFeaturesInput("");
      toast({ title: "Solution updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update solution", variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/content/solutions/items/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content/solutions"] });
      toast({ title: "Solution deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete solution", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (solutionsData?.content && !contentForm.formState.isDirty) {
    contentForm.reset(solutionsData.content);
  }

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    itemForm.reset(item);
    setFeaturesInput(item.features?.join("\n") || "");
    setIsItemDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    itemForm.reset({
      icon: "Building2",
      title: "",
      description: "",
      features: [],
      gradientFrom: "blue-500/20",
      gradientTo: "green-500/20",
      enabled: true,
      order: solutionsData?.items?.length || 0,
    });
    setFeaturesInput("");
    setIsItemDialogOpen(true);
  };

  const handleSubmitSolution = (data: SolutionItemFormData) => {
    const features = featuresInput.split("\n").filter(f => f.trim());
    const submitData = { ...data, features };
    
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: submitData });
    } else {
      createItemMutation.mutate(submitData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Solutions Section Header</CardTitle>
          <CardDescription>Edit the solutions section title and description</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...contentForm}>
            <form onSubmit={contentForm.handleSubmit((data) => updateContentMutation.mutate(data))} className="space-y-4">
              <FormField
                control={contentForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Section Enabled</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={contentForm.control}
                name="badgeText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge Text</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AI Solutions" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={contentForm.control}
                  name="titleHighlight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Highlight</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Enterprise" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={contentForm.control}
                  name="titleNormal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title Normal</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g.,  Integrations" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={contentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Description</FormLabel>
                      <Button type="button" variant="ghost" size="sm" onClick={async () => {
                        try {
                          const token = localStorage.getItem("vyomai-admin-token");
                          const res = await fetch("/api/admin/ai/generate", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ prompt: "Write a compelling description for the Solutions section of VyomAi Cloud, an AI solutions company in Kathmandu, Nepal. Describe how their solutions integrate with platforms. 2-3 sentences. Return ONLY the description text.", system: "You are a marketing copywriter for VyomAi Cloud." }),
                          });
                          const data = await res.json();
                          if (data.text) field.onChange(data.text.trim());
                        } catch { toast({ title: "AI generation failed", variant: "destructive" }); }
                      }} className="gap-1 h-7 text-xs text-purple-600">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea placeholder="Solutions section description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateContentMutation.isPending}>
                {updateContentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Solution Items</CardTitle>
            <CardDescription>Manage platform integration solutions</CardDescription>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Solution
          </Button>
        </CardHeader>
        <CardContent>
          <DraggableList
            items={solutionsData?.items || []}
            onReorder={(items) => {
              const token = localStorage.getItem("vyomai-admin-token");
              const reordered = items.map((item, idx) => ({ id: item.id, order: idx }));
              fetch("/api/admin/content/solutions/items/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ items: reordered }),
              }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/content/solutions"] }));
            }}
            renderItem={(item: any) => (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">{item.icon}</Badge>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                    {item.features?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{item.features.length} features</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.enabled ? (
                    <Badge variant="default">Enabled</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteItemMutation.mutate(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Solution" : "Add Solution"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the solution details" : "Add a new solution/integration to the section"}
            </DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleSubmitSolution)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          {availableIcons.map((icon) => (
                            <option key={icon} value={icon}>{icon}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Google Workspace Integration" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={itemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Solution description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Features (one per line)</FormLabel>
                <Textarea
                  placeholder="Enter features, one per line..."
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
                  name="gradientFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gradient From</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., blue-500/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="gradientTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gradient To</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., green-500/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={itemForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <FormLabel>Enabled</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                  {(createItemMutation.isPending || updateItemMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingItem ? "Update" : "Add"} Solution
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GreetingSection() {
  const { toast } = useToast();
  const [greetingText, setGreetingText] = useState("");
  const [greetingEnabled, setGreetingEnabled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/settings", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Greeting settings saved" });
    },
    onError: () => {
      toast({ title: "Failed to save greeting settings", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (settings) {
      setGreetingEnabled(settings.aiGreetingEnabled ?? false);
      setGreetingText(settings.aiGreetingText || "");
    }
  }, [settings]);

  const generateGreeting = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await apiRequest("POST", "/api/admin/ai/greeting", {}, { Authorization: `Bearer ${token}` });
      setGreetingText(res.text);
      toast({ title: "AI greeting generated ✨" });
    } catch {
      toast({ title: "Failed to generate greeting", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      aiGreetingEnabled: greetingEnabled,
      aiGreetingText: greetingText,
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Welcome Greeting</CardTitle>
        <CardDescription>Generate and customize a dynamic AI welcome greeting for the welcome popup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-medium">Enable AI Greeting</p>
            <p className="text-sm text-muted-foreground">Show AI-generated greeting in the welcome popup</p>
          </div>
          <Switch checked={greetingEnabled} onCheckedChange={setGreetingEnabled} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Greeting Text</label>
            <Button
              variant="outline"
              size="sm"
              onClick={generateGreeting}
              disabled={isGenerating}
              className="gap-1.5"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate with AI
            </Button>
          </div>
          <Textarea
            value={greetingText}
            onChange={(e) => setGreetingText(e.target.value)}
            placeholder="Click 'Generate with AI' to create a greeting, or type your own..."
            rows={4}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground">
            The greeting will adapt based on time of day (morning/afternoon/evening) when generated.
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Greeting Settings
        </Button>
      </CardContent>
    </Card>
  );
}

function FooterSection() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [publishFooter, setPublishFooter] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", "/api/admin/settings", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Footer settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save footer settings", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (settings && !initialized) {
      setEmail(settings.footerContactEmail || "info@vyomai.cloud");
      setMobile(settings.footerMobileNumber || "");
      setAddress(settings.footerAddress || "Tokha, Kathmandu, Nepal");
      setPublishFooter(settings.publishFooter ?? false);
      setInitialized(true);
    }
  }, [settings, initialized]);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  const handleSave = () => {
    updateMutation.mutate({
      footerContactEmail: email,
      footerMobileNumber: mobile,
      footerAddress: address,
      publishFooter,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Footer Settings</CardTitle>
        <CardDescription>Configure the footer contact information and visibility</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="font-medium">Publish Footer</p>
            <p className="text-sm text-muted-foreground">Show footer on the website</p>
          </div>
          <Switch
            checked={publishFooter}
            onCheckedChange={setPublishFooter}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Email</label>
            <Input 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="info@vyomai.cloud"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mobile Number</label>
            <Input 
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              type="tel"
              placeholder="+977 9800000000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Address</label>
          <Input 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Tokha, Kathmandu, Nepal"
          />
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Footer Settings
        </Button>
      </CardContent>
    </Card>
  );
}
