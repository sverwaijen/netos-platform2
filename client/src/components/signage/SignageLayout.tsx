import { BRAND } from "@/lib/brand";
import { ReactNode } from "react";

interface SignageLayoutProps {
  children: ReactNode;
  theme?: "green" | "brown" | "dark" | "gym";
  locationName?: string;
  time: Date;
  showLogo?: boolean;
  showClock?: boolean;
  showFooter?: boolean;
  footerText?: string;
  isDemo?: boolean;
}

const THEMES = {
  green: {
    bg: "linear-gradient(160deg, #1a2614 0%, #2d3a24 30%, #3a4a34 60%, #1a2614 100%)",
    accent: "#627653",
    accentLight: "#a8b89a",
    gold: "#b8a472",
    text: "#f5f2ea",
    textMuted: "rgba(245,242,234,0.45)",
    cardBg: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(255,255,255,0.06)",
    waveFill: "#627653",
    waveOpacity: 0.15,
  },
  brown: {
    bg: "linear-gradient(160deg, #1f1610 0%, #2d2018 30%, #3d2b1f 60%, #1f1610 100%)",
    accent: "#c4a68a",
    accentLight: "#d4b8a0",
    gold: "#b8a472",
    text: "#f5f2ea",
    textMuted: "rgba(245,242,234,0.45)",
    cardBg: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(255,255,255,0.06)",
    waveFill: "#c4a68a",
    waveOpacity: 0.1,
  },
  dark: {
    bg: "linear-gradient(160deg, #0a0a0a 0%, #111111 40%, #0a0a0a 100%)",
    accent: "#627653",
    accentLight: "#a8b89a",
    gold: "#b8a472",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.35)",
    cardBg: "rgba(255,255,255,0.03)",
    cardBorder: "rgba(255,255,255,0.05)",
    waveFill: "#627653",
    waveOpacity: 0.08,
  },
  gym: {
    bg: "linear-gradient(160deg, #0d1a0b 0%, #1a2418 30%, #222d1e 60%, #0d1a0b 100%)",
    accent: "#3d6b4f",
    accentLight: "#5a9a6e",
    gold: "#b8a472",
    text: "#e8f0e4",
    textMuted: "rgba(232,240,228,0.4)",
    cardBg: "rgba(255,255,255,0.03)",
    cardBorder: "rgba(255,255,255,0.05)",
    waveFill: "#3d6b4f",
    waveOpacity: 0.12,
  },
};

export default function SignageLayout({
  children,
  theme = "green",
  locationName,
  time,
  showLogo = true,
  showClock = true,
  showFooter = true,
  footerText,
  isDemo,
}: SignageLayoutProps) {
  const t = THEMES[theme];
  const timeStr = time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ background: t.bg, color: t.text, fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Decorative wave shapes (like the presentation) */}
      <svg
        className="absolute top-0 left-0 w-full pointer-events-none"
        viewBox="0 0 1080 200"
        preserveAspectRatio="none"
        style={{ height: "18%", opacity: t.waveOpacity }}
      >
        <path d="M0,120 C200,40 400,180 600,80 C800,-20 1000,100 1080,60 L1080,0 L0,0 Z" fill={t.waveFill} />
        <path d="M0,160 C300,80 500,200 750,100 C900,40 1000,120 1080,90 L1080,0 L0,0 Z" fill={t.waveFill} opacity="0.5" />
      </svg>

      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        viewBox="0 0 1080 200"
        preserveAspectRatio="none"
        style={{ height: "15%", opacity: t.waveOpacity * 0.7 }}
      >
        <path d="M0,40 C200,120 400,20 600,100 C800,180 1000,60 1080,120 L1080,200 L0,200 Z" fill={t.waveFill} />
      </svg>

      {/* Demo badge */}
      {isDemo && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
          <span className="text-[9px] tracking-[3px] uppercase text-amber-400 font-semibold">Demo modus</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 shrink-0">
        <div className="flex items-center gap-5">
          {showLogo && (
            <img src={BRAND.logo} alt="Mr. Green" className="h-7 opacity-80" />
          )}
          {locationName && (
            <>
              <div className="w-px h-5 bg-white/10" />
              <span className="text-[10px] tracking-[4px] uppercase font-light" style={{ color: t.textMuted }}>
                {locationName}
              </span>
            </>
          )}
        </div>
        {showClock && (
          <div className="text-right">
            <div className="text-3xl font-extralight tracking-[4px]" style={{ color: t.accent }}>
              {timeStr}
            </div>
            <div className="text-[9px] tracking-[3px] uppercase font-light mt-0.5" style={{ color: t.textMuted }}>
              {dateStr}
            </div>
          </div>
        )}
      </div>

      {/* Subtle divider */}
      <div className="relative z-10 mx-8 h-px" style={{ background: `linear-gradient(90deg, transparent, ${t.accent}30, transparent)` }} />

      {/* Content Area */}
      <div className="relative z-10 flex-1 overflow-hidden px-8 py-4">
        {children}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="relative z-10 px-8 py-3 flex items-center justify-between shrink-0" style={{ borderTop: `1px solid ${t.cardBorder}` }}>
          <span className="text-[9px] tracking-[4px] uppercase font-light" style={{ color: t.gold }}>
            {footerText || "Work like a boss"}
          </span>
          <div className="flex items-center gap-4">
            <span className="text-[8px] tracking-[3px] uppercase" style={{ color: t.textMuted }}>
              mrgreenoffices.nl
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export { THEMES };
export type { SignageLayoutProps };
