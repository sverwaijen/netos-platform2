import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@/lib/brand";

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
    provision.mutate({
      token: token.trim(),
      userAgent: navigator.userAgent,
    });
  };

  return (
    <div className="fixed inset-0 bg-[#1a2614] flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-12">
          <img src={BRAND.logo} alt="Mr. Green" className="h-10 mx-auto mb-8 opacity-80" />
          <h1 className="text-2xl font-extralight text-white/90 mb-2">
            Scherm <strong className="font-semibold">Provisioning</strong>
          </h1>
          <p className="text-sm text-white/40">Voer het provisioning token in om dit scherm te activeren</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-white/40 tracking-[3px] uppercase font-semibold">Provisioning Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleProvision()}
              placeholder="SGN-xxxxxxxxxxxx"
              className="mt-2 w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-4 py-3 text-white font-mono text-center text-lg tracking-wider focus:outline-none focus:border-[#627653] transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleProvision}
            disabled={loading || !token.trim()}
            className="w-full bg-[#627653] text-white py-3 rounded-lg font-medium hover:bg-[#4a5a3f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Activeren...
              </span>
            ) : (
              "Scherm Activeren"
            )}
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-white/20 tracking-[2px] uppercase">SKYNET Signage Platform</p>
        </div>
      </div>
    </div>
  );
}
