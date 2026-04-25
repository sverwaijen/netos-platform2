import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Hammer, DollarSign, AlertCircle, Clock, CheckCircle } from "lucide-react";

const mockTickets = [
  { id: "1", title: "HVAC filter replacement", category: "HVAC", urgency: "High", status: "Open", cost: 150 },
  { id: "2", title: "Bathroom tap", category: "Sanitair", urgency: "Critical", status: "In Progress", cost: 80 },
];

const statusColors: Record<string, string> = {
  Open: "bg-red-500/10 text-red-400",
  "In Progress": "bg-blue-500/10 text-blue-400",
  Resolved: "bg-green-500/10 text-green-400",
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

export default function MaintenanceDashboard() {
  const [activeTab, setActiveTab] = useState("list");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-light">Maintenance</h1>
          <p className="text-muted-foreground text-sm mt-1">Ticket tracking, Kanban board & cost management</p>
        </div>
        <Button size="sm" className="bg-[#627653]"><Plus className="w-4 h-4 mr-2" />New Ticket</Button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard icon={AlertCircle} label="Open" value="1" color="text-red-500" bg="bg-red-500/10" />
        <StatCard icon={Clock} label="In Progress" value="1" color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard icon={CheckCircle} label="Resolved" value="0" color="text-green-500" bg="bg-green-500/10" />
        <StatCard icon={DollarSign} label="Total Cost" value="$230" color="text-amber-500" bg="bg-amber-500/10" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kanban"><Hammer className="w-4 h-4 mr-2" />Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3">
          {mockTickets.map(ticket => (
            <Card key={ticket.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-semibold text-sm">{ticket.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{ticket.category}</p></div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="w-3 h-3" /><span>${ticket.cost}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="kanban"><div className="text-center py-8"><p className="text-muted-foreground">Kanban view</p></div></TabsContent>
      </Tabs>
    </div>
  );
}
