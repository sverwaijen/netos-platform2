import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react";

type ViewType = "day" | "week" | "month";
type ResourceType = "desk" | "meeting_room" | "parking";

interface BookingData {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  location: string;
  floor: string;
  startTime: Date;
  endTime: Date;
  bookerName: string;
  bookerEmail: string;
}

// Demo data
const DEMO_BOOKINGS: BookingData[] = [
  {
    id: "1",
    resourceId: "desk-101",
    resourceName: "Desk 101",
    resourceType: "desk",
    location: "Amsterdam",
    floor: "1",
    startTime: new Date(2026, 3, 14, 9, 0),
    endTime: new Date(2026, 3, 14, 11, 0),
    bookerName: "John Doe",
    bookerEmail: "john@example.com",
  },
  {
    id: "2",
    resourceId: "room-201",
    resourceName: "Meeting Room B",
    resourceType: "meeting_room",
    location: "Amsterdam",
    floor: "2",
    startTime: new Date(2026, 3, 14, 10, 0),
    endTime: new Date(2026, 3, 14, 12, 0),
    bookerName: "Jane Smith",
    bookerEmail: "jane@example.com",
  },
  {
    id: "3",
    resourceId: "parking-01",
    resourceName: "Spot A-01",
    resourceType: "parking",
    location: "Amsterdam",
    floor: "B1",
    startTime: new Date(2026, 3, 14, 8, 0),
    endTime: new Date(2026, 3, 14, 17, 0),
    bookerName: "Bob Wilson",
    bookerEmail: "bob@example.com",
  },
  {
    id: "4",
    resourceId: "desk-102",
    resourceName: "Desk 102",
    resourceType: "desk",
    location: "Amsterdam",
    floor: "1",
    startTime: new Date(2026, 3, 15, 14, 0),
    endTime: new Date(2026, 3, 15, 16, 0),
    bookerName: "Alice Johnson",
    bookerEmail: "alice@example.com",
  },
  {
    id: "5",
    resourceId: "room-301",
    resourceName: "Meeting Room A",
    resourceType: "meeting_room",
    location: "Amsterdam",
    floor: "3",
    startTime: new Date(2026, 3, 16, 13, 0),
    endTime: new Date(2026, 3, 16, 14, 0),
    bookerName: "Charlie Brown",
    bookerEmail: "charlie@example.com",
  },
];

const RESOURCE_COLORS: Record<ResourceType, { bg: string; border: string; text: string }> = {
  desk: { bg: "bg-[#627653]/10", border: "border-[#627653]", text: "text-[#627653]" },
  meeting_room: { bg: "bg-[#4a7c8a]/10", border: "border-[#4a7c8a]", text: "text-[#4a7c8a]" },
  parking: { bg: "bg-[#b8a472]/10", border: "border-[#b8a472]", text: "text-[#b8a472]" },
};

