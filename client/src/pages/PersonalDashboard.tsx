import { Card, CardContent } from "@/components/ui/card";
import { Clock, Zap, Star, Calendar, TrendingUp, RotateCcw } from "lucide-react";

export default function PersonalDashboard() {
  // Demo data
  const favoriteResources = [
    { id: 1, name: "Meeting Room A", location: "Floor 2", type: "meeting", favorite: true, capacity: 8 },
    { id: 2, name: "Desk 4-12", location: "Floor 1", type: "desk", favorite: true, capacity: 1 },
    { id: 3, name: "Parking Spot 42", location: "Basement", type: "parking", favorite: true, capacity: 1 },
    { id: 4, name: "Quiet Zone B", location: "Floor 3", type: "desk", favorite: true, capacity: 2 },
  ];

  const personalStats = {
    hoursBooked: 156,
    creditsUsed: 2340,
    avgPerWeek: 12,
    totalResources: 4,
  };

  const recentBookings = [
    { id: 1, resource: "Meeting Room A", date: "2026-04-14", time: "14:00-15:00", duration: 1, status: "upcoming" },
    { id: 2, resource: "Desk 4-12", date: "2026-04-14", time: "10:00-12:00", duration: 2, status: "active" },
    { id: 3, resource: "Parking Spot 42", date: "2026-04-13", time: "08:00-17:00", duration: 9, status: "completed" },
    { id: 4, resource: "Meeting Room A", date: "2026-04-12", time: "15:00-16:30", duration: 1.5, status: "completed" },
    { id: 5, resource: "Quiet Zone B", date: "2026-04-11", time: "10:00-11:30", duration: 1.5, status: "completed" },
  ];

  const usagePattern = [
    { day: "Monday", hours: 14 },
    { day: "Tuesday", hours: 16 },
    { day: "Wednesday", hours: 12 },
    { day: "Thursday", hours: 13 },
    { day: "Friday", hours: 9 },
  ];

  const recommendations = [
    { title: "Desk 3-05 Available", description: "Quieter location, close to natural light", reason: "Matches your preference for quiet spaces" },
    { title: "Friday After 3pm", description: "Lower occupancy, good for focused work", reason: "You often book on Fridays" },
    { title: "Parking Spot 8", description: "Closer to elevator, faster access", reason: "Similar to your favorite spot" },
  ];

  const maxHours = Math.max(...usagePattern.map(p => p.hours));

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">Overview</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          My <strong className="font-semibold">dashboard.</strong>
        </h1>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Hours Booked", value: personalStats.hoursBooked, icon: Clock, color: "#627653" },
          { label: "Credits Used", value: `${personalStats.creditsUsed}c`, icon: Zap, color: "#b8a472" },
          { label: "Avg Per Week", value: `${personalStats.avgPerWeek}h`, icon: TrendingUp, color: "#4a7c8a" },
          { label: "Favorites", value: personalStats.totalResources, icon: Star, color: "#627653" },
        ].map((item, i) => (
          <div key={i} className="bg-[#111] p-5">
            <item.icon className="w-4 h-4 mb-3" style={{ color: item.color }} />
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-1">{item.label}</div>
            <div className="text-2xl font-extralight">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Favorite Resources */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Quick Access</div>
          <h3 className="text-lg font-extralight mb-6">Favorite <strong className="font-semibold">resources.</strong></h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {favoriteResources.map((resource) => (
              <div key={resource.id} className="p-4 rounded-sm bg-white/[0.02] border border-white/[0.04] space-y-3 hover:bg-white/[0.04] transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-[13px] font-light text-foreground">{resource.name}</h4>
                    <p className="text-[11px] text-[#888] font-light mt-1">{resource.location}</p>
                  </div>
                  <Star className="w-4 h-4 text-[#b8a472] fill-[#b8a472] shrink-0" />
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                  <button className="flex-1 text-[11px] font-medium tracking-[1px] uppercase bg-[#627653]/20 text-[#627653] px-2 py-1.5 rounded-sm hover:bg-[#627653]/30 transition-colors">
                    Book Now
                  </button>
                  <button className="text-[11px] font-medium tracking-[1px] uppercase text-[#888] hover:text-foreground transition-colors">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Usage Pattern & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.04]">
        {/* Usage Pattern */}
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-4">Pattern</div>
            <h3 className="text-sm font-light mb-4">Weekly Usage</h3>
            <div className="space-y-4">
              {usagePattern.map((day, i) => {
                const percentage = (day.hours / maxHours) * 100;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[13px] font-light">{day.day}</span>
                      <span className="text-[13px] font-light text-[#888]">{day.hours}h</span>
                    </div>
                    <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4a7c8a] rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-[#111] border-0">
          <CardContent className="p-6">
            <div className="text-[10px] font-medium tracking-[2px] uppercase text-[#888] mb-4">Suggestions</div>
            <h3 className="text-sm font-light mb-4">Recommended for You</h3>
            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="p-3 rounded-sm bg-white/[0.02] border border-white/[0.04] space-y-1">
                  <div className="text-[12px] font-light text-foreground">{rec.title}</div>
                  <p className="text-[11px] text-[#888] font-light">{rec.description}</p>
                  <p className="text-[10px] text-[#627653] font-light italic mt-1">{rec.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Activity</div>
          <h3 className="text-lg font-extralight mb-6">Recent <strong className="font-semibold">bookings.</strong></h3>
          <div className="space-y-[1px] bg-white/[0.04]">
            <div className="grid grid-cols-5 bg-[#111] p-3 text-[10px] font-medium tracking-[1px] uppercase text-[#888]">
              <div>Resource</div>
              <div>Date</div>
              <div>Time</div>
              <div>Duration</div>
              <div>Status</div>
            </div>
            {recentBookings.map((booking) => {
              const statusColors = {
                upcoming: "#4a7c8a",
                active: "#b8a472",
                completed: "#627653",
              };
              return (
                <div key={booking.id} className="grid grid-cols-5 bg-[#111] p-3 text-[13px] font-light items-center">
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-[#888]" />
                    {booking.resource}
                  </div>
                  <div className="text-[#888]">{booking.date}</div>
                  <div className="text-[#888]">{booking.time}</div>
                  <div>{booking.duration}h</div>
                  <div>
                    <span className="text-[11px] font-medium tracking-[1px] uppercase px-2 py-1 rounded-sm"
                      style={{
                        backgroundColor: `${statusColors[booking.status as keyof typeof statusColors]}20`,
                        color: statusColors[booking.status as keyof typeof statusColors],
                      }}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Repeat Bookings */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Quick Actions</div>
          <h3 className="text-lg font-extralight mb-6">Repeat <strong className="font-semibold">bookings.</strong></h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentBookings.slice(0, 3).map((booking) => (
              <div key={booking.id} className="p-4 rounded-sm bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-[13px] font-light">{booking.resource}</h4>
                    <p className="text-[11px] text-[#888] font-light mt-1">{booking.time} • {booking.duration}h</p>
                  </div>
                </div>
                <button className="w-full flex items-center justify-center gap-2 text-[11px] font-medium tracking-[1px] uppercase bg-[#627653]/20 text-[#627653] px-3 py-2 rounded-sm hover:bg-[#627653]/30 transition-colors">
                  <RotateCcw className="w-3 h-3" />
                  Repeat
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customizable Widgets Notice */}
      <Card className="bg-[#111] border-white/[0.06]">
        <CardContent className="p-6">
          <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-1">Customize</div>
          <h3 className="text-lg font-extralight mb-4">Dashboard <strong className="font-semibold">layout.</strong></h3>
          <div className="p-4 rounded-sm bg-white/[0.02] border border-white/[0.04] space-y-3">
            <p className="text-[13px] font-light text-foreground">
              Personalize your dashboard by selecting which widgets to display and rearrange them to fit your workflow.
            </p>
            <div className="flex gap-2">
              <button className="text-[11px] font-medium tracking-[1px] uppercase bg-[#627653]/20 text-[#627653] px-3 py-1.5 rounded-sm hover:bg-[#627653]/30 transition-colors">
                Configure Layout
              </button>
              <button className="text-[11px] font-medium tracking-[1px] uppercase text-[#888] hover:text-foreground transition-colors">
                Reset to Default
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
