import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Trash2, Edit, Loader2, Mail, Phone, User, MessageSquare, Clock, CheckCircle2, Eye, Archive, Send, Building, Tag } from "lucide-react";
import { type CustomerInquiry } from "@shared/schema";
import { z } from "zod";

const inquiryUpdateSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, "Message required"),
  company: z.string().optional(),
  inquiryType: z.enum(["custom_solution", "booking", "project_discussion", "contact"]),
  status: z.enum(["new", "contacted", "resolved"]),
});

type InquiryUpdateData = z.infer<typeof inquiryUpdateSchema>;

const emailSchema = z.object({
  subject: z.string().min(1, "Subject required"),
  message: z.string().min(1, "Message required"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export function InquiriesPage() {
  const { toast } = useToast();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<CustomerInquiry | null>(null);
  const [emailTarget, setEmailTarget] = useState<CustomerInquiry | null>(null);

  const { data: inquiries = [], isLoading } = useQuery<CustomerInquiry[]>({
    queryKey: ["/api/admin/inquiries"],
    enabled: !!localStorage.getItem("vyomai-admin-token"),
  });

  const form = useForm<InquiryUpdateData>({
    resolver: zodResolver(inquiryUpdateSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      inquiryType: "contact",
      status: "new",
      phone: "",
      subject: "",
      company: "",
    },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async (data: InquiryUpdateData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/inquiries/${editingInquiry?.id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast({ title: "Success", description: "Inquiry updated" });
      setIsDialogOpen(false);
      setEditingInquiry(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update inquiry", variant: "destructive" });
    },
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/inquiries/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast({ title: "Success", description: "Inquiry deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete inquiry", variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("POST", "/api/admin/send-email", {
        to: emailTarget?.email,
        subject: data.subject,
        message: data.message,
        type: "inquiry_response",
      }, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Email sent successfully" });
      setIsEmailDialogOpen(false);
      setEmailTarget(null);
      emailForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to send email", variant: "destructive" });
    },
  });

  const onSubmit = (data: InquiryUpdateData) => {
    updateInquiryMutation.mutate(data);
  };

  const onSendEmail = (data: EmailFormData) => {
    sendEmailMutation.mutate(data);
  };

  const openEditDialog = (inquiry: CustomerInquiry) => {
    setEditingInquiry(inquiry);
    form.reset({
      name: inquiry.name || "",
      email: inquiry.email || "",
      phone: inquiry.phone || "",
      subject: inquiry.subject || "",
      message: inquiry.message || "",
      company: inquiry.company || "",
      inquiryType: inquiry.inquiryType || "contact",
      status: (inquiry.status as "new" | "contacted" | "resolved") || "new",
    });
    setIsDialogOpen(true);
  };

  const openEmailDialog = (inquiry: CustomerInquiry) => {
    setEmailTarget(inquiry);
    emailForm.reset({
      subject: `Re: ${inquiry.subject || "Your Inquiry"} - VyomAi`,
      message: `Dear ${inquiry.name},\n\nThank you for reaching out to us. We have received your inquiry and would like to assist you further.\n\nBest regards,\nVyomAi Team`,
    });
    setIsEmailDialogOpen(true);
  };

  // Filter by type and status
  const filtered = inquiries.filter((i) => {
    const typeMatch = filterType === "all" || i.inquiryType === filterType;
    const statusMatch = filterStatus === "all" || i.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (sortBy === "newest") {
      return dateB - dateA;
    }
    return dateA - dateB;
  });

  const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
    new: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", icon: Clock },
    contacted: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", icon: Eye },
    resolved: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: CheckCircle2 },
  };

  const typeColors: Record<string, string> = {
    contact: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    booking: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    project_discussion: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    custom_solution: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  };

  const stats = {
    total: inquiries.length,
    new: inquiries.filter(i => i.status === "new").length,
    contacted: inquiries.filter(i => i.status === "contacted").length,
    resolved: inquiries.filter(i => i.status === "resolved").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Inquiries</h1>
          <p className="text-muted-foreground">Manage and respond to customer messages</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold text-blue-600">{stats.new}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.contacted}</p>
              </div>
              <Eye className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="booking">Booking</SelectItem>
            <SelectItem value="project_discussion">Project Discussion</SelectItem>
            <SelectItem value="custom_solution">Custom Solution</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(val) => setSortBy(val as "newest" | "oldest")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          Showing {sorted.length} of {inquiries.length}
        </span>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inquiry</DialogTitle>
            <DialogDescription>
              Update the inquiry details and status
            </DialogDescription>
          </DialogHeader>
          {editingInquiry && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Customer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Inquiry subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Message content" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="inquiryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="contact">Contact</SelectItem>
                            <SelectItem value="booking">Booking</SelectItem>
                            <SelectItem value="project_discussion">Project Discussion</SelectItem>
                            <SelectItem value="custom_solution">Custom Solution</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={updateInquiryMutation.isPending} className="w-full">
                  {updateInquiryMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update Inquiry"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Send Email
            </DialogTitle>
            <DialogDescription>
              Send an email to {emailTarget?.name} ({emailTarget?.email})
            </DialogDescription>
          </DialogHeader>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onSendEmail)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={emailForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Email message" rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={sendEmailMutation.isPending} className="w-full">
                {sendEmailMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Inquiries List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : sorted.length > 0 ? (
        <div className="space-y-4">
          {sorted.map((inquiry) => {
            const statusConfig = statusColors[inquiry.status || "new"];
            const StatusIcon = statusConfig?.icon || Clock;
            return (
              <Card key={inquiry.id} className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                    {/* Contact Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-bold">{inquiry.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {inquiry.email}
                      </div>
                      {inquiry.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {inquiry.phone}
                        </div>
                      )}
                      {inquiry.company && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building className="w-3 h-3" />
                          {inquiry.company}
                        </div>
                      )}
                    </div>

                    {/* Subject & Message */}
                    <div className="space-y-1 lg:col-span-2">
                      {inquiry.subject && (
                        <p className="font-medium text-sm">{inquiry.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-3">{inquiry.message}</p>
                    </div>

                    {/* Status & Type */}
                    <div className="space-y-2">
                      <Badge className={`${statusConfig?.bg} ${statusConfig?.text} border-0 flex items-center gap-1 w-fit`}>
                        <StatusIcon className="w-3 h-3" />
                        {inquiry.status?.toUpperCase()}
                      </Badge>
                      <Badge className={`${typeColors[inquiry.inquiryType || "contact"]} border-0 flex items-center gap-1 w-fit`}>
                        <Tag className="w-3 h-3" />
                        {inquiry.inquiryType?.replace("_", " ").toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }) : "N/A"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(inquiry)}
                        className="flex-1 min-w-[80px]"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEmailDialog(inquiry)}
                        className="flex-1 min-w-[80px]"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this inquiry?")) {
                            deleteInquiryMutation.mutate(inquiry.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 opacity-50 mx-auto mb-4" />
            <p className="text-lg font-medium">No inquiries found</p>
            <p className="text-sm">
              {filterType !== "all" || filterStatus !== "all" ? "Try changing the filters" : "Customer inquiries will appear here"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
