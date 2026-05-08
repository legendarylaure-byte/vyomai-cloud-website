import { useQuery } from "@tanstack/react-query";
import { BarChart3, Users, MessageSquare, Eye, Calendar, TrendingUp, FileText, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type VisitorStats, type BookingRequest, type Article, type TeamMember, type PricingPackage, type CustomerInquiry } from "@shared/schema";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "wouter";

export function AdminDashboard() {
  const { data: visitors } = useQuery<VisitorStats>({
    queryKey: ["/api/visitors"],
  });

  const { data: bookings = [] } = useQuery<BookingRequest[]>({
    queryKey: ["/api/bookings"],
    enabled: !!localStorage.getItem("vyomai-admin-token"),
  });

  const { data: inquiries = [] } = useQuery<CustomerInquiry[]>({
    queryKey: ["/api/admin/inquiries"],
    enabled: !!localStorage.getItem("vyomai-admin-token"),
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: team = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: pricing = [] } = useQuery<PricingPackage[]>({
    queryKey: ["/api/pricing"],
  });

  const bookingStatusData = [
    { name: "Completed", value: bookings.filter(b => b.status === "completed").length, color: "#10b981" },
    { name: "In Progress", value: bookings.filter(b => b.status === "ongoing").length, color: "#3b82f6" },
    { name: "Pending", value: bookings.filter(b => b.status === "open" || b.status === "created").length, color: "#f59e0b" },
  ].filter(item => item.value > 0);

  const inquiryData = [
    { name: "Contact", count: inquiries.filter(i => i.inquiryType === "contact").length },
    { name: "Booking", count: inquiries.filter(i => i.inquiryType === "booking").length },
    { name: "Project", count: inquiries.filter(i => i.inquiryType === "project_discussion").length },
    { name: "Custom", count: inquiries.filter(i => i.inquiryType === "custom_solution").length },
  ];

  const statsCards = [
    { 
      title: "Total Visitors", 
      value: visitors?.totalVisitors || 0, 
      icon: Eye, 
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: "+12%",
      trend: "up"
    },
    { 
      title: "Today's Visitors", 
      value: visitors?.todayVisitors || 0, 
      icon: TrendingUp, 
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
      change: "+5%",
      trend: "up"
    },
    { 
      title: "Communications", 
      value: bookings.length + inquiries.length, 
      icon: MessageSquare, 
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
      change: `${bookings.length} bookings, ${inquiries.length} inquiries`,
      trend: "neutral"
    },
    { 
      title: "Pending Actions", 
      value: bookings.filter(b => b.status === "open" || b.status === "created" || b.status === "pending").length + 
        inquiries.filter(i => i.status === "new" || i.status === "pending").length, 
      icon: Calendar, 
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
      change: "Needs attention",
      trend: "neutral"
    },
  ];

  const totalCommunications = bookings.length + inquiries.length;
  const pendingCommunications = bookings.filter(b => b.status === "open" || b.status === "created" || b.status === "pending").length + 
    inquiries.filter(i => i.status === "new" || i.status === "pending").length;

  const quickLinks = [
    { label: "Articles", value: articles.length, icon: FileText, href: "/admin/articles", color: "text-blue-600" },
    { label: "Team Members", value: team.filter(t => t.enabled).length, icon: Users, href: "/admin/team", color: "text-green-600" },
    { label: "Pricing Plans", value: pricing.filter(p => p.enabled).length, icon: DollarSign, href: "/admin/pricing", color: "text-purple-600" },
    { label: "Communications", value: totalCommunications, icon: MessageSquare, href: "/admin/communications", color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-500">Here's what's happening with your platform today.</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : stat.trend === "down" ? (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      ) : null}
                      <span className={`text-sm ${stat.trend === "up" ? "text-green-600" : stat.trend === "down" ? "text-red-600" : "text-gray-500"}`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.lightColor}`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.label} to={link.href}>
            <Card className="border-gray-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <link.icon className={`w-5 h-5 ${link.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{link.value}</p>
                  <p className="text-sm text-gray-500">{link.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Inquiry Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inquiryData.some(item => item.count > 0) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inquiryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No inquiry data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Booking Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingStatusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 -mt-4">
                  {bookingStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No bookings yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              Recent Inquiries
            </CardTitle>
            <Link to="/admin/inquiries">
              <span className="text-sm text-purple-600 hover:text-purple-700 font-medium cursor-pointer">
                View All
              </span>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {inquiries.length > 0 ? (
            <div className="space-y-3">
              {inquiries.slice(0, 5).map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {inquiry.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{inquiry.name}</p>
                      <p className="text-sm text-gray-500">{inquiry.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      inquiry.status === "new" 
                        ? "bg-green-100 text-green-700" 
                        : inquiry.status === "contacted" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {inquiry.status || "new"}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {inquiry.inquiryType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No inquiries yet</p>
              <p className="text-sm">New inquiries will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
