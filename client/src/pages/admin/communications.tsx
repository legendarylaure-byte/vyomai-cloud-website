import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  MessageSquare, Calendar, Loader2, Eye, Trash2, Search, 
  BookOpen, Mail, Phone, User, Clock, CheckCircle2, XCircle, AlertCircle,
  Filter
} from "lucide-react";

interface BookingRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  preferredDate?: string;
  preferredTime?: string;
  packageId?: string;
  status: string;
  createdAt: string;
}

interface CustomerInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: string;
  createdAt: string;
}

type CommunicationItem = (BookingRequest | CustomerInquiry) & { 
  type: "booking" | "inquiry";
};

export function CommunicationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<CommunicationItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<BookingRequest[]>({
    queryKey: ["/api/admin/bookings"],
    queryFn: async () => {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch("/api/admin/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const { data: inquiries = [], isLoading: inquiriesLoading } = useQuery<CustomerInquiry[]>({
    queryKey: ["/api/admin/inquiries"],
    queryFn: async () => {
      const token = localStorage.getItem("vyomai-admin-token");
      const res = await fetch("/api/admin/inquiries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/bookings/${id}`, { status }, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Booking status updated" });
    },
  });

  const updateInquiryMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("PUT", `/api/admin/inquiries/${id}`, { status }, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast({ title: "Inquiry status updated" });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/bookings/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
      toast({ title: "Booking deleted" });
    },
  });

  const deleteInquiryMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      return apiRequest("DELETE", `/api/admin/inquiries/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inquiries"] });
      toast({ title: "Inquiry deleted" });
    },
  });

  const allCommunications = useMemo(() => {
    const bookingItems: CommunicationItem[] = bookings.map(b => ({ ...b, type: "booking" as const }));
    const inquiryItems: CommunicationItem[] = inquiries.map(i => ({ ...i, type: "inquiry" as const }));
    return [...bookingItems, ...inquiryItems].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [bookings, inquiries]);

  const filteredItems = useMemo(() => {
    let items = allCommunications;
    
    if (activeTab === "bookings") {
      items = items.filter(i => i.type === "booking");
    } else if (activeTab === "inquiries") {
      items = items.filter(i => i.type === "inquiry");
    }
    
    if (statusFilter !== "all") {
      items = items.filter(i => i.status === statusFilter);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(term) || 
        i.email.toLowerCase().includes(term) ||
        (i.message && i.message.toLowerCase().includes(term))
      );
    }
    
    return items;
  }, [allCommunications, activeTab, statusFilter, searchTerm]);

  const isLoading = bookingsLoading || inquiriesLoading;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "completed":
      case "resolved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleStatusChange = (item: CommunicationItem, newStatus: string) => {
    if (item.type === "booking") {
      updateBookingMutation.mutate({ id: item.id, status: newStatus });
    } else {
      updateInquiryMutation.mutate({ id: item.id, status: newStatus });
    }
  };

  const handleDelete = (item: CommunicationItem) => {
    if (item.type === "booking") {
      deleteBookingMutation.mutate(item.id);
    } else {
      deleteInquiryMutation.mutate(item.id);
    }
    setIsDialogOpen(false);
  };

  const stats = {
    total: allCommunications.length,
    pending: allCommunications.filter(i => i.status === "pending").length,
    bookings: bookings.length,
    inquiries: inquiries.length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-purple-600" />
            Communications
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage all bookings and inquiries in one place
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bookings</p>
                <p className="text-2xl font-bold text-blue-600">{stats.bookings}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inquiries</p>
                <p className="text-2xl font-bold text-green-600">{stats.inquiries}</p>
              </div>
              <Mail className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({allCommunications.length})</TabsTrigger>
                <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
                <TabsTrigger value="inquiries">Inquiries ({inquiries.length})</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No communications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${item.type === "booking" ? "bg-blue-100" : "bg-green-100"}`}>
                      {item.type === "booking" ? (
                        <Calendar className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Mail className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {item.type === "booking" ? "Booking" : "Inquiry"}
                        </Badge>
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{item.email}</p>
                      {item.message && (
                        <p className="text-sm text-gray-500 line-clamp-1">{item.message}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={item.status} 
                      onValueChange={(v) => handleStatusChange(item, v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(item)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.type === "booking" ? (
                <>
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Booking Details
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 text-green-600" />
                  Inquiry Details
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedItem.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedItem.email}</p>
                </div>
                {selectedItem.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{selectedItem.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedItem.status)}
                </div>
              </div>
              
              {selectedItem.type === "booking" && (selectedItem as BookingRequest).preferredDate && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Preferred Date</p>
                    <p className="font-medium">{(selectedItem as BookingRequest).preferredDate}</p>
                  </div>
                  {(selectedItem as BookingRequest).preferredTime && (
                    <div>
                      <p className="text-sm text-gray-500">Preferred Time</p>
                      <p className="font-medium">{(selectedItem as BookingRequest).preferredTime}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedItem.type === "inquiry" && (selectedItem as CustomerInquiry).subject && (
                <div>
                  <p className="text-sm text-gray-500">Subject</p>
                  <p className="font-medium">{(selectedItem as CustomerInquiry).subject}</p>
                </div>
              )}

              {selectedItem.message && (
                <div>
                  <p className="text-sm text-gray-500">Message</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedItem.message}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Received</p>
                <p className="font-medium">
                  {new Date(selectedItem.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            {selectedItem && (
              <Button 
                variant="destructive"
                onClick={() => handleDelete(selectedItem)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
