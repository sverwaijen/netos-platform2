import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, Hammer, Clock, CheckCircle, AlertCircle, DollarSign } from "lucide-react";

interface MaintenanceTicket {
  id: string;
  title: string;
  category: "HVAC" | "Elektra" | "Sanitair" | "Meubilair" | "IT";
  urgency: "Critical" | "High" | "Normal" | "Low";
  status: "Open" | "In Progress" | "Waiting" | "Resolved";
  created_at: string;
  cost?: number;
  location: string;
}

const mockTickets: MaintenanceTicket[] = [
  { id: "1", title: "HVAC filter replacement", category: "HVAC", urgency: "High", status: "Open", created_at: "2024-04-14T08:30:00", cost: 150, location: "Floor 2" },
  { id: "2", title: "Broken bathroom tap", category: "Sanitair", urgency: "Critical", status: "In Progress", created_at: "2024-04-14T07:15:00", cost: 80, location: "Bathrooms" },
  { id: "3", title: "Electrical outlet repair", category: "Elektra", urgency: "High", status: "Waiting", created_at: "2024-04-13T14:00:00", cost: 200, location: "Meeting Room A" },
];

const statusColors: Record<string, string> = {
  Open: "bg-red-500/10 text-red-400",
  "In Progress": "bg-blue-500/10 text-blue-400",
  Waiting: "bg-amber-500/10 text-amber-400",
  Resolved: "bg-green-500/10 text-green-400",
};

const urgencyColors: Record<string, string> = {
  Critical: "bg-red-600/20 text-red-400",
  High: "bg-orange-600/20 text-orange-400",
  Normal: "bg-blue-600/20 text-blue-400",
  Low: "bg-slate-600/20 text-slate-400",
};

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

export default function MaintenanceDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("list");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const totalCost = mockTickets.reduce((sum, t) => sum + (t.cost || 0), 0);
  const openTickets = mockTickets.filter((t) => t.status === "Open").length;
  const inProgressTickets = mockTickets.filter((t) => t.status === "In Progress").length;
  const resolvedTickets = mockTickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">Ticket tracking, Kanban board & cost management</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#627653] hover:bg-[#627653]/90">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Maintenance Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase block mb-1">Title</label>
                <Input placeholder="e.g., HVAC filter replacement" className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase block mb-1">Category</label>
                <Select>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select..." />
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="flex-1">Cancel</Button>
                <Button onClick={() => { toast.success("Ticket created"); setShowCreateDialog(false); }} className="flex-1 bg-[#627653]">Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <StatCard icon={AlertCircle} label="Open" value={openTickets} color="text-red-500" bg="bg-red-500/10" />
        <StatCard icon={Clock} label="In Progress" value={inProgressTickets} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard icon={CheckCircle} label="Resolved" value={resolvedTickets} color="text-green-500" bg="bg-green-500/10" />
        <StatCard icon={DollarSign} label="Total Cost" value={`$${totalCost}`} color="text-amber-500" bg="bg-amber-500/10" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger value="kanban" className="text-xs sm:text-sm"><Hammer className="w-3.5 h-3.5 mr-1" />Board</TabsTrigger>
          <TabsTrigger value="list" className="text-xs sm:text-sm"><Search className="w-3.5 h-3.5 mr-1" />List</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3 mt-4">
          {mockTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-2">
                      <h3 className="font-semibold text-sm flex-1">{ticket.title}</h3>
                      <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{ticket.location}</span>
                      <span>•</span>
                      <span>{ticket.category}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-right shrink-0">
                    <Badge variant="outline" className={`text-xs ${urgencyColors[ticket.urgency]}`}>
                      {ticket.urgency}
                    </Badge>
                    {ticket.cost !== undefined && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        <span>${ticket.cost}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Kanban board view</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
