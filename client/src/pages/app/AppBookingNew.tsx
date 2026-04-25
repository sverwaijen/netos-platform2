import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, Clock, Users, Wifi, Phone, Coffee,
  MapPin, ChevronRight, Loader2, CheckCircle2,
} from "lucide-react";

type Step = "location" | "resource" | "time" | "confirm";

export default function AppBookingNew() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("location");
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedResource, setSelectedResource] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [notes, setNotes] = useState("");

  const { data: locations = [] } = trpc.locations.list.useQuery();
  const { data: resources = [] } = trpc.resources.byLocation.useQuery(
    { locationId: selectedLocation! },
    { enabled: !!selectedLocation && step === "resource" }
  );
  const { data: wallets = [] } = trpc.wallets.mine.useQuery();

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: () => {
      toast.success("Boeking bevestigd!");
      navigate("/app/bookings");
    },
    onError: (e: any) => {
      toast.error(e.message || "Fout bij het maken van boeking");
    },
  });

  const selectedLocationObj = locations.find((l: any) => l.id === selectedLocation);
  const selectedResourceObj = resources.find((r: any) => r.id === selectedResource);
  const personalWallet = wallets.find((w: any) => w.type === "personal");

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "desk":
        return <Wifi className="w-5 h-5" />;
      case "meeting_room":
        return <Users className="w-5 h-5" />;
      case "phone_booth":
        return <Phone className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      desk: "Bureauplaat",
      meeting_room: "Vergaderruimte",
      private_office: "Privékantoor",
      open_space: "Open Space",
      locker: "Kluisje",
      phone_booth: "Telefooncel",
      event_space: "Evenementenzaal",
    };
    return labels[type] || type;
  };

  const handleConfirm = () => {
    if (!selectedLocation || !selectedResource || !selectedDate || !selectedStartTime || !selectedEndTime) {
      toast.error("Vul alle velden in");
      return;
    }

    const startDateTime = new Date(`${selectedDate}T${selectedStartTime}`);
    const endDateTime = new Date(`${selectedDate}T${selectedEndTime}`);

    if (endDateTime <= startDateTime) {
      toast.error("Eindtijd moet na starttijd liggen");
      return;
    }

    const startTime = startDateTime.getTime();
    const endTime = endDateTime.getTime();

    createBooking.mutate({
      resourceId: selectedResource,
      locationId: selectedLocation,
      startTime,
      endTime,
      notes: notes || undefined,
    });
  };

  // Location selection step
  if (step === "location") {
    return (
      <div className="px-5 pt-6 pb-4 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/app/bookings")} className="flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <h1 className="text-xl font-light text-white">Nieuwe Boeking</h1>
        </div>

        <div>
          <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Kies een locatie</h2>
          <div className="space-y-2">
            {locations.map((location: any) => (
              <button
                key={location.id}
                onClick={() => {
                  setSelectedLocation(location.id);
                  setStep("resource");
                }}
                className="w-full bg-white/[0.03] rounded-xl p-4 text-left transition-all active:scale-[0.99] active:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium">{location.name}</p>
                    <p className="text-white/40 text-sm mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {location.city}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/20 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Resource selection step
  if (step === "resource") {
    return (
      <div className="px-5 pt-6 pb-4 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("location")} className="flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <h1 className="text-xl font-light text-white">Kies een Ruimte</h1>
        </div>

        <p className="text-white/40 text-sm">{selectedLocationObj?.name}</p>

        <div>
          <h2 className="text-white/60 text-xs tracking-[0.15em] uppercase font-medium mb-3">Beschikbare Ruimtes</h2>
          <div className="space-y-2">
            {resources
              .filter((r: any) => r.isActive)
              .sort((a: any, b: any) => {
                const typeOrder = ["desk", "meeting_room", "private_office", "phone_booth"];
                return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
              })
              .map((resource: any) => (
                <button
                  key={resource.id}
                  onClick={() => {
                    setSelectedResource(resource.id);
                    setStep("time");
                  }}
                  className="w-full bg-white/[0.03] rounded-xl p-4 text-left transition-all active:scale-[0.99] active:bg-white/[0.05]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#627653]/10 flex items-center justify-center flex-shrink-0">
                      <div className="text-[#627653]">{getResourceIcon(resource.type)}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{resource.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-white/40 text-xs">{getResourceTypeLabel(resource.type)}</p>
                        {resource.capacity && (
                          <p className="text-white/30 text-xs">
                            • {resource.capacity} personen
                          </p>
                        )}
                        <p className="text-[#627653] text-xs font-semibold ml-auto">
                          {resource.creditCostPerHour}/u
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 flex-shrink-0" />
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Time selection step
  if (step === "time") {
    return (
      <div className="px-5 pt-6 pb-4 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("resource")} className="flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <h1 className="text-xl font-light text-white">Kies Moment</h1>
        </div>

        <p className="text-white/40 text-sm">{selectedResourceObj?.name}</p>

        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-xs block mb-2 tracking-[0.15em] uppercase">Datum</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#627653]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/60 text-xs block mb-2 tracking-[0.15em] uppercase">Start</label>
              <input
                type="time"
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#627653]/50"
              />
            </div>
            <div>
              <label className="text-white/60 text-xs block mb-2 tracking-[0.15em] uppercase">Einde</label>
              <input
                type="time"
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#627653]/50"
              />
            </div>
          </div>

          <div>
            <label className="text-white/60 text-xs block mb-2 tracking-[0.15em] uppercase">Notities (optioneel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bijzonderheden..."
              rows={2}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#627653]/50 resize-none"
            />
          </div>
        </div>

        <button
          onClick={() => setStep("confirm")}
          disabled={!selectedDate || !selectedStartTime || !selectedEndTime}
          className="w-full py-3 rounded-xl bg-[#627653] text-white text-sm font-medium disabled:opacity-50"
        >
          Controleer
        </button>
      </div>
    );
  }

  // Confirmation step
  if (step === "confirm") {
    const startDateTime = new Date(`${selectedDate}T${selectedStartTime}`);
    const endDateTime = new Date(`${selectedDate}T${selectedEndTime}`);
    const hours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    const estimatedCost = hours * parseFloat(selectedResourceObj?.creditCostPerHour || "0");

    return (
      <div className="px-5 pt-6 pb-4 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("time")} className="flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <h1 className="text-xl font-light text-white">Bevestig Boeking</h1>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-5 space-y-4">
          <div className="border-b border-white/[0.06] pb-4">
            <p className="text-white/40 text-xs tracking-[0.15em] uppercase mb-2">Ruimte</p>
            <p className="text-white text-lg font-medium">{selectedResourceObj?.name}</p>
            <p className="text-white/40 text-sm mt-1">{getResourceTypeLabel(selectedResourceObj?.type || "")}</p>
          </div>

          <div className="border-b border-white/[0.06] pb-4">
            <p className="text-white/40 text-xs tracking-[0.15em] uppercase mb-2">Wanneer</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/30" />
                <p className="text-white text-sm">
                  {startDateTime.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/30" />
                <p className="text-white text-sm">
                  {selectedStartTime} - {selectedEndTime} ({hours.toFixed(1)} uur)
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-white/40 text-xs tracking-[0.15em] uppercase mb-2">Kosten</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/60 text-sm">
                  {selectedResourceObj?.creditCostPerHour} credits/uur × {hours.toFixed(1)} uur
                </p>
              </div>
              <p className="text-white text-2xl font-light">
                {estimatedCost.toFixed(0)}
                <span className="text-sm text-white/60 ml-1">credits</span>
              </p>
            </div>
            {personalWallet && (
              <p className="text-white/40 text-xs mt-2">
                Beschikbaar: {parseFloat(personalWallet.balance).toFixed(0)} credits
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setStep("time")}
            className="flex-1 py-3 rounded-xl border border-white/[0.1] text-white text-sm font-medium"
          >
            Terug
          </button>
          <button
            onClick={handleConfirm}
            disabled={createBooking.isPending}
            className="flex-1 py-3 rounded-xl bg-[#627653] text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {createBooking.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {createBooking.isPending ? "Verwerking..." : "Boeken"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
