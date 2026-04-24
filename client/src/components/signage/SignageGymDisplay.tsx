import { trpc } from "@/lib/trpc";
import SignageLayout from "./SignageLayout";
import { Dumbbell, Users, Flame, Heart, Zap, Activity, Trophy, type LucideIcon } from "lucide-react";

type GymClass = {
  className: string;
  instructor?: string | null;
  category: string;
  startTime: string;
  endTime: string;
  maxParticipants?: number | null;
};

const CATEGORY_META: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  cardio: { icon: Heart, color: "#ef4444", label: "Cardio" },
  strength: { icon: Dumbbell, color: "#3b82f6", label: "Strength" },
  yoga: { icon: Activity, color: "#7cb342", label: "Yoga" },
  pilates: { icon: Activity, color: "#ab47bc", label: "Pilates" },
  hiit: { icon: Flame, color: "#ff7043", label: "HIIT" },
  cycling: { icon: Zap, color: "#42a5f5", label: "Cycling" },
  boxing: { icon: Flame, color: "#ef5350", label: "Boxing" },
  stretching: { icon: Activity, color: "#66bb6a", label: "Stretching" },
  meditation: { icon: Heart, color: "#7e57c2", label: "Meditation" },
  egym: { icon: Trophy, color: "#14b8a6", label: "EGYM" },
};

interface Props {
  config: { location?: { name?: string } };
  time: Date;
  locationId: number;
  onRefresh: () => void;
  isDemo?: boolean;
}

const DEMO_CLASSES = [
  { className: "Power Yoga", instructor: "Lisa", category: "yoga", startTime: "07:00", endTime: "08:00", maxParticipants: 15 },
  { className: "HIIT Blast", instructor: "Mark", category: "hiit", startTime: "08:30", endTime: "09:15", maxParticipants: 20 },
  { className: "Spinning", instructor: "Sophie", category: "cycling", startTime: "09:30", endTime: "10:15", maxParticipants: 25 },
  { className: "Muscle Strength", instructor: "Tom", category: "strength", startTime: "10:30", endTime: "11:30", maxParticipants: 12 },
  { className: "EGYM Circuit", instructor: "EGYM", category: "egym", startTime: "12:00", endTime: "12:45", maxParticipants: 8 },
  { className: "Boxing Fit", instructor: "Ahmed", category: "boxing", startTime: "13:00", endTime: "14:00", maxParticipants: 16 },
  { className: "Stretch & Relax", instructor: "Eva", category: "stretching", startTime: "17:00", endTime: "17:45", maxParticipants: 20 },
  { className: "Endurance Run", instructor: "Pieter", category: "cardio", startTime: "18:00", endTime: "19:00", maxParticipants: 30 },
];

const VITALITY_TIPS = [
  "Drink minimaal 2 liter water per dag",
  "Neem elke 45 minuten een beweegpauze",
  "Gebruik de trap in plaats van de lift",
  "Stretch je schouders en nek regelmatig",
];

