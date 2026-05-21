import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Edit, Loader2, Star, Star as StarIcon, Sparkles } from "lucide-react";

interface TestimonialItem {
  id: string;
  name: string;
  company?: string;
  role?: string;
  avatarUrl?: string;
  content: string;
  rating?: number;
  order: number;
  enabled: boolean;
  createdAt?: string;
}

export function TestimonialsPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);

  const token = localStorage.getItem("vyomai-admin-token");

  const { data: testimonials = [], isLoading } = useQuery<TestimonialItem[]>({
    queryKey: ["/api/admin/testimonials"],
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/testimonials", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Testimonial created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/admin/testimonials/${id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Testimonial updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/testimonials/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Testimonial deleted" });
    },
  });

  const resetForm = () => {
    setIsOpen(false);
    setEditingId(null);
    setName("");
    setCompany("");
    setRole("");
    setAvatarUrl("");
    setContent("");
    setRating(5);
  };

  const openEdit = (t: TestimonialItem) => {
    setEditingId(t.id);
    setName(t.name);
    setCompany(t.company || "");
    setRole(t.role || "");
    setAvatarUrl(t.avatarUrl || "");
    setContent(t.content);
    setRating(t.rating || 5);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      toast({ title: "Name and content are required", variant: "destructive" });
      return;
    }
    const data = { name: name.trim(), content: content.trim(), company: company.trim(), role: role.trim(), avatarUrl: avatarUrl.trim(), rating };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ ...data, order: testimonials.length });
    }
  };

  const toggleEnabled = (t: TestimonialItem) => {
    updateMutation.mutate({ id: t.id, data: { enabled: !t.enabled } });
  };

  const avatarLetters = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground">Manage client testimonials and reviews</p>
        </div>
        <Button onClick={() => { resetForm(); setIsOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Add Testimonial
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : testimonials.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No testimonials yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.id} className={!t.enabled ? "opacity-60" : ""}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  {t.avatarUrl ? (
                    <img src={t.avatarUrl} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
                      {avatarLetters(t.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{[t.role, t.company].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(t)}><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(t.id); }}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{t.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating || 5 }).map((_, i) => (
                      <StarIcon key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Switch checked={t.enabled} onCheckedChange={() => toggleEnabled(t)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Company</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. CEO" />
              </div>
            </div>
            <div>
              <Label>Avatar URL</Label>
              <div className="flex gap-2">
                <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  if (!name.trim()) { toast({ title: "Enter a name first", variant: "destructive" }); return; }
                  const encoded = encodeURIComponent(name.trim());
                  setAvatarUrl(`https://ui-avatars.com/api/?name=${encoded}&background=7c3aed&color=fff&size=200&bold=true`);
                  toast({ title: "Avatar generated ✨", description: "Avatar created from name initials" });
                }} className="gap-1.5 text-purple-600 border-purple-300 whitespace-nowrap">
                  <Sparkles className="w-4 h-4" />
                  AI Avatar
                </Button>
              </div>
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Testimonial text..." rows={3} />
            </div>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)}>
                    <Star className={`w-6 h-6 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
