import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, CheckCircle, AlertCircle, ChevronRight, Users, Shield } from "lucide-react";

const mockIncidents = [
  { id: "1", title: "Security breach", location: "Server Room", severity: "critical", status: "escalated", reported_by: "Sarah", current_level: "admin", sla_hours: 1, breached: false },
  { id: "2", title: "HVAC malfunction", location: "HVAC", severity: "high", status: "escalated", reported_by: "Mike", current_level: "host", sla_hours: 2, breached: false },
  { id: "3", title: "Network outage", location: "Network", severity: "critical", status: "acknowledged", reported_by: "Tom", current_level: "facility", sla_hours: 1, breached: true },
];

const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400", medium: "bg-amber-500/10 text-amber-400",
  high: "bg-orange-500/10 text-orange-400", critical: "bg-red-500/10 text-red-400",
};

const levelColors: Record<string, string> = {
  facility: "bg-blue-500/10 text-blue-400", host: "bg-amber-500/10 text-amber-400",
  admin: "bg-red-500/10 text-red-400",
};

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <Card className="p-3 md:p-4">
      <div className="flex items-start justify-between">
        <div className={`${bg} w-8 h-8 rounded-lg flex items-center justify-center`}>
          <Icon className={`${color} w-4 h-4`} />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase">{label}</p>
          <p className="text-lg font-semibold mt-1">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function SLAIndicator({ incident }: { incident: any }) {
  const now = new Date();
  const reported = new Date(incident.reported_at || Date.now());
  const diffHours = (now.getTime() - reported.getTime()) / (1000 * 60 * 60);
  const remaining = incident.sla_hours - diffHours;
  const percentage = Math.max(0, (remaining / incident.sla_hours) * 100);
  const statusColor = incident.breached ? "bg-red-500" : percentage < 25 ? "bg-red-500" : percentage < 50 ? "bg-amber-500" : "bg-green-500";
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>SLA: {incident.sla_hours}h</span>
        <span className="text-muted-foreground">{remaining > 0 ? `${remaining.toFixed(1)}h left` : "BREACHED"}</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full"><div className={`h-full ${statusColor}`} style={{ width: `${Math.max(0, percentage)}%` }} /></div>
    </div>
  );
}

export default function IncidentEscalation() {
  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filteredIncidents = mockIncidents.filter(i => 
    (i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (severityFilter === "all" || i.severity === severityFilter)
  );

  const activeIncidents = filteredIncidents.filter(i => i.status !== "resolved");
  const breachedCount = mockIncidents.filter(i => i.breached && i.status !== "resolved").length;
  const escalatedCount = mockIncidents.filter(i => i.status === "escalated").length;
  const criticalCount = mockIncidents.filter(i => i.severity === "critical" && i.status !== "resolved").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light">Incident Escalation</h1>
        <p className="text-muted-foreground text-sm mt-1">3-level escalation, SLA tracking & timeline view</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={AlertTriangle} label="Critical" value={criticalCount} color="text-red-500" bg="bg-red-500/10" />
        <StatCard icon={AlertCircle} label="Escalated" value={escalatedCount} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard icon={Clock} label="SLA Breached" value={breachedCount} color="text-orange-500" bg="bg-orange-500/10" />
        <StatCard icon={CheckCircle} label="Resolved" value="1" color="text-green-500" bg="bg-green-500/10" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active"><AlertCircle className="w-4 h-4 mr-2" />Active</TabsTrigger>
          <TabsTrigger value="resolved"><CheckCircle className="w-4 h-4 mr-2" />Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {activeIncidents.length === 0 ? (
              <Card className="p-8 text-center"><p className="text-muted-foreground">No active incidents</p></Card>
            ) : (
              activeIncidents.map(incident => (
                <Card key={incident.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="font-semibold text-sm">{incident.title}</h3>
                        <p className="text-xs text-muted-foreground">{incident.location}</p></div>
                      <div className="flex gap-2">
                        <Badge className={severityColors[incident.severity]}>{incident.severity}</Badge>
                        <Badge className={levelColors[incident.current_level]}>{incident.current_level}</Badge>
                      </div>
                    </div>
                    <SLAIndicator incident={incident} />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <Card className="p-8 text-center"><p className="text-muted-foreground">No resolved incidents</p></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
