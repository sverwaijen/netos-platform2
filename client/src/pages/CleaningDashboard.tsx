import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, QrCode, AlertTriangle, CheckCircle, Clock, MapPin, Zap,
  Search, Filter, ChevronRight, AlertCircle,
} from "lucide-react";

const priorityColors: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-400",
  normal: "bg-blue-500/10 text-blue-400",
  high: "bg-amber-500/10 text-amber-400",
  critical: "bg-red-500/10 text-red-400",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400",
  in_progress: "bg-blue-500/10 text-blue-400",
  completed: "bg-green-500/10 text-green-400",
};

interface ChecklistItem {
  id: number;
  location: string;
  floor: number;
  description: string;
  completed: boolean;
  dueTime?: string;
}

interface IncidentReport {
  id: number;
  location: string;
  description: string;
  priority: "low" | "normal" | "high" | "critical";
  reported_at: string;
}

const mockChecklist: ChecklistItem[] = [
  { id: 1, location: "Reception", floor: 0, description: "Vacuum lobby area", completed: true, dueTime: "09:00" },
  { id: 2, location: "Meeting Room A", floor: 1, description: "Clean desks and surfaces", completed: false, dueTime: "10:00" },
  { id: 3, location: "Kitchen", floor: 0, description: "Empty trash and sanitize", completed: true, dueTime: "09:30" },
  { id: 4, location: "Hallway 2", floor: 2, description: "Mop floors", completed: false, dueTime: "14:00" },
  { id: 5, location: "Bathrooms", floor: 1, description: "Restock and clean", completed: false, dueTime: "11:00" },
];

const mockIncidents: IncidentReport[] = [
  {
    id: 1,
    location: "Meeting Room C",
    description: "Spillage on carpet - needs immediate attention",
    priority: "critical",
    reported_at: "2024-04-14T10:30:00",
  },
];

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#627653] to-[#b8a472]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: any) {
  return (
    <Card className="p-3 md:p-4">
      <div className="flex items-start justify-between">
        <div className={`${bg} w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center`}>
          <Icon className={`${color} w-4 h-4 md:w-5 md:h-5`} />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-lg md:text-2xl font-semibold leading-none mt-1">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function IncidentReportDialog({ onClose }: { onClose: () => void }) {
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");

  const handleSubmit = () => {
    if (!location.trim() || !description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success("Incident reported successfully");
    setLocation("");
    setDescription("");
    setPriority("normal");
    onClose();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Report Incident</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Location</label>
          <Input placeholder="e.g., Meeting Room A" value={location} onChange={(e) => setLocation(e.target.value)} className="text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Description</label>
          <Textarea placeholder="Describe the issue..." value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-24 resize-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSubmit} className="flex-1 bg-[#627653] hover:bg-[#627653]/90">Report</Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default function CleaningDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("checklist");
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);

  const locationGroups = mockChecklist.reduce((acc, item) => {
    if (!acc[item.location]) acc[item.location] = [];
    acc[item.location].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Cleaning Dashboard</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Daily checklist, progress tracking & incident reports</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline"><QrCode className="w-4 h-4 mr-2" />Scan QR</Button>
          <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-red-600/20 text-red-400 hover:bg-red-600/30">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Incident
              </Button>
            </DialogTrigger>
            <IncidentReportDialog onClose={() => setShowIncidentDialog(false)} />
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard icon={CheckCircle} label="Completed" value={mockChecklist.filter((i) => i.completed).length} color="text-green-500" bg="bg-green-500/10" />
        <StatCard icon={Clock} label="In Progress" value={mockChecklist.filter((i) => !i.completed).length} color="text-amber-500" bg="bg-amber-500/10" />
        <StatCard icon={AlertTriangle} label="Incidents" value={mockIncidents.length} color="text-red-500" bg="bg-red-500/10" />
        <StatCard icon={MapPin} label="Locations" value={Object.keys(locationGroups).length} color="text-blue-500" bg="bg-blue-500/10" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-3">
          <TabsTrigger value="checklist" className="text-xs sm:text-sm"><Zap className="w-3.5 h-3.5 mr-1" />Tasks</TabsTrigger>
          <TabsTrigger value="floors" className="text-xs sm:text-sm"><MapPin className="w-3.5 h-3.5 mr-1" />Floors</TabsTrigger>
          <TabsTrigger value="incidents" className="text-xs sm:text-sm"><AlertCircle className="w-3.5 h-3.5 mr-1" />Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(locationGroups).map(([location, items]) => {
              const completed = items.filter((i) => i.completed).length;
              return (
                <Card key={location} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{location}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{completed}/{items.length} items</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{Math.round((completed/items.length)*100)}%</Badge>
                    </div>
                    <ProgressBar completed={completed} total={items.length} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="floors">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Floor progress tracking</p>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-3">
          {mockIncidents.length === 0 ? (
            <Card className="p-8 text-center"><p className="text-muted-foreground">No incidents</p></Card>
          ) : (
            mockIncidents.map((incident) => (
              <Card key={incident.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><h3 className="font-semibold text-sm">{incident.location}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{incident.description}</p></div>
                    <Badge className={priorityColors[incident.priority]}>{incident.priority}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
