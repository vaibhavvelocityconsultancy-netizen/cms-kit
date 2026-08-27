// components/admin/RedirectAnalytics.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/ui/tabs";
import { Badge } from "@/src/ui/badge";
import { getApiBaseUrl } from "@/src/lib/axios";
import {
  BarChart,
  LineChart,
  AlertTriangle,
  TrendingUp,
  Zap,
  Info,
} from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
}

interface AnalyticsData {
  total: number;
  active: number;
  permanent: number;
  temporary: number;
  totalHits: number;
  avgHitsPerRedirect: number;
  autoDetected: number;
  unused: number;
}

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

export function RedirectAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["redirect-stats"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/redirects/stats"));
      const data = await res.json();
      return data.data as AnalyticsData;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const { data: recommendations } = useQuery({
    queryKey: ["redirect-recommendations"],
    queryFn: async () => {
      const res = await fetch(apiPath("/api/redirects/recommendations"));
      const data = await res.json();
      return data.data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading analytics...
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      title: "Total Redirects",
      value: stats?.total || 0,
      description: "All configured redirects",
      icon: <Zap className="w-5 h-5" />,
      color: "text-blue-600",
    },
    {
      title: "Active Redirects",
      value: stats?.active || 0,
      description: `${stats?.active || 0} of ${stats?.total || 0} enabled`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-green-600",
    },
    {
      title: "Total Hits",
      value: stats?.totalHits?.toLocaleString() || 0,
      description: `Avg ${stats?.avgHitsPerRedirect || 0} per redirect`,
      icon: <BarChart className="w-5 h-5" />,
      color: "text-purple-600",
    },
    {
      title: "Unused Redirects",
      value: stats?.unused || 0,
      description: "No hits since creation",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={card.color}>{card.icon}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Breakdown & Recommendations */}
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="guide">SEO Guide</TabsTrigger>
        </TabsList>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Code Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Redirect Types</CardTitle>
                <CardDescription>Permanent vs Temporary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">301 Permanent</span>
                    <Badge className="bg-green-100 text-green-700">
                      {stats?.permanent || 0}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${((stats?.permanent || 0) / (stats?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">302 Temporary</span>
                    <Badge className="bg-blue-100 text-blue-700">
                      {stats?.temporary || 0}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${((stats?.temporary || 0) / (stats?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    ℹ️ For SEO, prefer 301s for permanent changes
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Activity Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Status</CardTitle>
                <CardDescription>Active vs Inactive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active</span>
                    <Badge className="bg-green-100 text-green-700">
                      {stats?.active || 0}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${((stats?.active || 0) / (stats?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Inactive</span>
                    <Badge className="bg-gray-100 text-gray-700">
                      {(stats?.total || 0) - (stats?.active || 0)}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400"
                      style={{
                        width: `${(((stats?.total || 0) - (stats?.active || 0)) / (stats?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    📊 Disable old redirects to reduce clutter
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Auto-detection Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Auto-Detection</CardTitle>
                <CardDescription>From 404 tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Auto-Detected</span>
                    <Badge className="bg-blue-100 text-blue-700">
                      {stats?.autoDetected || 0}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${((stats?.autoDetected || 0) / (stats?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Manual</span>
                    <Badge className="bg-purple-100 text-purple-700">
                      {(stats?.total || 0) - (stats?.autoDetected || 0)}
                    </Badge>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{
                        width: `${(((stats?.total || 0) - (stats?.autoDetected || 0)) / (stats?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    ✅ Review 404 logs to auto-detect patterns
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Improvement Suggestions</CardTitle>
              <CardDescription>Based on your redirect data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!recommendations || recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-green-600 text-lg mb-2">✓</div>
                  <p className="text-muted-foreground">All systems optimal!</p>
                </div>
              ) : (
                recommendations.map((rec: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {rec.description}
                        </p>
                        {rec.count && (
                          <Badge className="mt-2">{rec.count} affected</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Guide Tab */}
        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Redirect Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">
                    ✓ Use 301 for:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Permanent page renames</li>
                    <li>• URL structure changes</li>
                    <li>• Moved content pages</li>
                    <li>• Domain migrations</li>
                    <li>
                      <strong>Why:</strong> Transfers SEO equity (PageRank)
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-blue-700 mb-2">
                    ⚠ Use 302 for:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Temporary maintenance</li>
                    <li>• A/B testing</li>
                    <li>• Seasonal/promotional pages</li>
                    <li>• Short-term redirects</li>
                    <li>
                      <strong>Why:</strong> Doesn't transfer SEO value
                    </li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-amber-700 mb-2">
                    ⚠️ Avoid:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Redirect chains (A→B→C) - consolidate to A→C</li>
                    <li>• Circular redirects (A→B→A)</li>
                    <li>• Redirecting to 404 pages</li>
                    <li>• Too many redirects on main traffic paths</li>
                    <li>• Outdated redirects (disable if unused)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
