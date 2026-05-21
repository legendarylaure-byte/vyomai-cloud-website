import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, TrendingUp, Monitor, Smartphone, Tablet, Globe, BarChart3, Loader2, RefreshCw, Users, Clock, MousePointer2, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { type VisitorStats } from "@shared/schema";

const COLORS = ["#8b5cf6", "#f97316", "#10b981", "#3b82f6", "#ef4444", "#eab308"];

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("24h");

  const { data: visitors, isLoading } = useQuery<VisitorStats>({
    queryKey: ["/api/visitors"],
  });

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (!visitors) {
    return <div className="p-12 text-center text-muted-foreground">No analytics data available</div>;
  }

  const trafficColors: Record<string, string> = {
    Direct: "#8b5cf6",
    Search: "#f97316",
    Social: "#10b981",
    Referral: "#3b82f6",
  };

  const deviceIcons: Record<string, any> = {
    Desktop: Monitor,
    Mobile: Smartphone,
    Tablet: Tablet,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Site traffic and engagement metrics</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["24h", "7d", "30d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                timeRange === range ? "bg-white text-purple-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50"><Eye className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Visitors</p>
                <p className="text-2xl font-bold">{formatNumber(visitors.totalVisitors)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50"><TrendingUp className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{formatNumber(visitors.todayVisitors)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50"><Users className="w-5 h-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Avg. Session</p>
                <p className="text-2xl font-bold">
                  {visitors.engagementMetrics?.find(m => m.metric.includes("Session"))?.value || 0}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-50"><BarChart3 className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Pages/Session</p>
                <p className="text-2xl font-bold">
                  {visitors.engagementMetrics?.find(m => m.metric.includes("Pages"))?.value?.toFixed(1) || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Traffic + Traffic Sources */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Hourly Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitors.hourlyData || []}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Area type="monotone" dataKey="visitors" stroke="#8b5cf6" fill="url(#colorVisitors)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visitors.trafficSources || []}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {(visitors.trafficSources || []).map((entry, i) => (
                      <Cell key={entry.name} fill={trafficColors[entry.name] || COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {(visitors.trafficSources || []).map((source) => (
                <div key={source.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: trafficColors[source.name] || "#8b5cf6" }} />
                    <span>{source.name}</span>
                  </div>
                  <span className="font-medium">{source.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Types + Top Pages */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitors.deviceTypes || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={70} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {(visitors.deviceTypes || []).map((entry, i) => (
                      <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(visitors.topPages || []).map((page, i) => (
                <div key={page.page} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{page.page}</span>
                      <span className="font-medium">{formatNumber(page.views)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-orange-400 rounded-full"
                        style={{ width: `${(page.views / Math.max(...(visitors.topPages || []).map(p => p.views), 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics + Social Media */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {(visitors.engagementMetrics || []).map((metric) => (
                <div key={metric.metric} className="text-center p-4 rounded-xl bg-gray-50">
                  <p className="text-2xl font-bold text-purple-600">
                    {metric.metric.includes("Bounce") ? metric.value + "%" : metric.metric.includes("Time") ? metric.value + "m" : metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.metric}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Social Media Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(visitors.socialMediaStats || []).map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium w-24">{platform.platform}</span>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span title="Impressions">{formatNumber(platform.impressions || 0)}</span>
                    <span title="Likes">♥ {formatNumber(platform.likes || 0)}</span>
                    <span title="Shares">↗ {formatNumber(platform.shares || 0)}</span>
                    <span title="Comments">💬 {formatNumber(platform.comments || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
