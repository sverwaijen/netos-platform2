<<<<<<< HEAD
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, Search, Filter, AlertTriangle, Clock, CheckCircle,
  TrendingUp, AlertCircle, ChevronRight, Zap, Users, Shield,
  ArrowUp, ArrowRight, Activity, ChevronDown,
} from "lucide-react";

interface EscalationEvent {
  timestamp: string;
  level: "facility" | "host" | "admin";
  action: string;
  actor: string;
}

interface Incident {
  id: string;
  title: string;
  location: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "acknowledged" | "escalated" | "resolved";
  reported_at: string;
  reported_by: string;
  current_level: "facility" | "host" | "admin";
  sla_hours: number;
  breached: boolean;
  events: EscalationEvent[];
}

const severityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400",
  medium: "bg-amber-500/10 text-amber-400",
  high: "bg-orange-500/10 text-orange-400",
  critical: "bg-red-500/10 text-red-400",
};

const levelColors: Record<string, string> = {
  facility: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  host: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  admin: "bg-red-500/10 text-red-400 border-red-500/30",
};

const levelIcons: Record<string, any> = {
  facility: Users,
  host: AlertTriangle,
  admin: Shield,
};

// Mock data - replace with tRPC calls
const mockIncidents: Incident[] = [
  {
    id: "1",
    title: "Security breach attempt - unauthorized access",
    location: "Server Room",
    severity: "critical",
    status: "escalated",
    reported_at: "2024-04-14T08:30:00",
    reported_by: "Sarah Chen",
    current_level: "admin",
    sla_hours: 1,
    breached: false,
    events: [
      { timestamp: "2024-04-14T08:30:00", level: "facility", action: "Incident reported", actor: "Sarah Chen" },
      { timestamp: "2024-04-14T08:45:00", level: "facility", action: "Initial assessment", actor: "Facility Team" },
      { timestamp: "2024-04-14T09:00:00", level: "host", action: "Escalated to host", actor: "Facility Manager" },
      { timestamp: "2024-04-14T09:15:00", level: "admin", action: "Escalated to admin", actor: "Host" },
    ],
  },
  {
    id: "2",
    title: "Environmental control system malfunction",
    location: "HVAC Control",
    severity: "high",
    status: "escalated",
    reported_at: "2024-04-14T07:00:00",
    reported_by: "Mike Johnson",
    current_level: "host",
    sla_hours: 2,
    breached: false,
    events: [
      { timestamp: "2024-04-14T07:00:00", level: "facility", action: "Incident reported", actor: "Mike Johnson" },
      { timestamp: "2024-04-14T07:20:00", level: "facility", action: "Troubleshooting started", actor: "Facility Tech" },
      { timestamp: "2024-04-14T08:30:00", level: "host", action: "Escalated to host", actor: "Facility Manager" },
    ],
  },
  {
    id: "3",
    title: "Network outage in main office",
    location: "Network Room",
    severity: "critical",
    status: "acknowledged",
    reported_at: "2024-04-14T06:15:00",
    reported_by: "Tom Wu",
    current_level: "facility",
    sla_hours: 1,
    breached: true,
    events: [
      { timestamp: "2024-04-14T06:15:00", level: "facility", action: "Incident reported", actor: "Tom Wu" },
      { timestamp: "2024-04-14T06:30:00", level: "facility", action: "Incident acknowledged", actor: "IT Support" },
    ],
  },
  {
    id: "4",
    title: "Water leak in basement",
    location: "Basement",
    severity: "high",
    status: "resolved",
    reported_at: "2024-04-13T14:00:00",
    reported_by: "Jane Smith",
    current_level: "facility",
    sla_hours: 4,
    breached: false,
    events: [
      { timestamp: "2024-04-13T14:00:00", level: "facility", action: "Incident reported", actor: "Jane Smith" },
      { timestamp: "2024-04-13T14:30:00", level: "facility", action: "Team dispatched", actor: "Maintenance" },
      { timestamp: "2024-04-13T16:45:00", level: "facility", action: "Issue resolved", actor: "Maintenance Team" },
    ],
  },
];

