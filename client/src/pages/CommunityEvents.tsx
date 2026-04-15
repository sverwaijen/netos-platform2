import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Image as ImageIcon, Plus, Clock } from "lucide-react";

type ViewMode = "list" | "calendar";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  capacity: number;
  attendeeCount: number;
  rsvpStatus?: "going" | "interested" | null;
}

interface Member {
  id: string;
  name: string;
  company?: string;
  avatar?: string;
  visibility: "public" | "private";
}

export default function CommunityEvents() {
  const { user, isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showMemberDir, setShowMemberDir] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    location: "",
    description: "",
    capacity: 20,
  });

  // Mock data - in a real app, this would come from tRPC
  const mockEvents: Event[] = [
    {
      id: "1",
      title: "Monthly Team Gathering",
      date: "2026-04-20",
      location: "Amsterdam",
      description: "Monthly networking event for all members",
      capacity: 50,
      attendeeCount: 28,
      rsvpStatus: "going",
    },
    {
      id: "2",
      title: "Tech Talk: AI in Co-working",
      date: "2026-04-25",
      location: "Amsterdam",
      description: "Industry expert discussion on AI applications",
      capacity: 30,
      attendeeCount: 15,
      rsvpStatus: null,
    },
    {
      id: "3",
      title: "Wellness Afternoon",
      date: "2026-05-05",
      location: "Rotterdam",
      description: "Yoga and meditation session",
      capacity: 25,
      attendeeCount: 12,
      rsvpStatus: "interested",
    },
  ];

  const mockMembers: Member[] = [
    {
      id: "1",
      name: "Alice Johnson",
      company: "TechCorp",
      visibility: "public",
      avatar: "AJ",
    },
    {
      id: "2",
      name: "Bob Smith",
      company: "DesignStudio",
      visibility: "public",
      avatar: "BS",
    },
    {
      id: "3",
      name: "Carol Davis",
      company: "StartupXYZ",
      visibility: "private",
      avatar: "CD",
    },
    {
      id: "4",
      name: "David Wilson",
      company: "ConsultingPro",
      visibility: "public",
      avatar: "DW",
    },
  ];

  const locations = ["all", "Amsterdam", "Rotterdam", "Utrecht"];

  const filteredEvents = useMemo(() => {
    if (selectedLocation === "all") return mockEvents;
    return mockEvents.filter((e) => e.location === selectedLocation);
  }, [selectedLocation]);

  const visibleMembers = mockMembers.filter((m) => m.visibility === "public");

  const handleCreateEvent = () => {
    if (!formData.title || !formData.date || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(`Event "${formData.title}" created successfully`);
    setFormData({ title: "", date: "", location: "", description: "", capacity: 20 });
    setShowCreateForm(false);
  };

  const handleRsvp = (eventId: string, status: "going" | "interested") => {
    toast.success(`You've marked yourself as ${status}`);
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Community</div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Events & <strong className="font-semibold">Connections.</strong>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#627653] hover:bg-[#627653]/90 text-white text-xs font-semibold tracking-[1px]"
          >
            <Plus className="w-4 h-4 mr-1" /> Create Event
          </Button>
          <Button
            onClick={() => setShowMemberDir(true)}
            variant="outline"
            className="text-xs font-semibold tracking-[1px]"
          >
            <Users className="w-4 h-4 mr-1" /> Members
          </Button>
        </div>
      </div>

      {/* Location Filter */}
      <div className="flex gap-2 flex-wrap">
        {locations.map((loc) => (
          <button
            key={loc}
            onClick={() => setSelectedLocation(loc)}
            className={`px-3 py-1 text-xs font-semibold tracking-[1px] rounded transition-colors ${
              selectedLocation === loc
                ? "bg-[#627653] text-white"
                : "bg-white/[0.04] text-[#888] hover:bg-white/[0.08]"
            }`}
          >
            {loc === "all" ? "All Locations" : loc}
          </button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 border-b border-white/[0.06]">
        <button
          onClick={() => setViewMode("list")}
          className={`pb-3 px-2 text-xs font-semibold tracking-[1px] uppercase border-b-2 transition-colors ${
            viewMode === "list"
              ? "border-[#627653] text-[#627653]"
              : "border-transparent text-[#888] hover:text-[#999]"
          }`}
        >
          List View
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`pb-3 px-2 text-xs font-semibold tracking-[1px] uppercase border-b-2 transition-colors ${
            viewMode === "calendar"
              ? "border-[#627653] text-[#627653]"
              : "border-transparent text-[#888] hover:text-[#999]"
          }`}
        >
          Calendar View
        </button>
      </div>

      {/* Events Section */}
      <div className="space-y-4">
        <h2 className="text-[13px] font-semibold tracking-[2px] uppercase text-[#888]">
          Upcoming Events ({filteredEvents.length})
        </h2>

        {viewMode === "list" && (
          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="bg-[#111] border-white/[0.06] hover:border-white/[0.12] transition-colors">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm md:text-base font-semibold">{event.title}</h3>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs text-[#888]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {event.attendeeCount}/{event.capacity} attending
                        </div>
                      </div>
                      <p className="text-xs text-[#666] mt-2">{event.description}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        onClick={() => handleRsvp(event.id, "going")}
                        className={`text-xs font-semibold ${
                          event.rsvpStatus === "going"
                            ? "bg-[#627653] text-white"
                            : "bg-white/[0.04] text-[#888] hover:bg-white/[0.08]"
                        }`}
                      >
                        Going
                      </Button>
                      <Button
                        onClick={() => handleRsvp(event.id, "interested")}
                        variant="outline"
                        className={`text-xs font-semibold ${
                          event.rsvpStatus === "interested" ? "border-[#b8a472] text-[#b8a472]" : ""
                        }`}
                      >
                        Interested
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewMode === "calendar" && (
          <Card className="bg-[#111] border-white/[0.06] p-6">
            <div className="text-center py-12 text-[#666]">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Calendar view coming soon</p>
            </div>
          </Card>
        )}
      </div>

      {/* Announcements Section */}
      <div className="space-y-4">
        <h2 className="text-[13px] font-semibold tracking-[2px] uppercase text-[#888]">Host Announcements</h2>
        <Card className="bg-[#111] border-white/[0.06]">
          <CardContent className="p-4 md:p-6">
            <div className="space-y-3">
              <div className="pb-3 border-b border-white/[0.06]">
                <p className="text-xs font-semibold text-[#627653] mb-1">Office Hours Extended</p>
                <p className="text-xs text-[#888]">Our Amsterdam location will be open extended hours on weekends starting next month.</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#b8a472] mb-1">New Amenities Available</p>
                <p className="text-xs text-[#888]">Fresh coffee machine and expanded lunch options now available at Rotterdam location.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Photo Gallery Placeholder */}
      <div className="space-y-4">
        <h2 className="text-[13px] font-semibold tracking-[2px] uppercase text-[#888]">Past Events Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/[0.04] rounded aspect-square flex items-center justify-center border border-white/[0.06]">
              <ImageIcon className="w-6 h-6 text-[#666]" />
            </div>
          ))}
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="bg-[#111] border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-[#627653]">Create New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-2 block">
                Event Title *
              </label>
              <Input
                placeholder="Event name"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white/[0.04] border-white/[0.06]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-2 block">
                Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="bg-white/[0.04] border-white/[0.06]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-2 block">
                Location *
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select location</option>
                {locations.filter((l) => l !== "all").map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-2 block">
                Capacity
              </label>
              <Input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="bg-white/[0.04] border-white/[0.06]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-[1px] uppercase text-[#888] mb-2 block">
                Description
              </label>
              <textarea
                placeholder="Event description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2 text-sm text-foreground resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} className="bg-[#627653] hover:bg-[#627653]/90 text-white">
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Directory Dialog */}
      <Dialog open={showMemberDir} onOpenChange={setShowMemberDir}>
        <DialogContent className="bg-[#111] border-white/[0.06] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#627653]">Member Directory</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {visibleMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded border border-white/[0.06] bg-white/[0.02]"
              >
                <div className="w-10 h-10 rounded-full bg-[#627653]/20 flex items-center justify-center text-xs font-semibold text-[#627653]">
                  {member.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{member.name}</p>
                  {member.company && (
                    <p className="text-xs text-[#888] truncate">{member.company}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
