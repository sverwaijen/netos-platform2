import { trpc } from "@/lib/trpc";
import { useState, useEffect, useCallback } from "react";
import { BRAND } from "@/lib/brand";
import SignageGymDisplay from "@/components/signage/SignageGymDisplay";
import SignageKitchenDisplay from "@/components/signage/SignageKitchenDisplay";
import SignageWayfindingDisplay from "@/components/signage/SignageWayfindingDisplay";
import SignageReceptionDisplay from "@/components/signage/SignageReceptionDisplay";
import SignageGenericDisplay from "@/components/signage/SignageGenericDisplay";
import SignageProvisioningScreen from "@/components/signage/SignageProvisioningScreen";

// ─── Get screen ID from URL params ──────────────────────────────────
function getScreenId(): number | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("screenId");
  return id ? parseInt(id) : null;
}

function getProvisioningToken(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

export default function SignageDisplay() {
  const screenId = getScreenId();
  const token = getProvisioningToken();
  const [provisionedScreenId, setProvisionedScreenId] = useState<number | null>(null);
  const [time, setTime] = useState(new Date());

  const effectiveScreenId = screenId || provisionedScreenId;

  // ─── Screen config query ──────────────────────────────────────────
  const { data: config, refetch: refetchConfig } = trpc.signageDisplay.getScreenConfig.useQuery(
    { screenId: effectiveScreenId! },
    { enabled: !!effectiveScreenId, refetchInterval: 30000 }
  );

  // ─── Heartbeat mutation ───────────────────────────────────────────
  const heartbeat = trpc.signageScreens.heartbeat.useMutation();

  // ─── Provisioning mutation ────────────────────────────────────────
  const provision = trpc.signageScreens.provision.useMutation({
    onSuccess: (data) => {
      setProvisionedScreenId(data.screenId);
      // Store for future visits
      localStorage.setItem("signage_screen_id", data.screenId.toString());
    },
  });

  // ─── Auto-provision on load ───────────────────────────────────────
  useEffect(() => {
    if (!screenId && !provisionedScreenId) {
      // Check localStorage
      const stored = localStorage.getItem("signage_screen_id");
      if (stored) {
        setProvisionedScreenId(parseInt(stored));
        return;
      }
      // If we have a token, provision
      if (token) {
        provision.mutate({
          token,
          ipAddress: undefined,
          userAgent: navigator.userAgent,
        });
      }
    }
  }, [screenId, token, provisionedScreenId]);

  // ─── Send heartbeat every 60s ─────────────────────────────────────
  useEffect(() => {
    if (!effectiveScreenId) return;
    const interval = setInterval(() => {
      heartbeat.mutate({
        screenId: effectiveScreenId,
        status: "online",
      });
    }, 60000);
    // Send initial heartbeat
    heartbeat.mutate({ screenId: effectiveScreenId, status: "online" });
    return () => clearInterval(interval);
  }, [effectiveScreenId]);

  // ─── Clock ────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── No screen ID and no token → show provisioning screen ────────
  if (!effectiveScreenId && !token) {
    return <SignageProvisioningScreen />;
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (!config) {
    return (
      <div className="fixed inset-0 bg-[#1a2614] flex items-center justify-center">
        <div className="text-center">
          <img src={BRAND.logo} alt="Mr. Green" className="h-12 mx-auto mb-6 opacity-60" />
          <div className="w-8 h-8 border-2 border-[#627653] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#627653]/60 text-sm">Scherm laden...</p>
        </div>
      </div>
    );
  }

  // ─── Route to correct display based on screen type ────────────────
  const screenType = config.screen.screenType;
  const locationId = config.screen.locationId;

  const displayProps = {
    config,
    time,
    locationId,
    onRefresh: refetchConfig,
  };

  switch (screenType) {
    case "gym":
      return <SignageGymDisplay {...displayProps} />;
    case "kitchen":
      return <SignageKitchenDisplay {...displayProps} />;
    case "wayfinding":
      return <SignageWayfindingDisplay {...displayProps} />;
    case "reception":
      return <SignageReceptionDisplay {...displayProps} />;
    default:
      return <SignageGenericDisplay {...displayProps} />;
  }
}
