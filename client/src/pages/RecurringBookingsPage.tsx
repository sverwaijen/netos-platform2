import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trash2, Edit2, Plus, CheckCircle } from "lucide-react";

type RecurrencePattern = "daily" | "weekly" | "monthly" | "custom";

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface ConflictingBooking {
  id: string;
  resourceName: string;
  time: string;
  bookerName: string;
}

interface RecurringBookingSeries {
  id: string;
  resourceId: string;
  resourceName: string;
  location: string;
  floor: string;
  startDate: Date;
  endDate: Date | null;
  occurrences: number | null;
  pattern: RecurrencePattern;
  dayOfWeek?: number[];
  dayOfMonth?: number;
  creditsCostPerOccurrence: number;
  totalCredits: number;
  bookerName: string;
  status: "active" | "paused" | "completed";
  conflictingBookings: ConflictingBooking[];
}

// Demo data
const DEMO_TEAM_MEMBERS: TeamMember[] = [
  { id: "1", name: "John Doe", email: "john@example.com" },
  { id: "2", name: "Jane Smith", email: "jane@example.com" },
  { id: "3", name: "Bob Wilson", email: "bob@example.com" },
  { id: "4", name: "Alice Johnson", email: "alice@example.com" },
];

const DEMO_RECURRING_SERIES: RecurringBookingSeries[] = [
  {
    id: "series-1",
    resourceId: "desk-101",
    resourceName: "Desk 101",
    location: "Amsterdam",
    floor: "1",
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 5, 30),
    occurrences: null,
    pattern: "weekly",
    dayOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
    creditsCostPerOccurrence: 5,
    totalCredits: 60,
    bookerName: "John Doe",
    status: "active",
    conflictingBookings: [],
  },
  {
    id: "series-2",
    resourceId: "room-201",
    resourceName: "Meeting Room B",
    location: "Amsterdam",
    floor: "2",
    startDate: new Date(2026, 3, 1),
    endDate: null,
    occurrences: 10,
    pattern: "daily",
    creditsCostPerOccurrence: 10,
    totalCredits: 100,
    bookerName: "Jane Smith",
    status: "active",
    conflictingBookings: [
      { id: "c1", resourceName: "Meeting Room B", time: "Apr 15, 2pm-3pm", bookerName: "Bob Wilson" },
      { id: "c2", resourceName: "Meeting Room B", time: "Apr 22, 2pm-3pm", bookerName: "Alice Johnson" },
    ],
  },
  {
    id: "series-3",
    resourceId: "parking-01",
    resourceName: "Spot A-01",
    location: "Amsterdam",
    floor: "B1",
    startDate: new Date(2026, 2, 1),
    endDate: new Date(2026, 3, 30),
    occurrences: null,
    pattern: "monthly",
    dayOfMonth: 15,
    creditsCostPerOccurrence: 20,
    totalCredits: 40,
    bookerName: "Bob Wilson",
    status: "completed",
    conflictingBookings: [],
  },
];

