import { trpc } from "@/lib/trpc";
import SignageLayout from "./SignageLayout";
import { Dumbbell, Clock, Users, Flame, Heart, Zap, Activity } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; gradient: string }> = {
  cardio: { icon: Heart, color: "#e74c3c", gradient: "from-red-900/30 to-red-800/10" },
  strength: { icon: Dumbbell, color: "#c4a68a", gradient: "from-amber-900/30 to-amber-800/10" },
  yoga: { icon: Activity, color: "#7cb342", gradient: "from-green-900/30 to-green-800/10" },
  pilates: { icon: Activity, color: "#ab47bc", gradient: "from-purple-900/30 to-purple-800/10" },
  hiit: { icon: Flame, color: "#ff7043", gradient: "from-orange-900/30 to-orange-800/10" },
  cycling: { icon: Zap, color: "#42a5f5", gradient: "from-blue-900/30 to-blue-800/10" },
  boxing: { icon: Zap, color: "#ef5350", gradient: "from-red-900/30 to-red-800/10" },
  stretching: { icon: Activity, color: "#66bb6a", gradient: "from-green-900/30 to-green-800/10" },
  meditation: { icon: Heart, color: "#7e57c2", gradient: "from-purple-900/30 to-purple-800/10" },
  egym: { icon: Dumbbell, color: "#c4a68a", gradient: "from-amber-900/30 to-amber-800/10" },
};

interface Props {
  config: any;
  time: Date;
  locationId: number;
  onRefresh: () => void;
}

export default function SignageGymDisplay({ config, time, locationId, onRefresh }: Props) {
  const { data: schedule } = trpc.signageDisplay.getGymSchedule.useQuery(
    { locationId },
    { refetchInterval: 120000 }
  );

  const currentHour = time.getHours();
  const currentMinute = time.getMinutes();
  const currentTimeStr = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

  // Find current and upcoming classes
  const sortedSchedule = (schedule || []).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
  const currentClass = sortedSchedule.find((c: any) => c.startTime <= currentTimeStr && c.endTime > currentTimeStr);
  const upcomingClasses = sortedSchedule.filter((c: any) => c.startTime > currentTimeStr);
  const pastClasses = sortedSchedule.filter((c: any) => c.endTime <= currentTimeStr);

  const dayNames = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

  return (
    <SignageLayout
      theme="brown"
      locationName={config.location?.name}
      time={time}
      footerText="Vitality made easy"
    >
      <div className="h-full flex flex-col gap-6">
        {/* Title */}
        <div>
          <div className="text-[10px] tracking-[4px] uppercase text-[#c4a68a]/60 font-semibold mb-2">
            Gym Rooster — {dayNames[time.getDay()]}
          </div>
          <h2 className="text-3xl font-extralight">
            Stay <strong className="font-semibold">Active.</strong>
          </h2>
        </div>

        {/* Current Class Highlight */}
        {currentClass && (
          <div className="bg-[#c4a68a]/10 border border-[#c4a68a]/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-3 right-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#c4a68a] animate-pulse" />
              <span className="text-[10px] tracking-[2px] uppercase text-[#c4a68a] font-semibold">Nu bezig</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-xl bg-[#c4a68a]/20 flex items-center justify-center">
                {(() => {
                  const cat = CATEGORY_CONFIG[currentClass.category] || CATEGORY_CONFIG.cardio;
                  const Icon = cat.icon;
                  return <Icon className="w-8 h-8" style={{ color: cat.color }} />;
                })()}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-light">{currentClass.className}</h3>
                <div className="flex items-center gap-4 mt-1">
                  {currentClass.instructor && (
                    <span className="text-sm text-white/50">{currentClass.instructor}</span>
                  )}
                  <span className="text-sm text-[#c4a68a]">{currentClass.startTime} — {currentClass.endTime}</span>
                  <span className="text-sm text-white/40 capitalize">{currentClass.category}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-white/40">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{currentClass.currentParticipants || 0}/{currentClass.maxParticipants}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!currentClass && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
            <Dumbbell className="w-10 h-10 text-[#c4a68a]/30 mx-auto mb-3" />
            <p className="text-lg font-light text-white/40">Geen les op dit moment</p>
            <p className="text-sm text-white/20 mt-1">
              {upcomingClasses.length > 0
                ? `Volgende les om ${upcomingClasses[0].startTime}`
                : "Geen lessen meer vandaag"}
            </p>
          </div>
        )}

        {/* Upcoming Classes */}
        {upcomingClasses.length > 0 && (
          <div className="flex-1 overflow-hidden">
            <div className="text-[10px] tracking-[3px] uppercase text-white/30 font-semibold mb-3">
              Komende lessen
            </div>
            <div className="space-y-2">
              {upcomingClasses.slice(0, 6).map((cls: any, i: number) => {
                const cat = CATEGORY_CONFIG[cls.category] || CATEGORY_CONFIG.cardio;
                const Icon = cat.icon;
                return (
                  <div
                    key={cls.id || i}
                    className="flex items-center gap-4 py-3 px-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${cat.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-light">{cls.className}</p>
                      <p className="text-[11px] text-white/30">{cls.instructor || cls.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-[#c4a68a]">{cls.startTime}</p>
                      <p className="text-[10px] text-white/30">{cls.endTime}</p>
                    </div>
                    <div className="flex items-center gap-1 text-white/20 min-w-[60px] justify-end">
                      <Users className="w-3 h-3" />
                      <span className="text-[11px]">{cls.currentParticipants || 0}/{cls.maxParticipants}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vitality Tips */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          {[
            { icon: Heart, text: "Beweeg elke 30 min", sub: "Sta op en stretch" },
            { icon: Activity, text: "Ergonomisch werken", sub: "Stel je bureau goed in" },
            { icon: Flame, text: "Stay hydrated", sub: "Drink 2L water per dag" },
          ].map((tip, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 text-center">
              <tip.icon className="w-5 h-5 text-[#c4a68a]/50 mx-auto mb-2" />
              <p className="text-[11px] font-medium">{tip.text}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{tip.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </SignageLayout>
  );
}
