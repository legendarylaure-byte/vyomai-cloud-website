import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type BookingRequest } from "@shared/schema";
import { Calendar, Loader2, Edit, Trash2, Mail, Phone, Building, User, Clock, CheckCircle2, AlertCircle, PlayCircle, Send } from "lucide-react";
import { z } from "zod";

const bookingUpdateSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  companyOrPersonal: z.string().min(1, "Company/Personal required"),
  message: z.string().optional(),
  status: z.enum(["created", "open", "ongoing", "completed"]),
  dueDate: z.string().optional(),
});

type BookingUpdateData = z.infer<typeof bookingUpdateSchema>;

const emailSchema = z.object({
  subject: z.string().min(1, "Subject required"),
  message: z.string().min(1, "Message required"),
});

type EmailFormData = z.infer<typeof emailSchema>;

export function BookingsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingRequest | null>(null);
  const [emailTarget, setEmailTarget] = useState<BookingRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: bookings = [], isLoading } = useQuery<BookingRequest[]>({
    queryKey: ["/api/bookings"],
    enabled: !!localStorage.getItem("vyomai-admin-token"),
  });

  const form = useForm<BookingUpdateData>({
    resolver: zodResolver(bookingUpdateSchema),
    defaultValues: {
      name: "",
      email: "",
      companyOrPersonal: "",
      message: "",
      status: "created",
      dueDate: "",
    },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      subject: "",
      message: "",
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async (data: BookingUpdateData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/bookings/${editingBooking?.id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Success", description: "Booking updated successfully" });
      setIsDialogOpen(false);
      setEditingBooking(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update booking", variant: "destructive" });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/bookings/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Success", description: "Booking deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete booking", variant: "destructive" });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: EmailFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("POST", "/api/admin/send-email", {
        to: emailTarget?.email,
        subject: data.subject,
        message: data.message,
        type: "booking_response",
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

  const onSubmit = (data: BookingUpdateData) => {
    updateBookingMutation.mutate(data);
  };

  const onSendEmail = (data: EmailFormData) => {
    sendEmailMutation.mutate(data);
  };

  const openEditDialog = (booking: BookingRequest) => {
    setEditingBooking(booking);
    form.reset({
      name: booking.name || "",
      email: booking.email || "",
      companyOrPersonal: booking.companyOrPersonal || "",
      message: booking.message || "",
      status: (booking.status as "created" | "open" | "ongoing" | "completed") || "created",
      dueDate: booking.dueDate || "",
    });
    setIsDialogOpen(true);
  };

  const openEmailDialog = (booking: BookingRequest) => {
    setEmailTarget(booking);
    emailForm.reset({
      subject: `Re: Your Booking Request - ${booking.companyOrPersonal || "Project Inquiry"}`,
      message: `Dear ${booking.name},\n\nThank you for your booking request. We have reviewed your inquiry and would like to discuss further.\n\nBest regards,\nVyomAi Team`,
    });
    setIsEmailDialogOpen(true);
  };

  const statusColors: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
    created: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", icon: Clock },
    open: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", icon: AlertCircle },
    ongoing: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", icon: PlayCircle },
    completed: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: CheckCircle2 },
  };

  const filteredBookings = filterStatus === "all" 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus);

  const stats = {
    total: bookings.length,
    created: bookings.filter(b => b.status === "created").length,
    open: bookings.filter(b => b.status === "open").length,
    ongoing: bookings.filter(b => b.status === "ongoing").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Bookings</h1>
          <p className="text-muted-foreground">Manage customer booking requests</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="glass-card border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold text-blue-600">{stats.created}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-bold text-purple-600">{stats.ongoing}</p>
              </div>
              <PlayCircle className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
            <DialogDescription>
              Update the booking details and status
            </DialogDescription>
          </DialogHeader>
          {editingBooking && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Client name" {...field} />
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
                    name="companyOrPersonal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company / Personal</FormLabel>
                        <FormControl>
                          <Input placeholder="Company or personal project" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Project details..." rows={3} {...field} />
                      </FormControl>
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
                          <SelectItem value="created">Created</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="ongoing">Ongoing</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateBookingMutation.isPending} className="w-full">
                  {updateBookingMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update Booking"
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

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const statusConfig = statusColors[booking.status || "created"];
            const StatusIcon = statusConfig?.icon || Clock;
            return (
              <Card key={booking.id} className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                    {/* Client Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <h3 className="font-bold">{booking.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {booking.email}
                      </div>
                    </div>

                    {/* Project Details */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Type</p>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{booking.companyOrPersonal || "Not specified"}</span>
                      </div>
                      {booking.dueDate && (
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(booking.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Message</p>
                      <p className="text-sm line-clamp-2">{booking.message || "No message"}</p>
                    </div>

                    {/* Status & Date */}
                    <div className="space-y-2">
                      <Badge className={`${statusConfig?.bg} ${statusConfig?.text} border-0 flex items-center gap-1 w-fit`}>
                        <StatusIcon className="w-3 h-3" />
                        {booking.status?.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-US", {
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
                        onClick={() => openEditDialog(booking)}
                        className="flex-1 min-w-[80px]"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEmailDialog(booking)}
                        className="flex-1 min-w-[80px]"
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this booking?")) {
                            deleteBookingMutation.mutate(booking.id);
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
            <Calendar className="w-12 h-12 opacity-50 mx-auto mb-4" />
            <p className="text-lg font-medium">No bookings found</p>
            <p className="text-sm">
              {filterStatus !== "all" ? "Try changing the filter" : "Bookings will appear here when customers submit requests"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
