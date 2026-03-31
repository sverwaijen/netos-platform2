import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  confirmed: "bg-primary/20 text-primary",
  checked_in: "bg-chart-1/20 text-chart-1",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/20 text-destructive",
  no_show: "bg-chart-3/20 text-chart-3",
};

export default function Bookings() {
  const { data: bookings, isLoading } = trpc.bookings.mine.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your workspace reservations</p>
        </div>
        <Button onClick={() => toast.info("Navigate to a location to create a booking")}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-card border-border/50 animate-pulse">
              <CardContent className="p-6"><div className="h-16" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (bookings ?? []).length === 0 ? (
        <Card className="bg-card border-border/50">
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No bookings yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Visit a location to book your first workspace</p>
            <Button variant="outline" className="bg-transparent" onClick={() => window.location.href = "/locations"}>
              Browse Locations
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(bookings ?? []).map((b) => (
            <Card key={b.id} className="bg-card border-border/50 hover:border-primary/20 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Resource #{b.resourceId}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(Number(b.startTime)).toLocaleDateString()} {new Date(Number(b.startTime)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>{b.creditsCost} credits</span>
                        <span>{b.multiplierApplied}x multiplier</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={statusColors[b.status] ?? ""} variant="secondary">
                    {b.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
