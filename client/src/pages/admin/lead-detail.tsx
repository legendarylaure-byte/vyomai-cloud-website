import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft, Sparkles, Brain, Target, UserPlus, Mail, Building2, Globe, Phone,
  Loader2, TrendingUp, Star, Save, Trash2
} from "lucide-react";

interface Lead {
  id: string; name: string; email: string; phone?: string; company?: string;
  website?: string; industry?: string; source: string; vyomaiService?: string;
  status: string; score?: number; intent?: string; notes?: string;
  assignedTo?: string; assignedByName?: string; sourceInquiryId?: string;
  createdAt?: string; updatedAt?: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

const SERVICE_OPTIONS = [
  { value: "ai_solutions", label: "AI Solutions" },
  { value: "web_development", label: "Web Development" },
  { value: "digital_marketing", label: "Digital Marketing" },
  { value: "seo", label: "SEO" },
  { value: "social_media", label: "Social Media" },
  { value: "content_creation", label: "Content Creation" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
];

export function LeadDetailPage() {
  const [, params] = useRoute("/admin/lead/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const leadId = params?.id;

  const { data: lead, isLoading, error } = useQuery<Lead>({
    queryKey: ["/api/admin/leads", leadId],
    queryFn: async () => {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Lead not found");
      return res.json();
    },
    enabled: !!leadId,
  });

  const [formData, setFormData] = useState<Partial<Lead>>({});

  useState(() => {
    if (lead) setFormData(lead);
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/leads/${leadId}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId] });
      toast({ title: "Lead updated" });
    },
    onError: (err: any) => toast({ title: err.message || "Update failed", variant: "destructive" }),
  });

  const enrichMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch(`/api/admin/leads/${leadId}/ai-enrich`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Enrichment failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId] });
      toast({ title: "AI enrichment complete" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
    },
    onError: (err: any) => toast({ title: err.message || "Enrichment failed", variant: "destructive" }),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch(`/api/admin/leads/${leadId}/ai-assign`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Assignment failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads", leadId] });
      toast({ title: `Assigned to ${data.assignedByName || data.assignedTo}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leads"] });
    },
    onError: (err: any) => toast({ title: err.message || "Assignment failed", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500 text-lg">Lead not found</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/admin/leads")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Leads
        </Button>
      </div>
    );
  }

  const currentData = formData.id ? formData : lead;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/admin/leads")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{lead.name}</h2>
              <Select
                value={currentData.status}
                onValueChange={(v) => {
                  setFormData((p: any) => ({ ...p, status: v }));
                  updateMutation.mutate({ status: v });
                }}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Created {new Date(lead.createdAt || "").toLocaleDateString()}
              {lead.updatedAt !== lead.createdAt && ` • Updated ${new Date(lead.updatedAt || "").toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => enrichMutation.mutate()}
            disabled={enrichMutation.isPending}
            className="hover:bg-purple-50 hover:text-purple-600"
          >
            {enrichMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            AI Enrich
          </Button>
          <Button
            variant="outline"
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
            className="hover:bg-blue-50 hover:text-blue-600"
          >
            {assignMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
            AI Assign
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Lead Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Full Name</Label>
                  <p className="font-medium">{lead.name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Email</Label>
                  <a href={`mailto:${lead.email}`} className="font-medium text-emerald-600 hover:underline flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {lead.email}
                  </a>
                </div>
                {lead.phone && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <p className="font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone}</p>
                  </div>
                )}
                {lead.company && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Company</Label>
                    <p className="font-medium flex items-center gap-1"><Building2 className="w-3 h-3" /> {lead.company}</p>
                  </div>
                )}
                {lead.website && (
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Website</Label>
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-600 hover:underline flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {lead.website}
                    </a>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Source</Label>
                  <p className="font-medium capitalize">{lead.source.replace(/_/g, " ")}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={currentData.industry || ""}
                    onChange={e => setFormData((p: any) => ({ ...p, industry: e.target.value }))}
                    placeholder="Detected via AI enrichment"
                  />
                </div>
                <div className="space-y-2">
                  <Label>VyomAi Service</Label>
                  <Select
                    value={currentData.vyomaiService || ""}
                    onValueChange={(v) => setFormData((p: any) => ({ ...p, vyomaiService: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>AI-Analyzed Intent</Label>
                <Textarea
                  value={currentData.intent || ""}
                  onChange={e => setFormData((p: any) => ({ ...p, intent: e.target.value }))}
                  placeholder="AI will analyze intent via enrichment"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={currentData.notes || ""}
                  onChange={e => setFormData((p: any) => ({ ...p, notes: e.target.value }))}
                  rows={4}
                />
              </div>
              <Button
                onClick={() => {
                  const { id, createdAt, updatedAt, sourceInquiryId, ...data } = currentData as any;
                  updateMutation.mutate(data);
                }}
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-emerald-200 mb-3">
                  <span className="text-3xl font-bold text-emerald-600">{lead.score || "—"}</span>
                </div>
                <p className="text-sm text-gray-500">Lead Score</p>
              </div>
              <Separator />
              {lead.intent && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Detected Intent</p>
                  <p className="text-sm text-gray-700">{lead.intent}</p>
                </div>
              )}
              {lead.industry && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Industry</p>
                  <p className="text-sm text-gray-700">{lead.industry}</p>
                </div>
              )}
              {lead.vyomaiService && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Recommended Service</p>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                    {SERVICE_OPTIONS.find(o => o.value === lead.vyomaiService)?.label || lead.vyomaiService}
                  </Badge>
                </div>
              )}
              {!lead.industry && !lead.intent && (
                <p className="text-sm text-gray-400 text-center py-4">
                  Click "AI Enrich" to analyze this lead
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.assignedByName ? (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Assigned To</p>
                  <p className="font-medium">{lead.assignedByName}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Not assigned yet</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending}
                className="w-full"
              >
                {assignMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                AI Auto-Assign
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  if (confirm("Delete this lead permanently?")) {
                    const token = localStorage.getItem("vyomai-admin-token");
                    fetch(`/api/admin/leads/${leadId}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                    }).then(() => {
                      toast({ title: "Lead deleted" });
                      setLocation("/admin/leads");
                    });
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Lead
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
