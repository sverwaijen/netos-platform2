import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { BRAND } from "@/lib/brand";
import SignageGymDisplay from "@/components/signage/SignageGymDisplay";
import SignageKitchenDisplay from "@/components/signage/SignageKitchenDisplay";
import SignageWayfindingDisplay from "@/components/signage/SignageWayfindingDisplay";
import SignageReceptionDisplay from "@/components/signage/SignageReceptionDisplay";
import SignageGenericDisplay from "@/components/signage/SignageGenericDisplay";
import SignageMenuDisplay from "@/components/signage/SignageMenuDisplay";
import SignageProvisioningScreen from "@/components/signage/SignageProvisioningScreen";

// ─── Parse URL params ──────────────────────────────────────────────
function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    screenId: params.get("screenId") ? parseInt(params.get("screenId")!) : null,
    token: params.get("token"),
    type: params.get("type"),
    locationId: params.get("locationId") ? parseInt(params.get("locationId")!) : null,
    demo: params.get("demo") === "true",
  };
}

export default function SignageDisplay() {
  const { screenId, token, type, locationId: paramLocationId, demo } = getParams();
  const [provisionedScreenId, setProvisionedScreenId] = useState<number | null>(null);
  const [time, setTime] = useState(new Date());

  const effectiveScreenId = screenId || provisionedScreenId;
  const isDemoMode = demo && type && paramLocationId;

  // ─── Screen config query (only when not in demo mode) ────────────
  const { data: config, refetch: refetchConfig } = trpc.signageDisplay.getScreenConfig.useQuery(
    { screenId: effectiveScreenId! },
    { enabled: !!effectiveScreenId && !isDemoMode, refetchInterval: 30000 }
  );

  // ─── Heartbeat ───────────────────────────────────────────────────
  const heartbeat = trpc.signageScreens.heartbeat.useMutation();

  // ─── Provisioning ────────────────────────────────────────────────
  const provision = trpc.signageScreens.provision.useMutation({
    onSuccess: (data) => {
      setProvisionedScreenId(data.screenId);
      localStorage.setItem("signage_screen_id", data.screenId.toString());
    },
  });

  // ─── Auto-provision on load ───────────────────────────────────────
  useEffect(() => {
    if (isDemoMode) return;
    if (!screenId && !provisionedScreenId) {
      const stored = localStorage.getItem("signage_screen_id");
      if (stored) {
        setProvisionedScreenId(parseInt(stored));
        return;
      }
      if (token) {
        provision.mutate({ token, ipAddress: undefined, userAgent: navigator.userAgent });
      }
    }
  }, [screenId, token, provisionedScreenId, isDemoMode]);

  // ─── Heartbeat every 60s ──────────────────────────────────────────
  useEffect(() => {
    if (!effectiveScreenId || isDemoMode) return;
    const interval = setInterval(() => {
      heartbeat.mutate({ screenId: effectiveScreenId, status: "online" });
    }, 60000);
    heartbeat.mutate({ screenId: effectiveScreenId, status: "online" });
    return () => clearInterval(interval);
  }, [effectiveScreenId, isDemoMode]);

  // ─── Clock ────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ═══ DEMO MODE ═══════════════════════════════════════════════════
  if (isDemoMode && type && paramLocationId) {
    const demoConfig = {
      screen: {
        id: 0,
        name: `Demo ${type}`,
        screenType: type,
        locationId: paramLocationId,
        status: "online",
        orientation: "portrait",
        brightness: 100,
        volume: 50,
      },
      location: { id: paramLocationId, name: "Demo Locatie" },
      playlist: null,
      items: [],
    };

    const displayProps = {
      config: demoConfig as any,
      time,
      locationId: paramLocationId,
      onRefresh: () => {},
      isDemo: true,
    };

    switch (type) {
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

  // ═══ PROVISIONING SCREEN ═════════════════════════════════════════
  if (!effectiveScreenId && !token) {
    return <SignageProvisioningScreen />;
  }

  // ═══ LOADING ═════════════════════════════════════════════════════
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

  // ═══ ROUTE TO DISPLAY ════════════════════════════════════════════
  const screenType = config.screen.screenType;
  const locationId = config.screen.locationId;

  const displayProps = {
    config,
    time,
    locationId,
    onRefresh: refetchConfig,
    isDemo: false,
  };

  switch (screenType) {
    case "gym":
      return <SignageGymDisplay {...displayProps} />;
    case "kitchen":
      return <SignageKitchenDisplay {...displayProps} />;
    case "menu":
      return <SignageMenuDisplay {...displayProps} />;
    case "wayfinding":
      return <SignageWayfindingDisplay {...displayProps} />;
    case "reception":
      return <SignageReceptionDisplay {...displayProps} />;
    default:
      return <SignageGenericDisplay {...displayProps} />;
  }
}