export default function BookingCalendar() {
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 14));
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [selectedResourceTypes, setSelectedResourceTypes] = useState<Set<ResourceType>>(
    new Set(["desk", "meeting_room", "parking"] as ResourceType[])
  );
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Get unique locations and floors from demo data
  const locations = useMemo(() => {
    const locs = new Set(DEMO_BOOKINGS.map((b) => b.location));
    return Array.from(locs);
  }, []);

  const floors = useMemo(() => {
    const flrs = new Set(
      DEMO_BOOKINGS.filter((b) => selectedLocation === "all" || b.location === selectedLocation).map(
        (b) => b.floor
      )
    );
    return Array.from(flrs).sort();
  }, [selectedLocation]);

  // Filter bookings based on selected filters
  const filteredBookings = useMemo(() => {
    return DEMO_BOOKINGS.filter((booking) => {
      if (selectedLocation !== "all" && booking.location !== selectedLocation) return false;
      if (selectedFloor !== "all" && booking.floor !== selectedFloor) return false;
      if (!selectedResourceTypes.has(booking.resourceType)) return false;
      return true;
    });
  }, [selectedLocation, selectedFloor, selectedResourceTypes]);

  const toggleResourceType = (type: ResourceType) => {
    const newTypes = new Set(selectedResourceTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedResourceTypes(newTypes);
  };

  const handlePrevious = () => {
    setCurrentDate((d) => {
      if (view === "day") return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
      if (view === "week")
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
      return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    });
  };

  const handleNext = () => {
    setCurrentDate((d) => {
      if (view === "day") return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      if (view === "week")
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
      return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    });
  };

  const handleCreateBooking = (date: Date, hour?: number) => {
    const startTime = new Date(date);
    if (hour !== undefined) startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    setSelectedSlot({ startTime, endTime });
    setShowBookingModal(true);
  };

  const formatTime = (date: Date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (date: Date) => date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks = [];
    let week = Array(startingDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayBookings = filteredBookings.filter(
        (b) =>
          b.startTime.getDate() === day &&
          b.startTime.getMonth() === month &&
          b.startTime.getFullYear() === year
      );

      week.push({ date, dayBookings });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIdx) =>
            week.map((dayData, dayIdx) =>
              dayData ? (
                <div
                  key={`${weekIdx}-${dayIdx}`}
                  className="min-h-24 border border-border rounded-lg p-2 bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => handleCreateBooking(dayData.date)}
                >
                  <div className="text-xs font-semibold mb-1 text-foreground">{dayData.date.getDate()}</div>
                  <div className="space-y-0.5">
                    {dayData.dayBookings.slice(0, 2).map((booking: BookingData) => {
                      const color = RESOURCE_COLORS[booking.resourceType as ResourceType];
                      return (
                        <div
                          key={booking.id}
                          className={`text-xs p-1 rounded ${color.bg} border ${color.border} truncate`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <div className="font-medium truncate">{booking.resourceName}</div>
                          <div className="text-[10px]">{formatTime(booking.startTime)}</div>
                        </div>
                      );
                    })}
                    {dayData.dayBookings.length > 2 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{dayData.dayBookings.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div key={`${weekIdx}-${dayIdx}`} className="min-h-24 bg-muted/20 rounded-lg" />
              )
            )
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <div className="grid gap-1 min-w-max" style={{ gridTemplateColumns: "80px " + "1fr ".repeat(7) }}>
            <div className="text-xs font-semibold text-muted-foreground py-2">Time</div>
            {days.map((day) => (
              <div key={day.toISOString()} className="text-center text-xs font-semibold text-muted-foreground py-2">
                <div>{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
                <div>{day.getDate()}</div>
              </div>
            ))}

            {Array.from({ length: 17 }, (_, hour) => hour + 7).map((hour) => (
              <div key={`time-${hour}`} className="text-right pr-2 text-xs text-muted-foreground font-medium">
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}

            {days.flatMap((day) =>
              Array.from({ length: 17 }, (_, hour) => hour + 7).map((hour) => {
                const dayBookings = filteredBookings.filter(
                  (b) =>
                    b.startTime.getDate() === day.getDate() &&
                    b.startTime.getMonth() === day.getMonth() &&
                    b.startTime.getFullYear() === day.getFullYear() &&
                    b.startTime.getHours() === hour
                );

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="border border-border rounded bg-card min-h-16 p-1 hover:bg-accent/50 cursor-pointer transition-colors relative"
                    onClick={() => handleCreateBooking(day, hour)}
                  >
                    {dayBookings.map((booking) => {
                      const color = RESOURCE_COLORS[booking.resourceType];
                      return (
                        <div
                          key={booking.id}
                          className={`text-[10px] p-1 rounded ${color.bg} border ${color.border} mb-0.5`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <div className="font-medium truncate">{booking.resourceName}</div>
                          <div className="truncate">{booking.bookerName}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayBookings = filteredBookings.filter(
      (b) =>
        b.startTime.getDate() === currentDate.getDate() &&
        b.startTime.getMonth() === currentDate.getMonth() &&
        b.startTime.getFullYear() === currentDate.getFullYear()
    );

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
          {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>

        <div className="space-y-2">
          {Array.from({ length: 17 }, (_, hour) => hour + 7).map((hour) => {
            const hourBookings = dayBookings.filter((b) => b.startTime.getHours() === hour);

            return (
              <div key={`hour-${hour}`} className="flex gap-4">
                <div className="w-16 text-xs font-semibold text-muted-foreground py-2">
                  {String(hour).padStart(2, "0")}:00
                </div>
                <div className="flex-1 flex gap-2 flex-wrap">
                  {hourBookings.length > 0 ? (
                    hourBookings.map((booking) => {
                      const color = RESOURCE_COLORS[booking.resourceType];
                      return (
                        <div
                          key={booking.id}
                          className={`flex-1 p-3 rounded border ${color.bg} ${color.border} ${color.text}`}
                        >
                          <div className="font-semibold text-sm">{booking.resourceName}</div>
                          <div className="text-xs">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</div>
                          <div className="text-xs text-muted-foreground">{booking.bookerName}</div>
                        </div>
                      );
                    })
                  ) : (
                    <button
                      onClick={() => handleCreateBooking(currentDate, hour)}
                      className="flex-1 border border-dashed border-border rounded p-3 text-muted-foreground hover:bg-accent/50 transition-colors text-xs flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Available
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">
            BOOKING CALENDAR
          </div>
          <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
            Booking <strong className="font-semibold">calendar.</strong>
          </h1>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border/40">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* View selector */}
            <div className="flex gap-2">
              {["day", "week", "month"].map((v) => (
                <Button
                  key={v}
                  onClick={() => setView(v as ViewType)}
                  variant={view === v ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                >
                  {v}
                </Button>
              ))}
            </div>

            {/* Location filter */}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Floor filter */}
            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floors.map((floor) => (
                  <SelectItem key={floor} value={floor}>
                    Floor {floor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resource type filters */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedResourceTypes.has("desk")}
                onCheckedChange={() => toggleResourceType("desk")}
              />
              <span className="text-sm font-medium">Desks</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedResourceTypes.has("meeting_room")}
                onCheckedChange={() => toggleResourceType("meeting_room")}
              />
              <span className="text-sm font-medium">Meeting Rooms</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedResourceTypes.has("parking")}
                onCheckedChange={() => toggleResourceType("parking")}
              />
              <span className="text-sm font-medium">Parking</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrevious}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-sm font-semibold">
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
            ...(view === "day" && { day: "numeric", weekday: "long" }),
          })}
        </div>
        <Button variant="outline" size="sm" onClick={handleNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar view */}
      <div className="overflow-x-auto">
        {view === "month" && renderMonthView()}
        {view === "week" && renderWeekView()}
        {view === "day" && renderDayView()}
      </div>

      {/* Create booking modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Date & Time</label>
              <div className="text-sm text-muted-foreground mt-1">
                {selectedSlot && (
                  <>
                    <div>{formatDate(selectedSlot.startTime)}</div>
                    <div>
                      {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Booking modal placeholder - implement full booking flow in next iteration
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs pt-4 border-t border-border/40">
        {(["desk", "meeting_room", "parking"] as const).map((type) => {
          const color = RESOURCE_COLORS[type];
          const label = type === "meeting_room" ? "Meeting Room" : type.charAt(0).toUpperCase() + type.slice(1);
          return (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded border ${color.bg} ${color.border}`} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