function TimeSinceReport({ timestamp }: { timestamp: string }) {
  const now = new Date();
  const reported = new Date(timestamp);
  const diffMs = now.getTime() - reported.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="text-xs text-muted-foreground">
      {diffHours > 0 ? `${diffHours}h ${diffMins}m` : `${diffMins}m`} ago
    </div>
  );
}

function SLAIndicator({ incident }: { incident: Incident }) {
  const now = new Date();
  const reported = new Date(incident.reported_at);
  const diffHours = (now.getTime() - reported.getTime()) / (1000 * 60 * 60);
  const remaining = incident.sla_hours - diffHours;
  const percentage = Math.max(0, (remaining / incident.sla_hours) * 100);

  let statusColor = "bg-green-500";
  if (incident.breached) {
    statusColor = "bg-red-500";
  } else if (percentage < 25) {
    statusColor = "bg-red-500";
  } else if (percentage < 50) {
    statusColor = "bg-amber-500";
  } else if (percentage < 75) {
    statusColor = "bg-yellow-500";
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">SLA: {incident.sla_hours}h</span>
        <span className="text-xs text-muted-foreground">
          {remaining > 0 ? `${remaining.toFixed(1)}h left` : "BREACHED"}
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${statusColor} transition-all duration-300`}
          style={{ width: `${Math.max(0, percentage)}%` }}
        />
      </div>
    </div>
  );
}

function EscalationTimeline({ events }: { events: EscalationEvent[] }) {
  return (
    <div className="space-y-3 py-2">
      {events.map((event, idx) => {
        const Icon = levelIcons[event.level];
        return (
          <div key={idx} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`${levelColors[event.level].split(" ")[0]} p-1.5 rounded-full`}>
                <Icon className="w-3 h-3" />
              </div>
              {idx < events.length - 1 && (
                <div className="w-0.5 h-6 bg-border my-1" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p className="text-xs font-medium">{event.action}</p>
              <p className="text-xs text-muted-foreground">
                {event.actor} • {new Date(event.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

=======
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

>>>>>>> origin/claude/tech-debt-cleanup
function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <Card className="p-3 md:p-4">
      <div className="flex items-start justify-between">
<<<<<<< HEAD
        <div className={`${bg} w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center`}>
          <Icon className={`${color} w-4 h-4 md:w-5 md:h-5`} />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-lg md:text-2xl font-semibold leading-none mt-1">{value}</p>
=======
        <div className={`${bg} w-8 h-8 rounded-lg flex items-center justify-center`}>
          <Icon className={`${color} w-4 h-4`} />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase">{label}</p>
          <p className="text-lg font-semibold mt-1">{value}</p>
>>>>>>> origin/claude/tech-debt-cleanup
        </div>
      </div>
    </Card>
  );
}

<<<<<<< HEAD
function IncidentDetailDialog({ incident, open, onOpenChange }: { incident?: Incident; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!incident) return null;

  return (
    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {incident.title}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location</label>
            <p className="text-sm font-medium mt-1">{incident.location}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reported By</label>
            <p className="text-sm font-medium mt-1">{incident.reported_by}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Severity</label>
            <Badge className={`${severityColors[incident.severity]} mt-1`}>
              {incident.severity}
            </Badge>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Level</label>
            <Badge className={`${levelColors[incident.current_level]} mt-1`}>
              {incident.current_level}
            </Badge>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold mb-3">SLA Status</h4>
          <SLAIndicator incident={incident} />
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold mb-3">Escalation Timeline</h4>
          <EscalationTimeline events={incident.events} />
        </div>

        <div className="border-t border-border pt-4">
          <Button className="w-full bg-[#627653] hover:bg-[#627653]/90">
            Take Action
          </Button>
        </div>
      </div>
    </DialogContent>
=======
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
>>>>>>> origin/claude/tech-debt-cleanup
  );
}

export default function IncidentEscalation() {
<<<<<<< HEAD
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [selectedIncident, setSelectedIncident] = useState<Incident | undefined>();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Filter incidents
  const filteredIncidents = mockIncidents.filter((incident) => {
    const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  // Separate active and resolved
  const activeIncidents = filteredIncidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = filteredIncidents.filter((i) => i.status === "resolved");

  // Calculate stats
  const breachedCount = mockIncidents.filter((i) => i.breached && i.status !== "resolved").length;
  const escalatedCount = mockIncidents.filter((i) => i.status === "escalated").length;
  const criticalCount = mockIncidents.filter((i) => i.severity === "critical" && i.status !== "resolved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Incident Escalation</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">3-level escalation, SLA tracking & timeline view</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard
          icon={AlertTriangle}
          label="Critical"
          value={criticalCount}
          color="text-red-500"
          bg="bg-red-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label="Escalated"
          value={escalatedCount}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={Zap}
          label="SLA Breached"
          value={breachedCount}
          color="text-orange-500"
          bg="bg-orange-500/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Resolved"
          value={resolvedIncidents.length}
          color="text-green-500"
          bg="bg-green-500/10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:grid-cols-none">
          <TabsTrigger value="active" className="text-xs sm:text-sm relative">
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Active</span>
            <span className="sm:hidden">Active</span>
            {activeIncidents.length > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeIncidents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="text-xs sm:text-sm">
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Resolved</span>
            <span className="sm:hidden">Resolved</span>
          </TabsTrigger>
        </TabsList>

        {/* Active Incidents */}
        <TabsContent value="active" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-40 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
=======
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
>>>>>>> origin/claude/tech-debt-cleanup
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {activeIncidents.length === 0 ? (
<<<<<<< HEAD
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No active incidents.</p>
              </Card>
            ) : (
              activeIncidents.map((incident) => (
                <Card
                  key={incident.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedIncident(incident);
                    setShowDetailDialog(true);
                  }}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-1">
                          <h3 className="font-semibold text-sm leading-tight flex-1">{incident.title}</h3>
                          <Badge className={severityColors[incident.severity]} className="shrink-0 text-xs">
                            {incident.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{incident.location}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className={levelColors[incident.current_level]} className="text-xs">
                          {incident.current_level === "facility" && <Users className="w-3 h-3 mr-1" />}
                          {incident.current_level === "host" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {incident.current_level === "admin" && <Shield className="w-3 h-3 mr-1" />}
                          {incident.current_level}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={incident.breached ? "border-red-500/50 text-red-400" : "border-amber-500/50 text-amber-400"}
                        >
                          {incident.breached ? "BREACHED" : "SLA OK"}
                        </Badge>
                      </div>
                    </div>

                    <SLAIndicator incident={incident} />

                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <TimeSinceReport timestamp={incident.reported_at} />
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
=======
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
>>>>>>> origin/claude/tech-debt-cleanup
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

<<<<<<< HEAD
        {/* Resolved Incidents */}
        <TabsContent value="resolved" className="space-y-3 mt-4">
          {resolvedIncidents.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No resolved incidents.</p>
            </Card>
          ) : (
            resolvedIncidents.map((incident) => (
              <Card
                key={incident.id}
                className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                onClick={() => {
                  setSelectedIncident(incident);
                  setShowDetailDialog(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm leading-tight">{incident.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{incident.location}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-400">
                        Resolved
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <IncidentDetailDialog incident={selectedIncident} open={showDetailDialog} onOpenChange={setShowDetailDialog} />
=======
        <TabsContent value="resolved">
          <Card className="p-8 text-center"><p className="text-muted-foreground">No resolved incidents</p></Card>
        </TabsContent>
      </Tabs>
>>>>>>> origin/claude/tech-debt-cleanup
    </div>
  );
}
