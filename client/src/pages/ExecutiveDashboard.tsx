import { useAuth } from "@/_core/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Building2 } from "lucide-react";

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const permissions = usePermissions();

  if (!permissions.has("executive.view")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view the Executive Dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Executive Dashboard</h1>
        <p className="text-muted-foreground">Key Performance Indicators and Business Metrics</p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Per Month KPI */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Omzet / Maand</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€ 245,600</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-600" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        {/* Occupancy Rate by Location */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Bezettingsgraad / Locatie</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">76%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-600" />
              Average across all locations
            </p>
          </CardContent>
        </Card>

        {/* Member Growth */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Member Groei</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,847</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-600" />
              +156 new members (30d)
            </p>
          </CardContent>
        </Card>

        {/* Revenue MoM Comparison */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Revenue MoM</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+8.4%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Compared to previous month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Extended metrics section */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Location Performance</CardTitle>
            <CardDescription>Top performing locations by occupancy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Amsterdam Central</span>
                <span className="text-sm font-bold">92%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Rotterdam West</span>
                <span className="text-sm font-bold">88%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Utrecht North</span>
                <span className="text-sm font-bold">71%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">The Hague South</span>
                <span className="text-sm font-bold">65%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Monthly financial metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-sm font-bold">€ 245,600</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Operating Costs</span>
                <span className="text-sm font-bold">€ 142,300</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm font-medium">Net Profit</span>
                <span className="text-sm font-bold text-green-600">€ 103,300</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Profit Margin</span>
                <span className="text-sm font-bold">42.1%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
