import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface AnalyticsData {
  hourlyVisitors: Array<{ hour: string; visitors: number }>;
  trafficSources: Array<{ name: string; value: number }>;
  deviceTypes: Array<{ name: string; value: number }>;
  engagementMetrics: Array<{ metric: string; value: number }>;
  topPages: Array<{ page: string; views: number }>;
}

interface AnalyticsChartsProps {
  data: AnalyticsData;
}

const COLORS = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"];

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Hourly Visitors Chart */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Visitor Traffic (24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.hourlyVisitors}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="visitors"
                stroke="#8B5CF6"
                dot={{ fill: "#8B5CF6", r: 4 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Traffic Sources & Device Types */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.trafficSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.trafficSources.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.deviceTypes}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {data.engagementMetrics.map((metric, index) => (
              <div key={index} className="p-4 rounded-lg bg-muted/50">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {metric.metric}
                </h4>
                <div className="text-2xl font-bold gradient-text">
                  {metric.value}
                  {metric.metric.includes("Time")
                    ? "s"
                    : metric.metric.includes("Rate")
                    ? "%"
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Pages */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle>Top Pages by Views</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topPages} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted-foreground)" />
              <YAxis dataKey="page" type="category" stroke="var(--muted-foreground)" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="views" fill="#10B981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
