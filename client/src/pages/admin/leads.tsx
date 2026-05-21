import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Users, TrendingUp, Target, Plus, Search, Filter, ArrowUpDown,
  Loader2, Sparkles, UserPlus, Mail, Building2, Globe, Phone,
  Bot, Brain, ChevronRight, Star, Trash2, Database, RefreshCw
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  industry?: string;
  source: string;
  vyomaiService?: string;
  status: string;
  score?: number;
  intent?: string;
  notes?: string;
  assignedTo?: string;
  assignedByName?: string;
  sourceInquiryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  website_form: "Website Form",
  booking: "Booking",
  project_discussion: "Project Discussion",
  custom_solution: "Custom Solution",
  manual_entry: "Manual Entry",
  ai_generated: "AI Generated",
};

const SERVICE_LABELS: Record<string, string> = {
  ai_solutions: "AI Solutions",
  web_development: "Web Development",
  digital_marketing: "Digital Marketing",
  seo: "SEO",
  social_media: "Social Media",
  content_creation: "Content Creation",
  consulting: "Consulting",
  other: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  qualified: { label: "Qualified", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  contacted: { label: "Contacted", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  converted: { label: "Converted", color: "text-green-600", bg: "bg-green-50 border-green-200" },
  lost: { label: "Lost", color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

export function LeadsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", company: "", website: "",
    source: "manual_entry" as string, notes: "",
  });

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/leads", statusFilter, sourceFilter, search],
    queryFn: async () => {
      const token = localStorage.getItem("vyomai-admin-token");
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sourceFilter !== "all") params.set("source", sourceFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return res.json();
    },
  });

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus: Record<string, number> = {};
    const avgScore = leads.reduce((s, l) => s + (l.score || 0), 0) / (total || 1);
    for (const l of leads) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    }
    return { total, byStatus, avgScore: Math.round(avgScore) };
  }, [leads]);

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("POST", "/api/admin/leads", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Lead created successfully" });
      setIsAddOpen(false);
      setFormData({ name: "", email: "", phone: "", company: "", website: "", source: "manual_entry", notes: "" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to create lead", variant: "destructive" });
    },
  });

  const migrateMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch("/api/admin/leads/migrate-from-inquiries", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Migration failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: `Migration complete: ${data.created} leads created from ${data.total} inquiries` });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Migration failed", variant: "destructive" });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/leads/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
      toast({ title: "Lead deleted" });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to delete lead", variant: "destructive" });
    },
  });

  const getScoreColor = (score?: number) => {
    if (!score) return "bg-gray-200";
    if (score >= 70) return "bg-green-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            Lead Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Track, qualify, and convert leads into customers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => migrateMutation.mutate()}
            disabled={migrateMutation.isPending}
            className="hover:bg-amber-50 hover:text-amber-600"
          >
            {migrateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
            Migrate Existing
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Total Leads</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-6 h-6 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">New</p>
                <p className="text-3xl font-bold">{stats.byStatus.new || 0}</p>
              </div>
              <Star className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Qualified</p>
                <p className="text-3xl font-bold">{stats.byStatus.qualified || 0}</p>
              </div>
              <Target className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Avg Score</p>
                <p className="text-3xl font-bold">{stats.avgScore}</p>
              </div>
              <Brain className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Leads</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 w-60"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No leads found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 border rounded-xl hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all cursor-pointer group"
                  onClick={() => setLocation(`/admin/lead/${lead.id}`)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate">{lead.name}</p>
                        <Badge className={`${STATUS_CONFIG[lead.status]?.bg || "bg-gray-50"} ${STATUS_CONFIG[lead.status]?.color || "text-gray-600"} border text-xs`}>
                          {STATUS_CONFIG[lead.status]?.label || lead.status}
                        </Badge>
                        {lead.score != null && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <div className={`w-2 h-2 rounded-full ${getScoreColor(lead.score)}`} />
                            {lead.score}/100
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </span>
                        {lead.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {lead.company}
                          </span>
                        )}
                        {lead.vyomaiService && (
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 bg-emerald-50">
                            {SERVICE_LABELS[lead.vyomaiService] || lead.vyomaiService}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <span>{SOURCE_LABELS[lead.source] || lead.source}</span>
                        {lead.assignedByName && (
                          <>
                            <span>•</span>
                            <span>Assigned to: {lead.assignedByName}</span>
                          </>
                        )}
                        {lead.createdAt && (
                          <>
                            <span>•</span>
                            <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/admin/lead/${lead.id}`);
                      }}
                      className="hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this lead?")) deleteLeadMutation.mutate(lead.id);
                      }}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              Add New Lead
            </DialogTitle>
            <DialogDescription>Manually create a new lead record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Lead name" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))} placeholder="Company name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Lead details..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createLeadMutation.mutate(formData)}
              disabled={createLeadMutation.isPending || !formData.name || !formData.email}
              className="bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              {createLeadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
