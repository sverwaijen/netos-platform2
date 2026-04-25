import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Home, Calendar, Wallet, Key, User,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/app" },
  { icon: Calendar, label: "Boekingen", path: "/app/bookings" },
  { icon: Wallet, label: "Wallet", path: "/app/wallet" },
  { icon: Key, label: "Toegang", path: "/app/access" },
  { icon: User, label: "Profiel", path: "/app/profile" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-[#111] flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#C4B89E]/20" />
          <div className="w-32 h-2 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-screen h-screen bg-[#111] flex flex-col items-center justify-center px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="w-16 h-16 rounded-full bg-[#C4B89E] flex items-center justify-center mb-6">
          <Key className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-light text-white mb-2">The Green</h1>
        <p className="text-white/40 text-sm text-center mb-8 max-w-xs">
          Log in om toegang te krijgen tot je werkplek, boekingen en wallet
        </p>
        <a
          href={getLoginUrl()}
          className="w-full max-w-xs py-3.5 rounded-xl bg-[#C4B89E] text-white font-medium text-sm text-center tracking-wider uppercase hover:bg-[#C4B89E]/90 transition-all block"
        >
          Inloggen
        </a>
        <button
          onClick={() => navigate("/")}
          className="mt-6 text-white/30 text-xs hover:text-white/50 transition-colors"
        >
          Terug naar website
        </button>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#111] flex flex-col overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Safe area top spacer */}
      <div className="flex-shrink-0" style={{ height: "env(safe-area-inset-top, 0px)" }} />

      {/* Content area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {children}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0d0d0d]/98 backdrop-blur-2xl border-t border-white/[0.06] z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto px-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path !== "/app" && location.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 px-4 min-w-[60px] transition-all ${
                  isActive ? "text-[#C4B89E]" : "text-white/30 active:text-white/50"
                }`}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute top-1 w-1 h-1 rounded-full bg-[#C4B89E]" />
                )}
                <Icon className={`w-[22px] h-[22px] transition-transform ${isActive ? "scale-105" : ""}`} strokeWidth={isActive ? 2.2 : 1.5} />
                <span className={`text-[10px] mt-0.5 ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
        {/* Safe area bottom spacer */}
        <div style={{ height: "env(safe-area-inset-bottom, 8px)", minHeight: "8px" }} />
      </nav>
    </div>
  );
}
