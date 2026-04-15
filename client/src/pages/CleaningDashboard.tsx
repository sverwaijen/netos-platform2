import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Zap,
  Camera,
  AlertTriangle,
  Plus,
  Scan,
  Clock,
  TrendingUp,
  AlertCircle,
  MapPin,
  Flag,
} from "lucide-react";

type ChecklistItem = {
  id: string;
  label: string;
  completed: boolean;
};

type CleaningRound = {
  id: string;
  location: string;
  floor: string;
  status: "not_started" | "in_progress" | "completed";
  startedAt?: string;
  completedAt?: string;
  checklistItems: ChecklistItem[];
  photoVerifications: string[];
  incidentReports: IncidentReport[];
};

type IncidentReport = {
  id: string;
  description: string;
  priority: "low" | "medium" | "high";
  createdAt: string;
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  high: "bg-red-500/10 text-red-400 border-red-500/20",
};

const priorityIcons: Record<string, React.ReactNode> = {
  low: <Flag className="w-3 h-3" />,
  medium: <AlertTriangle className="w-3 h-3" />,
  high: <AlertCircle className="w-3 h-3" />,
};

export default function CleaningDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("checklist");
  const [rounds, setRounds] = useState<CleaningRound[]>([
    {
      id: "1",
      location: "Main Floor",
      floor: "Ground",
      status: "not_started",
      checklistItems: [
        { id: "1a", label: "Sweep & mop entrance", completed: false },
        { id: "1b", label: "Empty trash bins", completed: false },
        { id: "1c", label: "Clean mirrors & windows", completed: false },
        { id: "1d", label: "Sanitize surfaces", completed: false },
        { id: "1e", label: "Restock supplies", completed: false },
      ],
      photoVerifications: [],
      incidentReports: [],
    },
    {
      id: "2",
      location: "Meeting Rooms",
      floor: "1st",
      status: "in_progress",
      startedAt: "2026-04-14T08:30:00",
      checklistItems: [
        { id: "2a", label: "Vacuum carpets", completed: true },
        { id: "2b", label: "Clean whiteboards", completed: true },
        { id: "2c", label: "Dust furniture", completed: false },
        { id: "2d", label: "Check AV equipment", completed: false },
      ],
      photoVerifications: [],
      incidentReports: [],
    },
  ]);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [incidentForm, setIncidentForm] = useState<{ description: string; priority: string }>({
    description: "",
    priority: "medium",
  });
  const [showIncidentDialog, setShowIncidentDialog] = useState(false);

  const currentRound = selectedRound ? rounds.find((r) => r.id === selectedRound) : null;

  const progressPercentage = useMemo(() => {
    if (!rounds.length) return 0;
    const allItems = rounds.flatMap((r) => r.checklistItems);
    const completedItems = allItems.filter((i) => i.completed).length;
    return Math.round((completedItems / allItems.length) * 100);
  }, [rounds]);

  const handleToggleChecklistItem = (roundId: string, itemId: string) => {
    setRounds((prev) =>
      prev.map((round) =>
        round.id === roundId
          ? {
              ...round,
              checklistItems: round.checklistItems.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : round
      )
    );
  };

  const handleStartRound = (roundId: string) => {
    setRounds((prev) =>
      prev.map((r) =>
        r.id === roundId
          ? { ...r, status: "in_progress", startedAt: new Date().toISOString() }
          : r
      )
    );
    setSelectedRound(roundId);
    toast.success("Round started");
  };

  const handleCompleteRound = (roundId: string) => {
    setRounds((prev) =>
      prev.map((r) =>
        r.id === roundId
          ? { ...r, status: "completed", completedAt: new Date().toISOString() }
          : r
      )
    );
    setSelectedRound(null);
    toast.success("Round completed");
  };

  const handleAddIncident = () => {
    if (!currentRound || !incidentForm.description.trim()) {
      toast.error("Please describe the incident");
      return;
    }

    const newIncident: IncidentReport = {
      id: `incident-${Date.now()}`,
      description: incidentForm.description,
      priority: incidentForm.priority as "low" | "medium" | "high",
      createdAt: new Date().toISOString(),
    };

    setRounds((prev) =>
      prev.map((r) =>
        r.id === currentRound.id
          ? { ...r, incidentReports: [...r.incidentReports, newIncident] }
          : r
      )
    );

    setIncidentForm({ description: "", priority: "medium" });
    setShowIncidentDialog(false);
    toast.success("Incident reported");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-light tracking-tight">Cleaning Management</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-1">
            Daily checklists, room inspections & incident reports
          </p>
        </div>
        <Button size="sm" variant="outline">
          <Scan className="w-4 h-4 mr-2" />
          QR Scan
        </Button>
      </div>

      {/* Overall Progress */}
      <Card className="border-0 shadow-sm bg-[#1a1a1a]">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{progressPercentage}% Complete</span>
              <span className="text-xs font-semibold text-[#627653]">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-[#222] rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-[#627653] rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex gap-2 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {rounds.reduce((acc, r) => acc + r.checklistItems.filter((i) => i.completed).length, 0)} Completed
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                {rounds.filter((r) => r.status === "in_progress").length} In Progress
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="checklist" className="flex-1 sm:flex-none text-xs sm:text-sm">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="status" className="flex-1 sm:flex-none text-xs sm:text-sm">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            Status
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex-1 sm:flex-none text-xs sm:text-sm">
            <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            Incidents
          </TabsTrigger>
        </TabsList>

        {/* Checklists Tab */}
        <TabsContent value="checklist">
          {selectedRound && currentRound ? (
            <div className="space-y-4">
              {/* Back button */}
              <Button variant="ghost" size="sm" onClick={() => setSelectedRound(null)}>
                ← Back to rounds
              </Button>

              {/* Round Header */}
              <Card className="border-0 shadow-sm bg-[#1a1a1a]">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{currentRound.location}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Floor: {currentRound.floor}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${
                        currentRound.status === "completed"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : currentRound.status === "in_progress"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {currentRound.status.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Checklist Items */}
              <Card className="border-0 shadow-sm bg-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="text-sm">Daily Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentRound.checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#111] border border-[#333] hover:border-[#444] transition-colors cursor-pointer"
                      onClick={() => handleToggleChecklistItem(currentRound.id, item.id)}
                    >
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleChecklistItem(currentRound.id, item.id)}
                        className="h-4 w-4"
                      />
                      <span
                        className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}
                      >
                        {item.label}
                      </span>
                      {item.completed && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Photo Verification */}
              <Card className="border-0 shadow-sm bg-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="text-sm">Photo Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Photo
                  </Button>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {currentRound.status === "not_started" && (
                  <Button
                    onClick={() => handleStartRound(currentRound.id)}
                    className="flex-1 bg-[#627653] hover:bg-[#627653]/90"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Start Round
                  </Button>
                )}
                {currentRound.status === "in_progress" && (
                  <Button
                    onClick={() => handleCompleteRound(currentRound.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Round
                  </Button>
                )}
                <Dialog open={showIncidentDialog} onOpenChange={setShowIncidentDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Report Incident
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report Incident</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold block mb-2">Description</label>
                        <Textarea
                          placeholder="Describe the incident..."
                          value={incidentForm.description}
                          onChange={(e) =>
                            setIncidentForm((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className="resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-2">Priority</label>
                        <Select
                          value={incidentForm.priority}
                          onValueChange={(value) =>
                            setIncidentForm((prev) => ({ ...prev, priority: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddIncident} className="w-full bg-[#627653] hover:bg-[#627653]/90">
                        Report Incident
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {rounds.map((round) => (
                <Card
                  key={round.id}
                  className="border-0 shadow-sm bg-[#1a1a1a] cursor-pointer hover:bg-[#222] transition-colors"
                  onClick={() => setSelectedRound(round.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#627653]" />
                          <CardTitle className="text-base">{round.location}</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Floor: {round.floor}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${
                          round.status === "completed"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : round.status === "in_progress"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        {round.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {round.checklistItems.filter((i) => i.completed).length}/{round.checklistItems.length}{" "}
                          tasks
                        </span>
                        <span className="font-semibold text-[#627653]">
                          {Math.round(
                            (round.checklistItems.filter((i) => i.completed).length /
                              round.checklistItems.length) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-[#627653] rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(
                              (round.checklistItems.filter((i) => i.completed).length /
                                round.checklistItems.length) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Status Tab */}
        <TabsContent value="status">
          <Card className="border-0 shadow-sm bg-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-sm">Real-time Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rounds.map((round) => (
                <div key={round.id} className="p-3 rounded-lg bg-[#111] border border-[#333]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          round.status === "completed"
                            ? "bg-green-500"
                            : round.status === "in_progress"
                              ? "bg-blue-500"
                              : "bg-slate-500"
                        }`}
                      />
                      <span className="font-semibold text-sm">{round.location}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {round.status === "in_progress" && round.startedAt
                        ? `Started ${new Date(round.startedAt).toLocaleTimeString()}`
                        : "Not started"}
                    </span>
                  </div>
                  <div className="w-full bg-[#222] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-[#627653] rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          (round.checklistItems.filter((i) => i.completed).length /
                            round.checklistItems.length) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents">
          <div className="space-y-3">
            {rounds
              .filter((r) => r.incidentReports.length > 0)
              .map((round) => (
                <div key={round.id} className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground px-1">{round.location}</h3>
                  {round.incidentReports.map((incident) => (
                    <Card
                      key={incident.id}
                      className={`border-0 shadow-sm ${priorityColors[incident.priority]}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            {priorityIcons[incident.priority]}
                            <p className="text-sm">{incident.description}</p>
                          </div>
                          <Badge variant="outline" className="flex-shrink-0">
                            {incident.priority}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-muted-foreground">
                          {new Date(incident.createdAt).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            {rounds.every((r) => r.incidentReports.length === 0) && (
              <div className="text-center py-12">
                <CheckCircle2 className="w-8 h-8 text-[#627653] mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No incidents reported</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
