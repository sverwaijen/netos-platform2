import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Home, Calendar, Wallet, Key, Car, LifeBuoy, User,
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
      <div className="w-screen h-screen bg-[#111] flex items-center justify-center" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#627653]/20" />
          <div className="w-32 h-2 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-screen h-screen bg-[#111] flex flex-col items-center justify-center px-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <div className="w-16 h-16 rounded-full bg-[#627653] flex items-center justify-center mb-6">
          <Key className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-light text-white mb-2">Mr. Green</h1>
        <p className="text-white/40 text-sm text-center mb-8 max-w-xs">
          Log in om toegang te krijgen tot je werkplek, boekingen en wallet
        </p>
        <a
          href={getLoginUrl()}
          className="w-full max-w-xs py-3.5 rounded-xl bg-[#627653] text-white font-medium text-sm text-center tracking-wider uppercase hover:bg-[#627653]/90 transition-all block"
        >
          Inloggen
        </a>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#111] flex flex-col overflow-hidden" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      {/* Content area */}
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111]/95 backdrop-blur-xl border-t border-white/[0.06] px-2 pb-[env(safe-area-inset-bottom)] z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (item.path !== "/app" && location.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-3 px-3 transition-colors ${
                  isActive ? "text-[#627653]" : "text-white/40"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