export default function SignageGymDisplay({ config, time, locationId, onRefresh, isDemo }: Props) {
  const { data: schedule } = trpc.signageDisplay.getGymSchedule.useQuery(
    { locationId },
    { enabled: !isDemo, refetchInterval: 60000 }
  );

  const classes = isDemo ? DEMO_CLASSES : (schedule || []);
  const now = time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  const sortedClasses = [...(classes as GymClass[])].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const currentClass = sortedClasses.find((c) => c.startTime <= now && c.endTime > now);
  const upcomingClasses = sortedClasses.filter((c) => c.startTime > now);
  const pastClasses = sortedClasses.filter((c) => c.endTime <= now);

  const tipIndex = Math.floor(time.getMinutes() / 15) % VITALITY_TIPS.length;

  return (
    <SignageLayout theme="gym" locationName={config.location?.name} time={time} footerText="Exercise made easy" isDemo={isDemo}>
      <div className="h-full flex flex-col gap-4">
        {/* Header */}
        <div className="shrink-0">
          <div className="text-[9px] tracking-[5px] uppercase font-semibold text-teal-400/60 mb-2">Exercise Made Easy</div>
          <h2 className="text-[clamp(24px,4vw,36px)] font-black uppercase tracking-tight leading-none text-white">
            Work That<br />Body
          </h2>
        </div>

        {/* Current class highlight */}
        {currentClass && (
          <div className="shrink-0 rounded-2xl overflow-hidden border border-teal-500/20" style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.15), rgba(20,184,166,0.05))" }}>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-[9px] tracking-[3px] uppercase text-teal-400 font-semibold">Nu bezig</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${CATEGORY_META[currentClass.category]?.color || "#14b8a6"}20` }}>
                  {(() => { const Icon = CATEGORY_META[currentClass.category]?.icon || Dumbbell; return <Icon className="w-7 h-7" style={{ color: CATEGORY_META[currentClass.category]?.color || "#14b8a6" }} />; })()}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{currentClass.className}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-white/40">
                    <span>{currentClass.startTime} - {currentClass.endTime}</span>
                    {currentClass.instructor && <span>{currentClass.instructor}</span>}
                    {currentClass.maxParticipants && <span><Users className="w-3 h-3 inline mr-0.5" />{currentClass.maxParticipants}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extralight text-teal-400">{currentClass.startTime}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!currentClass && (
          <div className="shrink-0 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center">
            <Dumbbell className="w-8 h-8 text-teal-400/20 mx-auto mb-2" />
            <p className="text-base font-light text-white/35">Geen les op dit moment</p>
            <p className="text-xs text-white/20 mt-1">
              {upcomingClasses.length > 0 ? `Volgende les om ${upcomingClasses[0].startTime}` : "Geen lessen meer vandaag"}
            </p>
          </div>
        )}

        {/* Schedule list */}
        <div className="flex-1 overflow-hidden">
          <div className="text-[9px] tracking-[3px] uppercase text-white/30 font-semibold mb-2">
            {currentClass ? "Volgende lessen" : "Rooster vandaag"}
          </div>
          <div className="space-y-1.5 overflow-y-auto h-full pr-1" style={{ scrollbarWidth: "none" }}>
            {(currentClass ? upcomingClasses : sortedClasses).map((cls, idx) => {
              const meta = CATEGORY_META[cls.category] || { icon: Dumbbell, color: "#14b8a6", label: cls.category };
              const Icon = meta.icon;
              const isPast = pastClasses.includes(cls);
              return (
                <div key={idx} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl border transition-all ${isPast ? "bg-white/[0.01] border-white/[0.02] opacity-40" : "bg-white/[0.03] border-white/[0.05]"}`}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{cls.className}</p>
                    <div className="flex items-center gap-2 text-[9px] text-white/30">
                      <span className="capitalize">{meta.label}</span>
                      {cls.instructor && <span>{cls.instructor}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-light text-white/70">{cls.startTime}</div>
                    <div className="text-[9px] text-white/25">{cls.endTime}</div>
                  </div>
                </div>
              );
            })}
            {classes.length === 0 && (
              <div className="text-center py-12">
                <Dumbbell className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/25">Geen lessen vandaag</p>
              </div>
            )}
          </div>
        </div>

        {/* Vitality tip */}
        <div className="shrink-0 rounded-xl bg-[#627653]/10 border border-[#627653]/15 p-3 flex items-center gap-3">
          <Trophy className="w-4 h-4 text-[#627653] shrink-0" />
          <div>
            <div className="text-[8px] tracking-[3px] uppercase text-[#627653]/60 font-semibold">Vitality Tip</div>
            <p className="text-[11px] text-white/50 font-light">{VITALITY_TIPS[tipIndex]}</p>
          </div>
        </div>

        {/* EGYM categories */}
        <div className="shrink-0 grid grid-cols-3 gap-2">
          {[
            { label: "Muscle Strength", sub: "Lift those weights!", color: "#3b82f6" },
            { label: "Endurance", sub: "Raise that heartbeat!", color: "#ef4444" },
            { label: "Mobility", sub: "Stretch that body!", color: "#a855f7" },
          ].map((cat, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 text-center">
              <p className="text-[10px] font-semibold" style={{ color: cat.color }}>{cat.label}</p>
              <p className="text-[8px] text-white/25 italic mt-0.5">{cat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </SignageLayout>
  );
}