export default function RecurringBookingsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedForBulkDelete, setSelectedForBulkDelete] = useState<Set<string>>(new Set());

  // Form state for create/edit
  const [formData, setFormData] = useState({
    resourceName: "",
    location: "",
    pattern: "weekly" as RecurrencePattern,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    occurrences: "",
    bookedFor: DEMO_TEAM_MEMBERS[0].id,
    daysOfWeek: new Set([1, 3, 5]),
    dayOfMonth: "15",
  });

  const [series, setSeries] = useState(DEMO_RECURRING_SERIES);

  const activeSeries = useMemo(() => series.filter((s) => s.status === "active"), [series]);
  const totalActiveCredits = useMemo(
    () => activeSeries.reduce((sum, s) => sum + s.creditsCostPerOccurrence, 0),
    [activeSeries]
  );

  const handleCreateBooking = () => {
    // Implementation would create a new series
    setShowCreateModal(false);
    // Reset form
    setFormData({
      resourceName: "",
      location: "",
      pattern: "weekly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      occurrences: "",
      bookedFor: DEMO_TEAM_MEMBERS[0].id,
      daysOfWeek: new Set([1, 3, 5]),
      dayOfMonth: "15",
    });
  };

  const handleEditSeries = (id: string) => {
    setEditingId(id);
    setShowEditModal(true);
  };

  const handleDeleteSeries = (id: string) => {
    setSeries((prev) => prev.filter((s) => s.id !== id));
  };

  const handleBulkDelete = () => {
    setSeries((prev) => prev.filter((s) => !selectedForBulkDelete.has(s.id)));
    setSelectedForBulkDelete(new Set());
  };

  const toggleSeriesSelection = (id: string) => {
    const newSelected = new Set(selectedForBulkDelete);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedForBulkDelete(newSelected);
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">
            RECURRING BOOKINGS
          </div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Recurring <strong className="font-semibold">bookings.</strong>
          </h1>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#627653] hover:bg-[#4a5a3f] text-white text-[10px] font-semibold tracking-[3px] uppercase"
        >
          <Plus className="w-3.5 h-3.5 mr-2" />
          New Series
        </Button>
      </div>

      {/* Credit Summary */}
      <Card className="p-6 border-border/40 bg-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-[10px] font-semibold tracking-[2px] uppercase text-muted-foreground mb-2">
              Active Series
            </div>
            <div className="text-3xl font-extralight">{activeSeries.length}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-[2px] uppercase text-muted-foreground mb-2">
              Credits per Cycle
            </div>
            <div className="text-3xl font-extralight text-[#627653]">{totalActiveCredits}c</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold tracking-[2px] uppercase text-muted-foreground mb-2">
              Total Series
            </div>
            <div className="text-3xl font-extralight">{series.length}</div>
          </div>
        </div>
      </Card>

      {/* Bulk actions */}
      {selectedForBulkDelete.size > 0 && (
        <div className="flex items-center justify-between bg-accent/50 p-4 rounded-lg border border-border/40">
          <span className="text-sm font-medium">{selectedForBulkDelete.size} series selected</span>
          <Button
            onClick={handleBulkDelete}
            variant="destructive"
            size="sm"
            className="text-[10px] font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" />
            Cancel Series
          </Button>
        </div>
      )}

      {/* Active Series */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Active Series</h2>
        <div className="space-y-3">
          {activeSeries.map((s) => (
            <Card key={s.id} className="p-4 border-border/40 hover:bg-accent/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Checkbox
                    checked={selectedForBulkDelete.has(s.id)}
                    onCheckedChange={() => toggleSeriesSelection(s.id)}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{s.resourceName}</h3>
                      <span className="text-[10px] font-semibold tracking-[1px] uppercase px-2 py-1 rounded bg-primary/20 text-primary">
                        {s.pattern}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Location:</span> {s.location} / Floor {s.floor}
                      </div>
                      <div>
                        <span className="font-medium">Booked for:</span> {s.bookerName}
                      </div>
                      <div>
                        <span className="font-medium">Starts:</span> {s.startDate.toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">
                          {s.endDate ? "Ends:" : "Occurrences:"}
                        </span>{" "}
                        {s.endDate ? s.endDate.toLocaleDateString() : s.occurrences}
                      </div>
                    </div>

                    {/* Recurrence details */}
                    <div className="text-xs text-muted-foreground mb-3">
                      <span className="font-medium">Recurrence:</span>{" "}
                      {s.pattern === "weekly"
                        ? `Every ${s.dayOfWeek?.map((d) => dayNames[d]).join(", ") || ""}`
                        : s.pattern === "monthly"
                          ? `On day ${s.dayOfMonth} of each month`
                          : "Every day"}
                    </div>

                    {/* Conflict warning */}
                    {s.conflictingBookings.length > 0 && (
                      <Alert className="border-red-500/50 bg-red-500/5 mb-3">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-xs text-red-600">
                          {s.conflictingBookings.length} conflicts detected
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Credit summary */}
                    <div className="text-xs bg-background/50 p-2 rounded border border-border/40">
                      <span className="font-medium">{s.creditsCostPerOccurrence}c per occurrence</span> ×{" "}
                      {s.occurrences || Math.ceil((s.endDate!.getTime() - s.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))}{" "}
                      = <span className="text-[#627653] font-semibold">{s.totalCredits}c total</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={() => handleEditSeries(s.id)}
                    variant="outline"
                    size="sm"
                    className="text-[10px]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteSeries(s.id)}
                    variant="destructive"
                    size="sm"
                    className="text-[10px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Completed Series */}
      {series.some((s) => s.status === "completed") && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Completed Series</h2>
          <div className="space-y-3">
            {series
              .filter((s) => s.status === "completed")
              .map((s) => (
                <Card key={s.id} className="p-4 border-border/40 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{s.resourceName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.startDate.toLocaleDateString()} -{" "}
                        {s.endDate?.toLocaleDateString()}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Recurring Booking</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Team member selector */}
            <div>
              <label className="text-sm font-semibold block mb-2">Booked for</label>
              <Select
                value={formData.bookedFor}
                onValueChange={(value) => setFormData({ ...formData, bookedFor: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_TEAM_MEMBERS.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Team Admins can book resources for team members
              </p>
            </div>

            {/* Resource selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Resource</label>
                <input
                  type="text"
                  placeholder="Desk 101, Meeting Room B, Spot A-01"
                  value={formData.resourceName}
                  onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Amsterdam"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                />
              </div>
            </div>

            {/* Recurrence pattern */}
            <div>
              <label className="text-sm font-semibold block mb-2">Recurrence Pattern</label>
              <Select
                value={formData.pattern}
                onValueChange={(value) =>
                  setFormData({ ...formData, pattern: value as RecurrencePattern })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weekly days selector */}
            {formData.pattern === "weekly" && (
              <div>
                <label className="text-sm font-semibold block mb-2">Days of Week</label>
                <div className="grid grid-cols-7 gap-2">
                  {dayNames.map((day, i) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.daysOfWeek.has(i)}
                        onCheckedChange={(checked) => {
                          const newDays = new Set(formData.daysOfWeek);
                          if (checked) {
                            newDays.add(i);
                          } else {
                            newDays.delete(i);
                          }
                          setFormData({ ...formData, daysOfWeek: newDays });
                        }}
                      />
                      <span className="text-xs">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">
                  {formData.endDate ? "End Date" : "Or # of Occurrences"}
                </label>
                {!formData.endDate ? (
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.occurrences}
                    onChange={(e) => setFormData({ ...formData, occurrences: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  />
                ) : (
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  />
                )}
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Conflicts will be detected and displayed before creation
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBooking}
              className="bg-[#627653] hover:bg-[#4a5a3f] text-white"
            >
              Create Series
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Recurring Booking</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Edit modal placeholder - Implementation would mirror create modal
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button className="bg-[#627653] hover:bg-[#4a5a3f] text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
