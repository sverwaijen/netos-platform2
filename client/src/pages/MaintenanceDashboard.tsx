import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Calendar, Clock, Wrench, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";

type MaintenanceTicket = {
  id: string;
  title: string;
  category: "HVAC" | "Elektra" | "Sanitair" | "Meubilair" | "IT";
  urgency: "Critical" | "High" | "Normal" | "Low";
  status: "Open" | "In Progress" | "Waiting" | "Resolved";
  assignedTo?: string;
  cost?: number;
  createdAt: string;
};

const categoryColors: Record<string, string> = {
  HVAC: "bg-blue-500/10 text-blue-400",
  Elektra: "bg-yellow-500/10 text-yellow-400",
  Sanitair: "bg-cyan-500/10 text-cyan-400",
  Meubilair: "bg-purple-500/10 text-purple-400",
  IT: "bg-green-500/10 text-green-400",
};

const urgencyColors: Record<string, string> = {
  Critical: "bg-red-500/10 text-red-400",
  High: "bg-orange-500/10 text-orange-400",
  Normal: "bg-blue-500/10 text-blue-400",
  Low: "bg-slate-500/10 text-slate-400",
};

export default function MaintenanceDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("board");
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([
    {
      id: "T001",
      title: "AC not cooling properly",
      category: "HVAC",
      urgency: "High",
      status: "Open",
      createdAt: "2026-04-14T09:00:00",
    },
    {
      id: "T002",
      title: "Circuit breaker tripped",
      category: "Elektra",
      urgency: "Critical",
      status: "In Progress",
      assignedTo: "John Doe",
      createdAt: "2026-04-14T10:00:00",
    },
  ]);

  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    category: "HVAC" as const,
    urgency: "Normal" as const,
  });

  const handleCreateTicket = () => {
    if (!newTicket.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const ticket: MaintenanceTicket = {
      id: `T${(Math.max(...tickets.map((t) => parseInt(t.id.substring(1))), 0) + 1).toString().padStart(3, "0")}`,
      title: newTicket.title,
      category: newTicket.category,
      urgency: newTicket.urgency,
      status: "Open",
      createdAt: new Date().toISOString(),
    };

    setTickets([...tickets, ticket]);
    setNewTicket({ title: "", category: "HVAC", urgency: "Normal" });
    setShowNewTicket(false);
    toast.success("Ticket created");
  };

  const statusGroups = {
    Open: tickets.filter((t) => t.status === "Open"),
    "In Progress": tickets.filter((t) => t.status === "In Progress"),
    Waiting: tickets.filter((t) => t.status === "Waiting"),
    Resolved: tickets.filter((t) => t.status === "Resolved"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Maintenance Tickets</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Track repairs, maintenance, and preventive care</p>
        </div>
        <Dialog open={showNewTicket} onOpenChange={setShowNewTicket}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#627653]">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Maintenance Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-2">Title</label>
                <Input
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  placeholder="Describe the issue"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-2">Category</label>
                <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Elektra">Elektra</SelectItem>
                    <SelectItem value="Sanitair">Sanitair</SelectItem>
                    <SelectItem value="Meubilair">Meubilair</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-2">Urgency</label>
                <Select value={newTicket.urgency} onValueChange={(value) => setNewTicket({ ...newTicket, urgency: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical (2h SLA)</SelectItem>
                    <SelectItem value="High">High (8h SLA)</SelectItem>
                    <SelectItem value="Normal">Normal (24h SLA)</SelectItem>
                    <SelectItem value="Low">Low (72h SLA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTicket} className="w-full bg-[#627653]">
                Create Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="board" className="flex-1 sm:flex-none">
            <Wrench className="w-4 h-4 mr-1" />
            Kanban Board
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1 sm:flex-none">
            <Calendar className="w-4 h-4 mr-1" />
            Preventive
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 sm:flex-none">
            <DollarSign className="w-4 h-4 mr-1" />
            Cost Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(statusGroups).map(([status, statusTickets]) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2">
                  <h3 className="font-semibold text-sm">{status}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {statusTickets.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {statusTickets.map((ticket) => (
                    <Card key={ticket.id} className="border-0 shadow-sm bg-[#1a1a1a] cursor-pointer hover:bg-[#222]">
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start gap-2 mb-2">
                          <Badge className={categoryColors[ticket.category]} variant="outline">
                            {ticket.category}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold mb-2">{ticket.title}</p>
                        <Badge className={urgencyColors[ticket.urgency]} variant="outline">
                          {ticket.urgency}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card className="border-0 shadow-sm bg-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-sm">Preventive Maintenance Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-[#111] border border-[#333]">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-sm">HVAC Filter Change</span>
                    <Badge className="bg-blue-500/10 text-blue-400" variant="outline">Every 3 months</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Next: April 20, 2026</p>
                </div>
                <div className="p-3 rounded-lg bg-[#111] border border-[#333]">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-sm">Electrical Inspection</span>
                    <Badge className="bg-yellow-500/10 text-yellow-400" variant="outline">Every 6 months</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Next: May 1, 2026</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-0 shadow-sm bg-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-sm">Cost Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets.filter((t) => t.cost).map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-2 rounded-lg bg-[#111]">
                  <span className="text-sm">{ticket.title}</span>
                  <span className="font-semibold text-[#b8a472]">${ticket.cost}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
