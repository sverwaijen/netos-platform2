import { BRAND } from "@/lib/brand";
import { ReactNode } from "react";

interface SignageLayoutProps {
  children: ReactNode;
  theme?: "green" | "brown" | "dark";
  locationName?: string;
  time: Date;
  showLogo?: boolean;
  showClock?: boolean;
  showFooter?: boolean;
  footerText?: string;
}

const THEMES = {
  green: {
    bg: "linear-gradient(160deg, #1a2614 0%, #2d3a24 40%, #1a2614 100%)",
    accent: "#627653",
    accentLight: "#a8b89a",
    text: "#f5f2ea",
    textMuted: "rgba(245,242,234,0.5)",
    cardBg: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(255,255,255,0.06)",
  },
  brown: {
    bg: "linear-gradient(160deg, #1f1610 0%, #2d2018 40%, #1f1610 100%)",
    accent: "#c4a68a",
    accentLight: "#d4b8a0",
    text: "#f5f2ea",
    textMuted: "rgba(245,242,234,0.5)",
    cardBg: "rgba(255,255,255,0.04)",
    cardBorder: "rgba(255,255,255,0.06)",
  },
  dark: {
    bg: "linear-gradient(160deg, #0a0a0a 0%, #111111 40%, #0a0a0a 100%)",
    accent: "#627653",
    accentLight: "#a8b89a",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.4)",
    cardBg: "rgba(255,255,255,0.03)",
    cardBorder: "rgba(255,255,255,0.05)",
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
}: SignageLayoutProps) {
  const t = THEMES[theme];
  const timeStr = time.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ background: t.bg, color: t.text }}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-8 py-5 shrink-0">
        <div className="flex items-center gap-4">
          {showLogo && (
            <img src={BRAND.logo} alt="Mr. Green" className="h-6 opacity-70" />
          )}
          {locationName && (
            <span className="text-[11px] tracking-[3px] uppercase font-light" style={{ color: t.textMuted }}>
              {locationName}
            </span>
          )}
        </div>
        {showClock && (
          <div className="text-right">
            <div className="text-2xl font-extralight tracking-wider" style={{ color: t.accent }}>
              {timeStr}
            </div>
            <div className="text-[10px] tracking-[2px] uppercase" style={{ color: t.textMuted }}>
              {dateStr}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden px-8 pb-4">
        {children}
      </div>

      {/* Footer */}
      {showFooter && (
        <div className="px-8 py-3 flex items-center justify-between shrink-0" style={{ borderTop: `1px solid ${t.cardBorder}` }}>
          <span className="text-[9px] tracking-[3px] uppercase" style={{ color: t.textMuted }}>
            {footerText || "Work like a boss"}
          </span>
          <span className="text-[9px] tracking-[2px] uppercase" style={{ color: t.textMuted }}>
            mrgreenoffices.nl
          </span>
        </div>
      )}
    </div>
  );
}

export { THEMES };
export type { SignageLayoutProps };
