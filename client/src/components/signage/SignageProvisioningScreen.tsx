import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@/lib/brand";
import { Monitor, ChefHat, Dumbbell, MapPin, Layout } from "lucide-react";

export default function SignageProvisioningScreen() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const provision = trpc.signageScreens.provision.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("signage_screen_id", data.screenId.toString());
      window.location.href = `/signage/display?screenId=${data.screenId}`;
    },
    onError: (e) => {
      setError(e.message);
      setLoading(false);
    },
  });

  const handleProvision = () => {
    if (!token.trim()) return;
    setLoading(true);
    setError("");
    provision.mutate({ token: token.trim(), userAgent: navigator.userAgent });
  };

  const demoScreens = [
    { type: "reception", label: "Receptie", icon: Monitor, desc: "Content carousel & contact" },
    { type: "kitchen", label: "Keuken", icon: ChefHat, desc: "Menukaart & dagmenu" },
    { type: "gym", label: "Gym", icon: Dumbbell, desc: "Lesrooster & EGYM" },
    { type: "wayfinding", label: "Wayfinding", icon: MapPin, desc: "Wie is er vandaag?" },
    { type: "generic", label: "Generic", icon: Layout, desc: "Algemene content" },
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "linear-gradient(160deg, #1a2614 0%, #2d3a24 40%, #1a2614 100%)" }}>
      {/* Decorative waves */}
      <svg className="absolute top-0 left-0 w-full pointer-events-none" viewBox="0 0 1080 200" preserveAspectRatio="none" style={{ height: "18%", opacity: 0.1 }}>
        <path d="M0,120 C200,40 400,180 600,80 C800,-20 1000,100 1080,60 L1080,0 L0,0 Z" fill="#627653" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-full pointer-events-none" viewBox="0 0 1080 200" preserveAspectRatio="none" style={{ height: "12%", opacity: 0.08 }}>
        <path d="M0,40 C200,120 400,20 600,100 C800,180 1000,60 1080,120 L1080,200 L0,200 Z" fill="#627653" />
      </svg>

      <div className="relative z-10 w-full max-w-lg p-8">
        <div className="text-center mb-10">
          <img src={BRAND.logo} alt="Mr. Green" className="h-8 mx-auto mb-6 opacity-70" />
          <h1 className="text-[clamp(20px,3vw,28px)] font-black uppercase tracking-tight text-white mb-2">
            Scherm Activeren
          </h1>
          <p className="text-xs text-white/35 font-light">Voer het provisioning token in of start een demo</p>
        </div>

        {/* Token input */}
        <div className="space-y-3 mb-8">
          <div>
            <label className="text-[9px] text-white/35 tracking-[3px] uppercase font-semibold">Provisioning Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleProvision()}
              placeholder="SGN-xxxxxxxxxxxx"
              className="mt-1.5 w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white font-mono text-center text-lg tracking-wider focus:outline-none focus:border-[#627653] transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 text-center">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <button
            onClick={handleProvision}
            disabled={loading || !token.trim()}
            className="w-full bg-[#627653] text-white py-3 rounded-lg font-medium text-sm hover:bg-[#4a5a3f] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Activeren...
              </span>
            ) : "Scherm Activeren"}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[9px] tracking-[3px] uppercase text-white/20">of start demo</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Demo screen buttons */}
        <div className="grid grid-cols-5 gap-2">
          {demoScreens.map((screen) => (
            <a
              key={screen.type}
              href={`/signage/display?type=${screen.type}&locationId=1&demo=true`}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center hover:border-[#627653]/30 hover:bg-white/[0.05] transition-all group"
            >
              <screen.icon className="w-5 h-5 text-[#627653]/50 mx-auto mb-1.5 group-hover:text-[#627653] transition-colors" />
              <p className="text-[10px] font-medium text-white/70">{screen.label}</p>
              <p className="text-[8px] text-white/25 mt-0.5">{screen.desc}</p>
            </a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-[9px] text-white/15 tracking-[3px] uppercase">SKYNET Signage Platform</p>
        </div>
      </div>
    </div>
  );
}
