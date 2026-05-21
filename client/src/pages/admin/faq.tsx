import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Edit, Loader2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  category?: string;
  enabled: boolean;
  createdAt?: string;
}

export function FaqPage() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("general");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const token = localStorage.getItem("vyomai-admin-token");

  const { data: faqs = [], isLoading } = useQuery<FaqItem[]>({
    queryKey: ["/api/admin/faq"],
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/admin/faq", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      toast({ title: "FAQ created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/admin/faq/${id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      toast({ title: "FAQ updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/faq/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      toast({ title: "FAQ deleted" });
    },
  });

  const toggleEnabled = (faq: FaqItem) => {
    updateMutation.mutate({ id: faq.id, data: { enabled: !faq.enabled } });
  };

  const resetForm = () => {
    setIsOpen(false);
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setCategory("general");
  };

  const openEdit = (faq: FaqItem) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category || "general");
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!question.trim() || !answer.trim()) {
      toast({ title: "Question and answer are required", variant: "destructive" });
      return;
    }
    const data = { question: question.trim(), answer: answer.trim(), category: category || "general" };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate({ ...data, order: faqs.length });
    }
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= faqs.length) return;
    const items = [...faqs];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    const reordered = items.map((item, i) => ({ id: item.id, order: i }));
    queryClient.setQueryData(["/api/admin/faq"], items);
    Promise.all(reordered.map(r => updateMutation.mutate({ id: r.id, data: { order: r.order } })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FAQ Management</h1>
          <p className="text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <Button onClick={() => { resetForm(); setIsOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Add FAQ
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : faqs.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">No FAQs yet. Click "Add FAQ" to create one.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <Card key={faq.id} className={!faq.enabled ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveItem(index, "up")} className="text-muted-foreground hover:text-foreground"><ChevronUp className="w-3 h-3" /></button>
                    <button onClick={() => moveItem(index, "down")} className="text-muted-foreground hover:text-foreground"><ChevronDown className="w-3 h-3" /></button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      className="text-left w-full font-medium truncate hover:text-purple-600 transition-colors"
                      onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    >
                      {faq.question}
                    </button>
                    {expandedId === faq.id && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{faq.answer}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <Switch checked={faq.enabled} onCheckedChange={() => toggleEnabled(faq)} />
                      <Label className="text-xs">{faq.enabled ? "Published" : "Draft"}</Label>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(faq)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this FAQ?")) deleteMutation.mutate(faq.id); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question</Label>
              <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Enter question..." />
            </div>
            <div>
              <Label>Answer</Label>
              <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Enter answer..." rows={4} />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="general, billing, support..." />
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
