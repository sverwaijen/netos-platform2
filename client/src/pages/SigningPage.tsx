import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useMemo, useCallback } from "react";
import {
  Monitor, Building2, Plus, Search, Eye, Trash2, List,
  MapPin, ChefHat, Dumbbell, Navigation, AlertTriangle, CheckCircle2, XCircle, Clock, Zap,
  Copy, ExternalLink, FileImage, Video, Globe, Type, Edit3,
  ArrowUp, ArrowDown, Maximize2, X, Leaf, Wheat, Users,
  Layers, Sun, GripVertical, Settings, Link2, Play, RefreshCw,
  FileText, Upload, RotateCw, Smartphone, MonitorSmartphone, Image,
} from "lucide-react";

// ─── Constants ──────────────────────────────────────────────────────
type TabKey = "screens" | "content" | "playlists" | "wayfinding" | "kitchen" | "gym" | "provisioning";
const SCREEN_TYPES = ["reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking"] as const;
const CONTENT_TYPES = ["image", "video", "pdf", "html", "url", "announcement", "welcome_screen", "menu_card", "wayfinding", "gym_schedule", "weather", "clock", "news_ticker", "company_presence"] as const;
const MENU_CATEGORIES = ["breakfast", "lunch", "dinner", "snack", "drink", "soup", "salad", "sandwich", "special"] as const;
const GYM_CATEGORIES = ["cardio", "strength", "yoga", "pilates", "hiit", "cycling", "boxing", "stretching", "meditation", "egym"] as const;
const DAYS = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

const SCREEN_TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  reception: { icon: Navigation, color: "#627653", label: "Receptie" },
  gym: { icon: Dumbbell, color: "#1a2418", label: "Gym" },
  kitchen: { icon: ChefHat, color: "#B87333", label: "Keuken" },
  wayfinding: { icon: MapPin, color: "#4A7C59", label: "Wayfinding" },
  general: { icon: Monitor, color: "#627653", label: "Algemeen" },
  meeting_room: { icon: Building2, color: "#5B6B7C", label: "Vergaderruimte" },
  elevator: { icon: Layers, color: "#7C5B6B", label: "Lift" },
  parking: { icon: MapPin, color: "#6B7C5B", label: "Parking" },
};

const STATUS_META: Record<string, { color: string; icon: any; label: string }> = {
  online: { color: "#22c55e", icon: CheckCircle2, label: "Online" },
  offline: { color: "#dc2626", icon: XCircle, label: "Offline" },
  provisioning: { color: "#f59e0b", icon: Clock, label: "Provisioning" },
  maintenance: { color: "#6366f1", icon: Settings, label: "Onderhoud" },
  error: { color: "#dc2626", icon: AlertTriangle, label: "Error" },
};

const CONTENT_TYPE_META: Record<string, { icon: any; label: string }> = {
  image: { icon: FileImage, label: "Afbeelding" },
  video: { icon: Video, label: "Video" },
  pdf: { icon: FileText, label: "PDF" },
  html: { icon: Type, label: "HTML" },
  url: { icon: Globe, label: "URL" },
  announcement: { icon: Zap, label: "Aankondiging" },
  welcome_screen: { icon: Monitor, label: "Welkom" },
  menu_card: { icon: ChefHat, label: "Menukaart" },
  wayfinding: { icon: Navigation, label: "Wayfinding" },
  gym_schedule: { icon: Dumbbell, label: "Gym Rooster" },
  weather: { icon: Sun, label: "Weer" },
  clock: { icon: Clock, label: "Klok" },
  news_ticker: { icon: Type, label: "Nieuws" },
  company_presence: { icon: Building2, label: "Aanwezigheid" },
};

// ─── Screen Preview Component ───────────────────────────────────────
function ScreenPreview({ screenType, status }: { screenType: string; status: string }) {
  const meta = SCREEN_TYPE_META[screenType] || SCREEN_TYPE_META.general;
  const isOnline = status === "online";
  const themes: Record<string, { bg: string; accent: string; text: string }> = {
    reception: { bg: "bg-gradient-to-b from-[#2d3a24] to-[#4a5e3e]", accent: "#627653", text: "Welcome to Mr. Green" },
    gym: { bg: "bg-gradient-to-b from-[#1a2418] to-[#222d1e]", accent: "#3d4a32", text: "Exercise Made Easy" },
    kitchen: { bg: "bg-gradient-to-b from-[#3d2b1f] to-[#4a3728]", accent: "#B87333", text: "Daily Fresh Menu" },
    wayfinding: { bg: "bg-gradient-to-b from-[#2d3a24] to-[#3d5a2e]", accent: "#4A7C59", text: "Who is in today?" },
    general: { bg: "bg-gradient-to-b from-[#2d3a24] to-[#4a5e3e]", accent: "#627653", text: "Mr. Green" },
    meeting_room: { bg: "bg-gradient-to-b from-[#1e2530] to-[#2a3540]", accent: "#5B6B7C", text: "Meeting Room" },
    elevator: { bg: "bg-gradient-to-b from-[#2a1e2a] to-[#3a2e3a]", accent: "#7C5B6B", text: "Floor Guide" },
    parking: { bg: "bg-gradient-to-b from-[#2a3020] to-[#3a4030]", accent: "#6B7C5B", text: "Parking Info" },
  };
  const theme = themes[screenType] || themes.general;

  return (
    <div className={`relative w-full aspect-[9/16] rounded-lg overflow-hidden border border-white/[0.08] ${theme.bg} group`}>
      {/* Mini screen content */}
      <div className="absolute inset-0 flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between px-2 py-1.5" style={{ background: `${theme.accent}40` }}>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-[5px] text-white/50 font-medium tracking-wider uppercase">MR. GREEN</span>
          </div>
          <span className="text-[4px] text-white/30">12:00</span>
        </div>

        {/* Wave shape */}
        <svg viewBox="0 0 100 15" className="w-full opacity-30" preserveAspectRatio="none">
          <path d="M0,8 C25,0 75,15 100,5 L100,15 L0,15 Z" fill={theme.accent} />
        </svg>

        {/* Content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-3 gap-1">
          {screenType === "wayfinding" && (
            <>
              <div className="text-[5px] text-white/40 uppercase tracking-wider">Vandaag aanwezig</div>
              {[1,2,3].map(i => (
                <div key={i} className="w-full h-2 rounded-full bg-white/[0.06] flex items-center px-1 gap-0.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: `${theme.accent}80` }} />
                  <div className="flex-1 h-0.5 rounded bg-white/10" />
                </div>
              ))}
            </>
          )}
          {screenType === "kitchen" && (
            <>
              <div className="text-[5px] text-white/40 uppercase tracking-wider">Lunch Menu</div>
              <div className="grid grid-cols-2 gap-0.5 w-full">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-3 rounded-sm bg-white/[0.06]" />
                ))}
              </div>
            </>
          )}
          {screenType === "gym" && (
            <>
              <div className="text-[5px] text-white/40 uppercase tracking-wider">Vandaag</div>
              {[1,2,3].map(i => (
                <div key={i} className="w-full h-2.5 rounded bg-white/[0.06] flex items-center px-1 gap-0.5">
                  <div className="w-1 h-1 rounded-full bg-teal-400/40" />
                  <div className="flex-1 h-0.5 rounded bg-white/10" />
                  <div className="text-[3px] text-white/20">09:00</div>
                </div>
              ))}
            </>
          )}
          {!["wayfinding", "kitchen", "gym"].includes(screenType) && (
            <>
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center">
                <meta.icon className="w-3 h-3 text-white/20" />
              </div>
              <div className="text-[5px] text-white/40 text-center">{theme.text}</div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-2 py-1" style={{ background: `${theme.accent}30` }}>
          <div className="text-[3px] text-white/20 text-center">mrgreenoffices.nl</div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute top-1 right-1">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1">
        <Eye className="w-3 h-3 text-white/80" />
        <span className="text-[7px] text-white/80">Preview</span>
      </div>
    </div>
  );
}

// ─── Content Preview Thumbnail ──────────────────────────────────────
function ContentThumb({ type, url, title, size = "sm" }: { type: string; url?: string | null; title: string; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-full aspect-video" : "w-10 h-10";
  if ((type === "image" || type === "pdf") && url) {
    return (
      <div className={`${dim} rounded bg-white/[0.04] overflow-hidden flex-shrink-0`}>
        <img src={url} alt={title} className="w-full h-full object-cover" />
      </div>
    );
  }
  if (type === "video" && url) {
    return (
      <div className={`${dim} rounded bg-white/[0.04] overflow-hidden flex-shrink-0 relative`}>
        <video src={url} className="w-full h-full object-cover" muted />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Play className="w-4 h-4 text-white/80" />
        </div>
      </div>
    );
  }
  const meta = CONTENT_TYPE_META[type] || { icon: FileImage, label: type };
  const Icon = meta.icon;
  return (
    <div className={`${dim} rounded bg-white/[0.04] flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white/30" />
    </div>
  );
}

// ─── Orientation Toggle ────────────────────────────────────────────
function OrientationToggle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex bg-white/[0.04] rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => onChange("portrait")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] transition-all ${
          value === "portrait" ? "bg-[#627653]/30 text-[#627653]" : "text-[#888] hover:text-white"
        }`}
      >
        <Smartphone className="w-3 h-3" />
        Portrait
      </button>
      <button
        onClick={() => onChange("landscape")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] transition-all ${
          value === "landscape" ? "bg-[#627653]/30 text-[#627653]" : "text-[#888] hover:text-white"
        }`}
      >
        <MonitorSmartphone className="w-3 h-3" />
        Landscape
      </button>
    </div>
  );
}

// ─── Copy URL Helper ────────────────────────────────────────────────
function getDisplayUrl(screenId: number) {
  return `${window.location.origin}/signage/display?screenId=${screenId}`;
}
function getTestUrl(screenType: string, locationId: number) {
  return `${window.location.origin}/signage/display?type=${screenType}&locationId=${locationId}&demo=true`;
}

// ═════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ─────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════

export default function SigningPage() {
  const [tab, setTab] = useState<TabKey>("screens");
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedScreenType, setSelectedScreenType] = useState<string>("all");

  // Dialog states
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showCreateContent, setShowCreateContent] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showCreateBuilding, setShowCreateBuilding] = useState(false);
  const [showCreateMenuItem, setShowCreateMenuItem] = useState(false);
  const [showCreateGymClass, setShowCreateGymClass] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showAssignCompany, setShowAssignCompany] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<any>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
  const [editingGymClass, setEditingGymClass] = useState<any>(null);
  const [previewScreen, setPreviewScreen] = useState<any>(null);
  const [addItemToPlaylist, setAddItemToPlaylist] = useState<number | null>(null);

  // ─── Queries ─────────────────────────────────────────────────────
  const { data: locations } = trpc.locations.list.useQuery();
  const locId = selectedLocation !== "all" ? parseInt(selectedLocation) : undefined;

  const { data: screenStats } = trpc.signageScreens.stats.useQuery(locId ? { locationId: locId } : undefined);
  const { data: screens, refetch: refetchScreens } = trpc.signageScreens.list.useQuery({
    locationId: locId,
    screenType: selectedScreenType !== "all" ? selectedScreenType : undefined,
    search: search || undefined,
  });
  const { data: content, refetch: refetchContent } = trpc.signageContent.list.useQuery({
    locationId: locId,
    search: search || undefined,
  });
  const { data: playlists, refetch: refetchPlaylists } = trpc.signagePlaylists.list.useQuery({
    locationId: locId,
  });
  const { data: playlistDetail, refetch: refetchPlaylistDetail } = trpc.signagePlaylists.byId.useQuery(
    { id: selectedPlaylist! },
    { enabled: !!selectedPlaylist }
  );
  const { data: buildings, refetch: refetchBuildings } = trpc.wayfinding.buildings.useQuery(locId ? { locationId: locId } : undefined);
  const { data: companyAssignments, refetch: refetchAssignments } = trpc.wayfinding.companyAssignments.useQuery();
  const { data: provisioningTemplates } = trpc.signageProvisioning.list.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();
  const { data: menuItems, refetch: refetchMenu } = trpc.kitchenMenu.list.useQuery(
    { locationId: locId || 0 },
    { enabled: !!locId }
  );
  const { data: gymClasses, refetch: refetchGym } = trpc.gymSchedule.list.useQuery(
    { locationId: locId || 0 },
    { enabled: !!locId }
  );

  const utils = trpc.useUtils();

  // ─── Mutations ───────────────────────────────────────────────────
  const createScreen = trpc.signageScreens.create.useMutation({
    onSuccess: (d) => { toast.success(`Scherm aangemaakt. Token: ${d.provisioningToken}`); setShowCreateScreen(false); refetchScreens(); },
    onError: (e) => toast.error(e.message),
  });
  const updateScreen = trpc.signageScreens.update.useMutation({
    onSuccess: () => { toast.success("Scherm bijgewerkt"); refetchScreens(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteScreen = trpc.signageScreens.delete.useMutation({
    onSuccess: () => { toast.success("Scherm verwijderd"); refetchScreens(); setSelectedScreen(null); },
    onError: (e) => toast.error(e.message),
  });
  const rebootScreen = trpc.signageScreens.reboot.useMutation({
    onSuccess: () => toast.success("Reboot commando verzonden"),
    onError: (e) => toast.error(e.message),
  });
  const assignPlaylist = trpc.signageScreens.assignPlaylist.useMutation({
    onSuccess: () => { toast.success("Playlist toegewezen"); refetchScreens(); },
    onError: (e) => toast.error(e.message),
  });
  const createContent = trpc.signageContent.create.useMutation({
    onSuccess: () => { toast.success("Content aangemaakt"); setShowCreateContent(false); refetchContent(); },
    onError: (e) => toast.error(e.message),
  });
  const updateContent = trpc.signageContent.update.useMutation({
    onSuccess: () => { toast.success("Content bijgewerkt"); setEditingContent(null); refetchContent(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteContent = trpc.signageContent.delete.useMutation({
    onSuccess: () => { toast.success("Content verwijderd"); refetchContent(); },
    onError: (e) => toast.error(e.message),
  });
  const createPlaylist = trpc.signagePlaylists.create.useMutation({
    onSuccess: (d) => { toast.success("Playlist aangemaakt"); setShowCreatePlaylist(false); refetchPlaylists(); if (d.id) setSelectedPlaylist(d.id); },
    onError: (e) => toast.error(e.message),
  });
  const addPlaylistItem = trpc.signagePlaylists.addItem.useMutation({
    onSuccess: () => { toast.success("Item toegevoegd"); refetchPlaylistDetail(); setAddItemToPlaylist(null); },
    onError: (e) => toast.error(e.message),
  });
  const removePlaylistItem = trpc.signagePlaylists.removeItem.useMutation({
    onSuccess: () => { toast.success("Item verwijderd"); refetchPlaylistDetail(); },
    onError: (e) => toast.error(e.message),
  });
  const reorderPlaylistItems = trpc.signagePlaylists.reorderItems.useMutation({
    onSuccess: () => refetchPlaylistDetail(),
    onError: (e) => toast.error(e.message),
  });
  const createBuilding = trpc.wayfinding.createBuilding.useMutation({
    onSuccess: () => { toast.success("Gebouw aangemaakt"); setShowCreateBuilding(false); refetchBuildings(); },
    onError: (e) => toast.error(e.message),
  });
  const assignCompany = trpc.wayfinding.assignCompany.useMutation({
    onSuccess: () => { toast.success("Bedrijf toegewezen"); setShowAssignCompany(false); refetchAssignments(); },
    onError: (e) => toast.error(e.message),
  });
  const removeAssignment = trpc.wayfinding.removeAssignment.useMutation({
    onSuccess: () => { toast.success("Toewijzing verwijderd"); refetchAssignments(); },
    onError: (e) => toast.error(e.message),
  });
  const createMenuItem = trpc.kitchenMenu.create.useMutation({
    onSuccess: () => { toast.success("Menu item aangemaakt"); setShowCreateMenuItem(false); refetchMenu(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMenuItem = trpc.kitchenMenu.update.useMutation({
    onSuccess: () => { toast.success("Menu item bijgewerkt"); setEditingMenuItem(null); refetchMenu(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMenuItem = trpc.kitchenMenu.delete.useMutation({
    onSuccess: () => { toast.success("Menu item verwijderd"); refetchMenu(); },
    onError: (e) => toast.error(e.message),
  });
  const createGymClass = trpc.gymSchedule.create.useMutation({
    onSuccess: () => { toast.success("Les aangemaakt"); setShowCreateGymClass(false); refetchGym(); },
    onError: (e) => toast.error(e.message),
  });
  const updateGymClass = trpc.gymSchedule.update.useMutation({
    onSuccess: () => { toast.success("Les bijgewerkt"); setEditingGymClass(null); refetchGym(); },
    onError: (e) => toast.error(e.message),
  });
  const createTemplate = trpc.signageProvisioning.create.useMutation({
    onSuccess: () => { toast.success("Template aangemaakt"); setShowCreateTemplate(false); utils.signageProvisioning.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const checkIn = trpc.wayfinding.checkIn.useMutation({
    onSuccess: () => { toast.success("Ingecheckt"); },
    onError: (e) => toast.error(e.message),
  });
  const checkOut = trpc.wayfinding.checkOut.useMutation({
    onSuccess: () => { toast.success("Uitgecheckt"); },
    onError: (e) => toast.error(e.message),
  });

  // ─── Form States ────────────────────────────────────────────────
  const [screenForm, setScreenForm] = useState({ name: "", screenType: "reception", locationId: 0, orientation: "portrait", floor: "", zone: "" });
  const [contentForm, setContentForm] = useState({ title: "", contentType: "image" as string, mediaUrl: "", htmlContent: "", externalUrl: "", duration: 15, locationId: 0, priority: 0, templateData: {} as Record<string, unknown> });
  const [playlistForm, setPlaylistForm] = useState({ name: "", description: "", screenType: "reception", locationId: 0 });
  const [buildingForm, setBuildingForm] = useState({ name: "", code: "", address: "", floors: 1, locationId: 0 });
  const [assignForm, setAssignForm] = useState({ companyId: 0, buildingId: 0, floor: "", roomNumber: "" });
  const [menuForm, setMenuForm] = useState({ name: "", description: "", category: "lunch" as string, price: "", locationId: 0, isVegan: false, isVegetarian: false });
  const [gymForm, setGymForm] = useState({ className: "", instructor: "", category: "cardio" as string, dayOfWeek: new Date().getDay(), startTime: "09:00", endTime: "10:00", maxParticipants: 20, locationId: 0 });
  const [templateForm, setTemplateForm] = useState({ name: "", screenType: "reception", defaultOrientation: "portrait", defaultResolution: "1080x1920", defaultBrightness: 100 });

  const tabs: { key: TabKey; label: string; icon: any; count?: number }[] = [
    { key: "screens", label: "Schermen", icon: Monitor, count: screenStats?.total || 0 },
    { key: "content", label: "Content", icon: FileImage, count: content?.length || 0 },
    { key: "playlists", label: "Playlists", icon: List, count: playlists?.length || 0 },
    { key: "wayfinding", label: "Wayfinding", icon: Navigation },
    { key: "kitchen", label: "Keuken", icon: ChefHat },
    { key: "gym", label: "Gym", icon: Dumbbell },
    { key: "provisioning", label: "Provisioning", icon: Zap },
  ];

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} gekopieerd`);
  }, []);

  // ═════════════════════════════════════════════════════════════════
  // ─── RENDER ───────────────────────────────────────────────────────
  // ═════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">SKYNET Digital Signage</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Signage <strong className="font-semibold">platform.</strong>
        </h1>
        <p className="text-sm text-[#888] font-light mt-2 max-w-lg">
          Centraal beheer van {screenStats?.total || 0} schermen over alle locaties.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Totaal", value: screenStats?.total || 0, icon: Monitor, color: "#627653" },
          { label: "Online", value: screenStats?.online || 0, icon: CheckCircle2, color: "#22c55e" },
          { label: "Offline", value: screenStats?.offline || 0, icon: XCircle, color: "#dc2626" },
          { label: "Provisioning", value: screenStats?.provisioning || 0, icon: Clock, color: "#f59e0b" },
          { label: "Error", value: screenStats?.error || 0, icon: AlertTriangle, color: "#ef4444" },
          { label: "Onderhoud", value: screenStats?.maintenance || 0, icon: Settings, color: "#6366f1" },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-[#111] border-white/[0.06] hover:border-white/[0.12] transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.color }} />
                <span className="text-[10px] text-[#888] tracking-[2px] uppercase">{kpi.label}</span>
              </div>
              <div className="text-2xl font-light" style={{ color: kpi.color }}>{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Tabs */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedPlaylist(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${
                tab === t.key ? "bg-[#627653]/20 text-[#627653]" : "text-[#888] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && <span className="text-[9px] opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#888]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoeken..." className="pl-8 h-8 w-48 bg-white/[0.03] border-white/[0.06] text-xs" />
          </div>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="h-8 w-40 bg-white/[0.03] border-white/[0.06] text-xs"><SelectValue placeholder="Alle locaties" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle locaties</SelectItem>
              {(locations || []).map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="min-h-[400px]">

      {/* ═══ SCREENS TAB ═══ */}
      {tab === "screens" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <h2 className="text-lg font-light">Schermen</h2>
              <Select value={selectedScreenType} onValueChange={setSelectedScreenType}>
                <SelectTrigger className="h-7 w-36 bg-white/[0.03] border-white/[0.06] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle types</SelectItem>
                  {SCREEN_TYPES.map(t => <SelectItem key={t} value={t}>{SCREEN_TYPE_META[t]?.label || t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setShowCreateScreen(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f] text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Nieuw scherm
            </Button>
          </div>

          {/* Screen Grid with Previews */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {(screens || []).map((screen: any) => {
              const meta = SCREEN_TYPE_META[screen.screenType] || SCREEN_TYPE_META.general;
              const statusMeta = STATUS_META[screen.status] || STATUS_META.offline;
              return (
                <div key={screen.id} className="group cursor-pointer" onClick={() => setSelectedScreen(screen)}>
                  {/* Preview */}
                  <ScreenPreview screenType={screen.screenType} status={screen.status} />

                  {/* Info below preview */}
                  <div className="mt-2 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusMeta.color }} />
                      <p className="text-[11px] font-medium truncate">{screen.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <meta.icon className="w-2.5 h-2.5 text-[#888]" />
                      <span className="text-[9px] text-[#888]">{meta.label}</span>
                      {screen.floor && <span className="text-[9px] text-[#888]">V{screen.floor}</span>}
                    </div>
                  </div>

                  {/* Quick actions on hover */}
                  <div className="flex gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[8px]" onClick={(e) => {
                      e.stopPropagation();
                      window.open(getDisplayUrl(screen.id), "_blank");
                    }}>
                      <ExternalLink className="w-2.5 h-2.5 mr-0.5" />Open
                    </Button>
                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[8px]" onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(getDisplayUrl(screen.id), "URL");
                    }}>
                      <Copy className="w-2.5 h-2.5 mr-0.5" />URL
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {(!screens || screens.length === 0) && (
            <div className="text-center py-16">
              <Monitor className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">Nog geen schermen geconfigureerd</p>
              <Button onClick={() => setShowCreateScreen(true)} variant="outline" className="mt-4 text-xs border-white/10">
                <Plus className="w-3.5 h-3.5 mr-1.5" />Eerste scherm aanmaken
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ═══ CONTENT TAB ═══ */}
      {tab === "content" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Content Library</h2>
            <Button onClick={() => setShowCreateContent(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f] text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Nieuwe content
            </Button>
          </div>

          {/* Visual Grid View */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {(content || []).map((item: any) => {
              const meta = CONTENT_TYPE_META[item.contentType] || { icon: FileImage, label: item.contentType };
              const Icon = meta.icon;
              return (
                <div key={item.id} className="group cursor-pointer" onClick={() => setEditingContent(item)}>
                  {/* Preview */}
                  <div className="relative aspect-[9/16] rounded-xl overflow-hidden border border-white/[0.08] hover:border-[#627653]/30 transition-all bg-[#111]">
                    {(item.contentType === "image" || item.contentType === "pdf") && item.mediaUrl ? (
                      <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : item.contentType === "video" && item.mediaUrl ? (
                      <>
                        <video src={item.mediaUrl} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-8 h-8 text-white/80" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-white/[0.02] to-transparent">
                        <Icon className="w-8 h-8 text-white/15" />
                        <span className="text-[8px] text-white/20 tracking-[2px] uppercase">{meta.label}</span>
                      </div>
                    )}
                    {/* Type badge */}
                    <div className="absolute top-1.5 left-1.5">
                      <Badge variant="outline" className="text-[7px] bg-black/60 backdrop-blur-sm border-white/10">{meta.label}</Badge>
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-1.5 right-1.5">
                      <span className="text-[8px] bg-black/60 backdrop-blur-sm text-white/60 px-1.5 py-0.5 rounded">{item.duration}s</span>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                      <Edit3 className="w-4 h-4 text-white" />
                      <span className="text-[10px] text-white">Bewerken</span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="mt-1.5 px-0.5">
                    <p className="text-[11px] font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.priority > 0 && <span className="text-[8px] text-[#627653]">P{item.priority}</span>}
                    </div>
                  </div>
                  {/* Quick delete on hover */}
                  <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[8px] text-red-400 hover:text-red-300" onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Content verwijderen?")) deleteContent.mutate({ id: item.id });
                    }}>
                      <Trash2 className="w-2.5 h-2.5 mr-0.5" />Verwijder
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {(!content || content.length === 0) && (
            <div className="text-center py-16">
              <FileImage className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">Nog geen content items</p>
              <p className="text-xs text-[#888] font-light mt-1">Upload afbeeldingen, video's, PDF's of maak HTML content aan</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ PLAYLISTS TAB ═══ */}
      {tab === "playlists" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Playlists</h2>
            <Button onClick={() => setShowCreatePlaylist(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f] text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Nieuwe playlist
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Playlist list */}
            <div className="space-y-2">
              {(playlists || []).map((pl: any) => {
                const isSelected = selectedPlaylist === pl.id;
                const meta = SCREEN_TYPE_META[pl.screenType] || SCREEN_TYPE_META.general;
                return (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlaylist(pl.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected ? "bg-[#627653]/10 border-[#627653]/30" : "bg-[#111] border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
                      <p className="text-sm font-light flex-1 truncate">{pl.name}</p>
                      <Badge variant="outline" className="text-[8px]">{pl.itemCount || 0} items</Badge>
                    </div>
                    {pl.description && <p className="text-[10px] text-[#888] mt-1 truncate">{pl.description}</p>}
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-[#888]">
                      <span>{meta.label}</span>
                      <span>{pl.screenCount || 0} schermen</span>
                    </div>
                  </div>
                );
              })}
              {(!playlists || playlists.length === 0) && (
                <div className="text-center py-8">
                  <List className="w-6 h-6 text-[#888] mx-auto mb-2 opacity-30" />
                  <p className="text-xs text-[#888]">Geen playlists</p>
                </div>
              )}
            </div>

            {/* Playlist detail / editor */}
            <div className="lg:col-span-2">
              {selectedPlaylist && playlistDetail ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{playlistDetail.name}</h3>
                      <p className="text-[10px] text-[#888]">{playlistDetail.items?.length || 0} items in deze playlist</p>
                    </div>
                    <Button onClick={() => setAddItemToPlaylist(selectedPlaylist)} className="bg-[#627653] text-white hover:bg-[#4a5a3f] text-xs h-7">
                      <Plus className="w-3 h-3 mr-1" />Item toevoegen
                    </Button>
                  </div>

                  {/* Playlist items */}
                  <div className="space-y-1">
                    {(playlistDetail.items || []).map((item: any, idx: number) => {
                      const meta = CONTENT_TYPE_META[item.contentType] || { icon: FileImage, label: item.contentType };
                      const Icon = meta.icon;
                      return (
                        <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-[#111] border border-white/[0.06] group">
                          <div className="flex flex-col gap-0.5">
                            <button
                              className="text-[#888] hover:text-white disabled:opacity-20"
                              disabled={idx === 0}
                              onClick={() => {
                                const ids = (playlistDetail.items || []).map((i: any) => i.id);
                                [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
                                reorderPlaylistItems.mutate({ playlistId: selectedPlaylist!, itemIds: ids });
                              }}
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              className="text-[#888] hover:text-white disabled:opacity-20"
                              disabled={idx === (playlistDetail.items || []).length - 1}
                              onClick={() => {
                                const ids = (playlistDetail.items || []).map((i: any) => i.id);
                                [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
                                reorderPlaylistItems.mutate({ playlistId: selectedPlaylist!, itemIds: ids });
                              }}
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <span className="text-[9px] text-[#888] w-4 text-center">{idx + 1}</span>
                          <ContentThumb type={item.contentType} url={item.mediaUrl} title={item.contentTitle || ""} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">{item.contentTitle}</p>
                            <div className="flex items-center gap-2 text-[9px] text-[#888]">
                              <Icon className="w-2.5 h-2.5" />
                              <span>{meta.label}</span>
                              <span>{item.durationOverride || item.duration || 15}s</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost" size="sm"
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100"
                            onClick={() => removePlaylistItem.mutate({ id: item.id })}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {(!playlistDetail.items || playlistDetail.items.length === 0) && (
                    <div className="text-center py-8 border border-dashed border-white/[0.08] rounded-lg">
                      <Play className="w-6 h-6 text-[#888] mx-auto mb-2 opacity-30" />
                      <p className="text-xs text-[#888]">Geen items in playlist</p>
                      <Button onClick={() => setAddItemToPlaylist(selectedPlaylist)} variant="outline" className="mt-2 text-xs h-7 border-white/10">
                        <Plus className="w-3 h-3 mr-1" />Eerste item toevoegen
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center py-16">
                  <div>
                    <List className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-20" />
                    <p className="text-xs text-[#888]">Selecteer een playlist om items te beheren</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ WAYFINDING TAB ═══ */}
      {tab === "wayfinding" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Wayfinding & Gebouwen</h2>
            <div className="flex gap-2">
              <Button onClick={() => setShowAssignCompany(true)} variant="outline" className="text-xs h-8 border-white/10">
                <Building2 className="w-3.5 h-3.5 mr-1.5" />Bedrijf toewijzen
              </Button>
              <Button onClick={() => setShowCreateBuilding(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f] text-xs h-8">
                <Plus className="w-3.5 h-3.5 mr-1.5" />Nieuw gebouw
              </Button>
            </div>
          </div>

          {/* Test URL */}
          {locId && (
            <Card className="bg-[#111] border-white/[0.06]">
              <CardContent className="p-4 flex items-center gap-3">
                <Link2 className="w-4 h-4 text-[#627653]" />
                <div className="flex-1">
                  <p className="text-[10px] text-[#888] tracking-[2px] uppercase mb-0.5">Wayfinding Test URL</p>
                  <code className="text-xs text-[#627653]">{getTestUrl("wayfinding", locId)}</code>
                </div>
                <Button variant="ghost" size="sm" className="h-7" onClick={() => copyToClipboard(getTestUrl("wayfinding", locId), "URL")}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7" onClick={() => window.open(getTestUrl("wayfinding", locId), "_blank")}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(buildings || []).map((b: any) => {
              const assigned = (companyAssignments || []).filter((a: any) => a.buildingId === b.id);
              return (
                <Card key={b.id} className="bg-[#111] border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all">
                  <div className="h-1.5 bg-[#4A7C59]" />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded bg-[#4A7C59]/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#4A7C59]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-light">{b.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {b.code && <Badge variant="outline" className="text-[9px]">{b.code}</Badge>}
                          <span className="text-[10px] text-[#888]">{b.floors} verdieping{b.floors !== 1 ? "en" : ""}</span>
                        </div>
                      </div>
                    </div>
                    {b.address && <p className="text-[11px] text-[#888] mb-3">{b.address}</p>}

                    {/* Assigned companies */}
                    <div className="space-y-1.5">
                      {assigned.map((a: any) => (
                        <div key={a.id} className="flex items-center gap-2 text-[11px] p-1.5 rounded bg-white/[0.02] group">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#627653]" />
                          <span className="flex-1 truncate">{a.companyName}</span>
                          {a.floor && <span className="text-[#888]">V{a.floor}</span>}
                          {a.roomNumber && <span className="text-[#888]">K{a.roomNumber}</span>}
                          <button
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"
                            onClick={() => removeAssignment.mutate({ id: a.id })}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {assigned.length === 0 && (
                        <p className="text-[10px] text-[#888] italic">Geen bedrijven toegewezen</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {(!buildings || buildings.length === 0) && (
            <div className="text-center py-16">
              <Building2 className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">Nog geen gebouwen. Selecteer eerst een locatie.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ KITCHEN TAB ═══ */}
      {tab === "kitchen" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Keuken Menu</h2>
            <div className="flex gap-2">
              {locId && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => window.open(getTestUrl("kitchen", locId), "_blank")}>
                  <Eye className="w-3.5 h-3.5 mr-1.5" />Preview
                </Button>
              )}
              <Button onClick={() => { setMenuForm({ ...menuForm, locationId: locId || 0 }); setShowCreateMenuItem(true); }} className="bg-[#B87333] text-white hover:bg-[#9A6028] text-xs h-8" disabled={!locId}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />Nieuw item
              </Button>
            </div>
          </div>

          {!locId && (
            <div className="text-center py-12">
              <ChefHat className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">Selecteer een locatie om het menu te beheren</p>
            </div>
          )}

          {locId && (
            <div className="space-y-4">
              {MENU_CATEGORIES.map(cat => {
                const items = (menuItems || []).filter((m: any) => m.category === cat);
                if (items.length === 0) return null;
                return (
                  <div key={cat}>
                    <h3 className="text-xs font-semibold tracking-[2px] uppercase text-[#B87333] mb-2">{cat}</h3>
                    <div className="space-y-1">
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 p-2.5 rounded bg-[#111] border border-white/[0.06] hover:border-white/[0.12] group">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-[#B87333]/10 flex items-center justify-center">
                              <ChefHat className="w-4 h-4 text-[#B87333]/40" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-light">{item.name}</p>
                              {item.isVegan && <Leaf className="w-3 h-3 text-green-400" />}
                              {item.isVegetarian && <Wheat className="w-3 h-3 text-amber-400" />}
                            </div>
                            {item.description && <p className="text-[10px] text-[#888] truncate">{item.description}</p>}
                          </div>
                          {item.price && <span className="text-sm text-[#B87333]">{item.price}</span>}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingMenuItem(item)}>
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400" onClick={() => {
                              if (confirm("Verwijderen?")) deleteMenuItem.mutate({ id: item.id });
                            }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(menuItems || []).length === 0 && (
                <div className="text-center py-12">
                  <ChefHat className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-[#888] font-light">Nog geen menu items voor deze locatie</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ GYM TAB ═══ */}
      {tab === "gym" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Gym Rooster</h2>
            <div className="flex gap-2">
              {locId && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => window.open(getTestUrl("gym", locId), "_blank")}>
                  <Eye className="w-3.5 h-3.5 mr-1.5" />Preview
                </Button>
              )}
              <Button onClick={() => { setGymForm({ ...gymForm, locationId: locId || 0 }); setShowCreateGymClass(true); }} className="bg-[#1a2418] text-white hover:bg-[#222d1e] text-xs h-8 border border-teal-500/20" disabled={!locId}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />Nieuwe les
              </Button>
            </div>
          </div>

          {!locId && (
            <div className="text-center py-12">
              <Dumbbell className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">Selecteer een locatie om het gym rooster te beheren</p>
            </div>
          )}

          {locId && (
            <div className="space-y-4">
              {DAYS.map((day, dayIdx) => {
                const classes = (gymClasses || []).filter((c: any) => c.dayOfWeek === dayIdx);
                if (classes.length === 0) return null;
                return (
                  <div key={dayIdx}>
                    <h3 className="text-xs font-semibold tracking-[2px] uppercase text-teal-400 mb-2">{day}</h3>
                    <div className="space-y-1">
                      {classes.map((cls: any) => (
                        <div key={cls.id} className="flex items-center gap-3 p-2.5 rounded bg-[#111] border border-white/[0.06] hover:border-white/[0.12] group">
                          <div className="w-10 h-10 rounded bg-teal-500/10 flex items-center justify-center">
                            <Dumbbell className="w-4 h-4 text-teal-400/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-light">{cls.className}</p>
                              <Badge variant="outline" className="text-[8px] capitalize">{cls.category}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#888]">
                              <span>{cls.startTime} - {cls.endTime}</span>
                              {cls.instructor && <span>{cls.instructor}</span>}
                              {cls.maxParticipants && <span><Users className="w-2.5 h-2.5 inline mr-0.5" />{cls.maxParticipants}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingGymClass(cls)}>
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {(gymClasses || []).length === 0 && (
                <div className="text-center py-12">
                  <Dumbbell className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-[#888] font-light">Nog geen lessen voor deze locatie</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ PROVISIONING TAB ═══ */}
      {tab === "provisioning" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Auto-Provisioning</h2>
            <Button onClick={() => setShowCreateTemplate(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f] text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1.5" />Nieuw template
            </Button>
          </div>

          {/* Visual Preview Cards with Live Iframes */}
          <div>
            <h3 className="text-xs font-semibold tracking-[2px] uppercase text-[#627653] mb-4">Schermtype Previews</h3>
            <p className="text-[10px] text-[#888] mb-4">Klik op een preview om het scherm fullscreen te openen. Kopieer de URL om het op een fysiek scherm te laden.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {SCREEN_TYPES.slice(0, 5).map(type => {
                const meta = SCREEN_TYPE_META[type];
                const url = locId ? getTestUrl(type, locId) : getTestUrl(type, 1);
                return (
                  <div key={type} className="group">
                    <div
                      className="relative bg-black rounded-xl overflow-hidden border border-white/[0.08] hover:border-[#627653]/40 transition-all cursor-pointer shadow-lg hover:shadow-xl"
                      style={{ aspectRatio: '9/16' }}
                      onClick={() => window.open(url, "_blank")}
                    >
                      <iframe
                        src={url}
                        className="w-full h-full border-0 pointer-events-none"
                        title={`Preview: ${meta.label}`}
                        loading="lazy"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                        <Maximize2 className="w-5 h-5 text-white" />
                        <span className="text-xs text-white font-medium">Open fullscreen</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <meta.icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                        <span className="text-xs font-light">{meta.label}</span>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); copyToClipboard(url, "URL"); }}>
                          <Copy className="w-2.5 h-2.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); copyToClipboard(url, "URL"); window.open(url, "_blank"); }}>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Button>
                      </div>
                    </div>
                    <code className="text-[8px] text-[#627653]/60 truncate block mt-0.5">{url}</code>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(provisioningTemplates || []).map((tpl: any) => {
              const meta = SCREEN_TYPE_META[tpl.screenType] || SCREEN_TYPE_META.general;
              return (
                <Card key={tpl.id} className="bg-[#111] border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all">
                  <div className="h-1.5" style={{ background: meta.color }} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: `${meta.color}20` }}>
                        <meta.icon className="w-5 h-5" style={{ color: meta.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-light">{tpl.name}</p>
                        <Badge variant="outline" className="text-[9px] mt-1 capitalize" style={{ borderColor: `${meta.color}40`, color: meta.color }}>
                          {meta.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-[11px] text-[#888]">
                      <div>Orientatie: {tpl.defaultOrientation}</div>
                      <div>Resolutie: {tpl.defaultResolution}</div>
                      <div>Helderheid: {tpl.defaultBrightness}%</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* How it works */}
          <Card className="bg-[#111] border-white/[0.06]">
            <CardContent className="p-6">
              <h3 className="text-xs font-semibold tracking-[2px] uppercase text-[#627653] mb-4">Hoe het werkt</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Optie 1: Token Provisioning</h4>
                  <div className="space-y-2">
                    {["Maak scherm aan in admin", "Kopieer het provisioning token", "Open /signage/display op het scherm", "Voer token in — scherm configureert automatisch"].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-[#888]">
                        <div className="w-5 h-5 rounded-full bg-[#627653]/20 text-[#627653] flex items-center justify-center text-[9px] font-semibold">{i + 1}</div>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Optie 2: Direct URL</h4>
                  <div className="space-y-2">
                    {["Kopieer de test URL voor het gewenste type", "Open de URL op het scherm of in een browser", "Display laadt direct met demo content", "Koppel later aan een echt scherm via admin"].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-[#888]">
                        <div className="w-5 h-5 rounded-full bg-[#627653]/20 text-[#627653] flex items-center justify-center text-[9px] font-semibold">{i + 1}</div>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── DIALOGS ─────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* ═══ SCREEN DETAIL DIALOG ═══ */}
      <Dialog open={!!selectedScreen} onOpenChange={(open) => { if (!open) setSelectedScreen(null); }}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-light text-lg flex items-center gap-3">
              {selectedScreen && (() => {
                const meta = SCREEN_TYPE_META[selectedScreen.screenType] || SCREEN_TYPE_META.general;
                return <meta.icon className="w-5 h-5" style={{ color: meta.color }} />;
              })()}
              {selectedScreen?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedScreen && (
            <div className="space-y-5">
              <div className="grid grid-cols-5 gap-5">
                {/* Live Preview - large iframe */}
                <div className="col-span-2 flex flex-col">
                  <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-2">Live Preview</div>
                  <div className="relative bg-black rounded-xl overflow-hidden border border-white/[0.08] shadow-2xl" style={{ aspectRatio: selectedScreen.orientation === 'landscape' ? '16/9' : '9/16' }}>
                    <iframe
                      src={`${getTestUrl(selectedScreen.screenType, selectedScreen.locationId || 1)}`}
                      className="w-full h-full border-0"
                      title={`Preview: ${selectedScreen.name}`}
                      style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
                    />
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-[10px] h-7" onClick={() => window.open(getDisplayUrl(selectedScreen.id), "_blank")}>
                      <Maximize2 className="w-3 h-3 mr-1" />Volledig scherm
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 text-[10px] h-7" onClick={() => window.open(getTestUrl(selectedScreen.screenType, selectedScreen.locationId || 1), "_blank")}>
                      <Eye className="w-3 h-3 mr-1" />Demo
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="col-span-3 grid grid-cols-2 gap-3 content-start">
                  <div className="bg-white/[0.02] rounded p-3">
                    <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-1">Status</div>
                    {(() => {
                      const s = STATUS_META[selectedScreen.status] || STATUS_META.offline;
                      return <div className="flex items-center gap-1.5"><s.icon className="w-3.5 h-3.5" style={{ color: s.color }} /><span className="text-sm" style={{ color: s.color }}>{s.label}</span></div>;
                    })()}
                  </div>
                  <div className="bg-white/[0.02] rounded p-3">
                    <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-1">Type</div>
                    <div className="text-sm capitalize">{SCREEN_TYPE_META[selectedScreen.screenType]?.label || selectedScreen.screenType}</div>
                  </div>
                  <div className="bg-white/[0.02] rounded p-3">
                    <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-1">IP Adres</div>
                    <div className="text-sm font-mono">{selectedScreen.ipAddress || "—"}</div>
                  </div>
                  <div className="bg-white/[0.02] rounded p-3">
                    <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-1">Laatste heartbeat</div>
                    <div className="text-sm">{selectedScreen.lastHeartbeat ? new Date(selectedScreen.lastHeartbeat).toLocaleString("nl-NL") : "—"}</div>
                  </div>
                  <div className="bg-white/[0.02] rounded p-3">
                    <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-1">Orientatie</div>
                    <div className="text-sm capitalize">{selectedScreen.orientation || "portrait"}</div>
                  </div>
                  <div className="bg-white/[0.02] rounded p-3">
                    <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-1">Vloer / Zone</div>
                    <div className="text-sm">{selectedScreen.floor ? `V${selectedScreen.floor}` : "—"} {selectedScreen.zone || ""}</div>
                  </div>
                </div>
              </div>

              {/* Token & URL */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] rounded p-3">
                  <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-1">Provisioning Token</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-[#627653]">{selectedScreen.provisioningToken}</code>
                    <button onClick={() => copyToClipboard(selectedScreen.provisioningToken || "", "Token")} className="text-[#888] hover:text-white">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="bg-white/[0.02] rounded p-3">
                  <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-1">Display URL</div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-[#627653] truncate">{getDisplayUrl(selectedScreen.id)}</code>
                    <button onClick={() => copyToClipboard(getDisplayUrl(selectedScreen.id), "URL")} className="text-[#888] hover:text-white flex-shrink-0">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Playlist assignment */}
              <div className="bg-white/[0.02] rounded p-3">
                <div className="text-[9px] text-[#888] tracking-[2px] uppercase mb-2">Playlist</div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedScreen.currentPlaylistId?.toString() || "none"}
                    onValueChange={(v) => assignPlaylist.mutate({ screenId: selectedScreen.id, playlistId: v === "none" ? null : parseInt(v) })}
                  >
                    <SelectTrigger className="h-8 bg-white/[0.03] border-white/[0.06] text-xs"><SelectValue placeholder="Geen playlist" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Geen playlist</SelectItem>
                      {(playlists || []).map((pl: any) => <SelectItem key={pl.id} value={pl.id.toString()}>{pl.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="text-xs border-white/10" onClick={() => rebootScreen.mutate({ screenId: selectedScreen.id })}>
                  <RefreshCw className="w-3 h-3 mr-1" />Reboot
                </Button>
                <Button variant="outline" size="sm" className="text-xs border-red-500/20 text-red-400 hover:text-red-300" onClick={() => {
                  if (confirm("Scherm verwijderen?")) deleteScreen.mutate({ id: selectedScreen.id });
                }}>
                  <Trash2 className="w-3 h-3 mr-1" />Verwijderen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ SCREEN PREVIEW FULLSCREEN ═══ */}
      <Dialog open={!!previewScreen} onOpenChange={(open) => { if (!open) setPreviewScreen(null); }}>
        <DialogContent className="bg-black border-none sm:max-w-4xl p-0">
          {previewScreen && (
            <iframe
              src={getDisplayUrl(previewScreen.id)}
              className="w-full aspect-[9/16] max-h-[80vh] rounded-lg"
              title={`Preview: ${previewScreen.name}`}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE SCREEN DIALOG ═══ */}
      <Dialog open={showCreateScreen} onOpenChange={setShowCreateScreen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuw scherm</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
              <Input value={screenForm.name} onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })} placeholder="Receptie Lobby — Ede" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Locatie</label>
                <Select value={screenForm.locationId.toString()} onValueChange={(v) => setScreenForm({ ...screenForm, locationId: parseInt(v) })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Kies locatie" /></SelectTrigger>
                  <SelectContent>
                    {(locations || []).map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Type</label>
                <Select value={screenForm.screenType} onValueChange={(v) => setScreenForm({ ...screenForm, screenType: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCREEN_TYPES.map(t => <SelectItem key={t} value={t}>{SCREEN_TYPE_META[t]?.label || t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Orientatie</label>
                <Select value={screenForm.orientation} onValueChange={(v) => setScreenForm({ ...screenForm, orientation: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Vloer</label>
                <Input value={screenForm.floor} onChange={(e) => setScreenForm({ ...screenForm, floor: e.target.value })} placeholder="1" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Zone</label>
                <Input value={screenForm.zone} onChange={(e) => setScreenForm({ ...screenForm, zone: e.target.value })} placeholder="Lobby" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateScreen(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createScreen.mutate({ name: screenForm.name, screenType: screenForm.screenType as any, locationId: screenForm.locationId, orientation: screenForm.orientation as any, floor: screenForm.floor || undefined, zone: screenForm.zone || undefined })}
              disabled={createScreen.isPending || !screenForm.name || !screenForm.locationId}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createScreen.isPending ? "Aanmaken..." : "Scherm aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE CONTENT DIALOG ═══ */}
      <Dialog open={showCreateContent} onOpenChange={setShowCreateContent}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuwe content</DialogTitle></DialogHeader>
          <div className="grid grid-cols-5 gap-6">
            {/* Left: Form */}
            <div className="col-span-3 space-y-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Titel</label>
                <Input value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })} placeholder="Welkom bij Mr. Green" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Type</label>
                  <Select value={contentForm.contentType} onValueChange={(v) => setContentForm({ ...contentForm, contentType: v })}>
                    <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map(t => <SelectItem key={t} value={t}>{CONTENT_TYPE_META[t]?.label || t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Duur (sec)</label>
                  <Input type="number" value={contentForm.duration} onChange={(e) => setContentForm({ ...contentForm, duration: parseInt(e.target.value) || 15 })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
              </div>

              {/* Media URL for image, video, pdf */}
              {["image", "video", "pdf"].includes(contentForm.contentType) && (
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">
                    {contentForm.contentType === "pdf" ? "PDF URL" : contentForm.contentType === "video" ? "Video URL" : "Afbeelding URL"}
                  </label>
                  <Input value={contentForm.mediaUrl} onChange={(e) => setContentForm({ ...contentForm, mediaUrl: e.target.value })} placeholder="https://..." className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                  <p className="text-[9px] text-[#888] mt-1">
                    {contentForm.contentType === "pdf" ? "Directe link naar PDF bestand. PDF wordt fullscreen weergegeven op het scherm." :
                     contentForm.contentType === "video" ? "Directe link naar MP4/WebM video." :
                     "Directe link naar afbeelding (JPG/PNG/WebP)."}
                  </p>
                </div>
              )}

              {contentForm.contentType === "url" && (
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Externe URL</label>
                  <Input value={contentForm.externalUrl} onChange={(e) => setContentForm({ ...contentForm, externalUrl: e.target.value })} placeholder="https://..." className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                  <p className="text-[9px] text-[#888] mt-1">Webpagina wordt als iframe geladen op het scherm.</p>
                </div>
              )}

              {contentForm.contentType === "html" && (
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">HTML Content</label>
                  <textarea value={contentForm.htmlContent} onChange={(e) => setContentForm({ ...contentForm, htmlContent: e.target.value })} placeholder="<div>...</div>" className="mt-1 w-full h-32 bg-white/[0.03] border border-white/[0.06] rounded p-3 text-sm font-mono resize-none" />
                </div>
              )}

              {contentForm.contentType === "announcement" && (
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Bericht</label>
                  <Input value={(contentForm.templateData as any)?.message || ""} onChange={(e) => setContentForm({ ...contentForm, templateData: { ...contentForm.templateData, message: e.target.value } })} placeholder="Belangrijke aankondiging..." className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
              )}

              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Prioriteit</label>
                <Input type="number" value={contentForm.priority} onChange={(e) => setContentForm({ ...contentForm, priority: parseInt(e.target.value) || 0 })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>

            {/* Right: Live Preview */}
            <div className="col-span-2">
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Preview</label>
              <div className="mt-1 aspect-[9/16] rounded-xl overflow-hidden border border-white/[0.08] bg-black">
                {(contentForm.contentType === "image" || contentForm.contentType === "pdf") && contentForm.mediaUrl ? (
                  <img src={contentForm.mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                ) : contentForm.contentType === "video" && contentForm.mediaUrl ? (
                  <video src={contentForm.mediaUrl} className="w-full h-full object-contain" muted autoPlay loop />
                ) : contentForm.contentType === "url" && contentForm.externalUrl ? (
                  <iframe src={contentForm.externalUrl} className="w-full h-full border-0" />
                ) : contentForm.contentType === "html" && contentForm.htmlContent ? (
                  <iframe srcDoc={contentForm.htmlContent} className="w-full h-full border-0" />
                ) : contentForm.contentType === "announcement" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#627653]/20 to-[#1a2614] p-6">
                    <div className="text-center">
                      <Zap className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                      <p className="text-sm text-white/80">{(contentForm.templateData as any)?.message || "Aankondiging"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <FileImage className="w-8 h-8 text-white/10" />
                    <span className="text-[9px] text-white/20">Preview verschijnt hier</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateContent(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createContent.mutate({ title: contentForm.title, contentType: contentForm.contentType as any, mediaUrl: contentForm.mediaUrl || undefined, htmlContent: contentForm.htmlContent || undefined, externalUrl: contentForm.externalUrl || undefined, duration: contentForm.duration, locationId: contentForm.locationId || undefined, priority: contentForm.priority, templateData: Object.keys(contentForm.templateData).length > 0 ? contentForm.templateData : undefined })}
              disabled={createContent.isPending || !contentForm.title}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createContent.isPending ? "Aanmaken..." : "Content aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT CONTENT DIALOG ═══ */}
      <Dialog open={!!editingContent} onOpenChange={(open) => { if (!open) setEditingContent(null); }}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-light text-lg">Content bewerken</DialogTitle></DialogHeader>
          {editingContent && (
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-3 space-y-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Titel</label>
                <Input value={editingContent.title} onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Type</label>
                  <div className="mt-1 flex items-center gap-2">
                    {(() => { const m = CONTENT_TYPE_META[editingContent.contentType]; const I = m?.icon || FileImage; return <I className="w-3.5 h-3.5 text-[#627653]" />; })()}
                    <span className="text-sm capitalize">{CONTENT_TYPE_META[editingContent.contentType]?.label || editingContent.contentType}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Duur (sec)</label>
                  <Input type="number" value={editingContent.duration} onChange={(e) => setEditingContent({ ...editingContent, duration: parseInt(e.target.value) || 15 })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
              </div>
              {["image", "video", "pdf"].includes(editingContent.contentType) && (
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Media URL</label>
                  <Input value={editingContent.mediaUrl || ""} onChange={(e) => setEditingContent({ ...editingContent, mediaUrl: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
              )}
              {editingContent.contentType === "html" && (
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">HTML Content</label>
                  <textarea value={editingContent.htmlContent || ""} onChange={(e) => setEditingContent({ ...editingContent, htmlContent: e.target.value })} className="mt-1 w-full h-32 bg-white/[0.03] border border-white/[0.06] rounded p-3 text-sm font-mono resize-none" />
                </div>
              )}
              {editingContent.contentType === "url" && (
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Externe URL</label>
                  <Input value={editingContent.externalUrl || ""} onChange={(e) => setEditingContent({ ...editingContent, externalUrl: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
              )}
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Prioriteit</label>
                <Input type="number" value={editingContent.priority || 0} onChange={(e) => setEditingContent({ ...editingContent, priority: parseInt(e.target.value) || 0 })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              </div>
              {/* Right: Live Preview */}
              <div className="col-span-2">
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Preview</label>
                <div className="mt-1 aspect-[9/16] rounded-xl overflow-hidden border border-white/[0.08] bg-black">
                  {(editingContent.contentType === "image" || editingContent.contentType === "pdf") && editingContent.mediaUrl ? (
                    <img src={editingContent.mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : editingContent.contentType === "video" && editingContent.mediaUrl ? (
                    <video src={editingContent.mediaUrl} className="w-full h-full object-contain" muted autoPlay loop />
                  ) : editingContent.contentType === "url" && editingContent.externalUrl ? (
                    <iframe src={editingContent.externalUrl} className="w-full h-full border-0" />
                  ) : editingContent.contentType === "html" && editingContent.htmlContent ? (
                    <iframe srcDoc={editingContent.htmlContent} className="w-full h-full border-0" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <FileImage className="w-8 h-8 text-white/10" />
                      <span className="text-[9px] text-white/20">Geen preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContent(null)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => editingContent && updateContent.mutate({ id: editingContent.id, title: editingContent.title, mediaUrl: editingContent.mediaUrl || undefined, htmlContent: editingContent.htmlContent || undefined, externalUrl: editingContent.externalUrl || undefined, duration: editingContent.duration, priority: editingContent.priority })}
              disabled={updateContent.isPending}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {updateContent.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE PLAYLIST DIALOG ═══ */}
      <Dialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuwe playlist</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
              <Input value={playlistForm.name} onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })} placeholder="Receptie Welkom Playlist" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Beschrijving</label>
              <Input value={playlistForm.description} onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })} placeholder="Content voor de receptie schermen" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Schermtype</label>
                <Select value={playlistForm.screenType} onValueChange={(v) => setPlaylistForm({ ...playlistForm, screenType: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCREEN_TYPES.map(t => <SelectItem key={t} value={t}>{SCREEN_TYPE_META[t]?.label || t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Locatie</label>
                <Select value={playlistForm.locationId.toString()} onValueChange={(v) => setPlaylistForm({ ...playlistForm, locationId: parseInt(v) })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Kies locatie" /></SelectTrigger>
                  <SelectContent>
                    {(locations || []).map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePlaylist(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createPlaylist.mutate({ name: playlistForm.name, description: playlistForm.description || undefined, screenType: playlistForm.screenType as any, locationId: playlistForm.locationId || undefined })}
              disabled={createPlaylist.isPending || !playlistForm.name}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createPlaylist.isPending ? "Aanmaken..." : "Playlist aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ ADD ITEM TO PLAYLIST DIALOG ═══ */}
      <Dialog open={!!addItemToPlaylist} onOpenChange={(open) => { if (!open) setAddItemToPlaylist(null); }}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Content toevoegen aan playlist</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {(content || []).map((item: any) => {
              const meta = CONTENT_TYPE_META[item.contentType] || { icon: FileImage, label: item.contentType };
              const Icon = meta.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-[#627653]/30 cursor-pointer transition-all"
                  onClick={() => addItemToPlaylist && addPlaylistItem.mutate({ playlistId: addItemToPlaylist, contentId: item.id })}
                >
                  <ContentThumb type={item.contentType} url={item.mediaUrl} title={item.title} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light truncate">{item.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#888]">
                      <Icon className="w-2.5 h-2.5" />
                      <span>{meta.label}</span>
                      <span>{item.duration}s</span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-[#627653]" />
                </div>
              );
            })}
            {(!content || content.length === 0) && (
              <div className="text-center py-8">
                <p className="text-xs text-[#888]">Geen content beschikbaar. Maak eerst content aan.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE BUILDING DIALOG ═══ */}
      <Dialog open={showCreateBuilding} onOpenChange={setShowCreateBuilding}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuw gebouw</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
              <Input value={buildingForm.name} onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} placeholder="Gebouw A — Het Groene Hart" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Code</label>
                <Input value={buildingForm.code} onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })} placeholder="A" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Verdiepingen</label>
                <Input type="number" value={buildingForm.floors} onChange={(e) => setBuildingForm({ ...buildingForm, floors: parseInt(e.target.value) || 1 })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Adres</label>
              <Input value={buildingForm.address} onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })} placeholder="Keesomstraat 10, Ede" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Locatie</label>
              <Select value={buildingForm.locationId.toString()} onValueChange={(v) => setBuildingForm({ ...buildingForm, locationId: parseInt(v) })}>
                <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Kies locatie" /></SelectTrigger>
                <SelectContent>
                  {(locations || []).map((l: any) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBuilding(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createBuilding.mutate({ name: buildingForm.name, code: buildingForm.code || undefined, address: buildingForm.address || undefined, floors: buildingForm.floors, locationId: buildingForm.locationId })}
              disabled={createBuilding.isPending || !buildingForm.name || !buildingForm.locationId}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createBuilding.isPending ? "Aanmaken..." : "Gebouw aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ ASSIGN COMPANY DIALOG ═══ */}
      <Dialog open={showAssignCompany} onOpenChange={setShowAssignCompany}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Bedrijf toewijzen aan gebouw</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Bedrijf</label>
              <Select value={assignForm.companyId.toString()} onValueChange={(v) => setAssignForm({ ...assignForm, companyId: parseInt(v) })}>
                <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Kies bedrijf" /></SelectTrigger>
                <SelectContent>
                  {(companies || []).map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Gebouw</label>
              <Select value={assignForm.buildingId.toString()} onValueChange={(v) => setAssignForm({ ...assignForm, buildingId: parseInt(v) })}>
                <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Kies gebouw" /></SelectTrigger>
                <SelectContent>
                  {(buildings || []).map((b: any) => <SelectItem key={b.id} value={b.id.toString()}>{b.name} ({b.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Verdieping</label>
                <Input value={assignForm.floor} onChange={(e) => setAssignForm({ ...assignForm, floor: e.target.value })} placeholder="2" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Kamernummer</label>
                <Input value={assignForm.roomNumber} onChange={(e) => setAssignForm({ ...assignForm, roomNumber: e.target.value })} placeholder="2.04" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignCompany(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => assignCompany.mutate({ companyId: assignForm.companyId, buildingId: assignForm.buildingId, floor: assignForm.floor || undefined, roomNumber: assignForm.roomNumber || undefined })}
              disabled={assignCompany.isPending || !assignForm.companyId || !assignForm.buildingId}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {assignCompany.isPending ? "Toewijzen..." : "Toewijzen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE MENU ITEM DIALOG ═══ */}
      <Dialog open={showCreateMenuItem} onOpenChange={setShowCreateMenuItem}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuw menu item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
              <Input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} placeholder="Caesar Salade" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Beschrijving</label>
              <Input value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} placeholder="Verse romaine sla met..." className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Categorie</label>
                <Select value={menuForm.category} onValueChange={(v) => setMenuForm({ ...menuForm, category: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MENU_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Prijs</label>
                <Input value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} placeholder="€ 8,50" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={menuForm.isVegan} onChange={(e) => setMenuForm({ ...menuForm, isVegan: e.target.checked })} className="rounded" />
                <Leaf className="w-3 h-3 text-green-400" /> Vegan
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={menuForm.isVegetarian} onChange={(e) => setMenuForm({ ...menuForm, isVegetarian: e.target.checked })} className="rounded" />
                <Wheat className="w-3 h-3 text-amber-400" /> Vegetarisch
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateMenuItem(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createMenuItem.mutate({ name: menuForm.name, description: menuForm.description || undefined, category: menuForm.category as any, price: menuForm.price || undefined, locationId: menuForm.locationId, isVegan: menuForm.isVegan, isVegetarian: menuForm.isVegetarian })}
              disabled={createMenuItem.isPending || !menuForm.name}
              className="bg-[#B87333] text-white hover:bg-[#9A6028]"
            >
              {createMenuItem.isPending ? "Aanmaken..." : "Item aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT MENU ITEM DIALOG ═══ */}
      <Dialog open={!!editingMenuItem} onOpenChange={(open) => { if (!open) setEditingMenuItem(null); }}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Menu item bewerken</DialogTitle></DialogHeader>
          {editingMenuItem && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
                <Input value={editingMenuItem.name} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, name: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Beschrijving</label>
                <Input value={editingMenuItem.description || ""} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, description: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Prijs</label>
                <Input value={editingMenuItem.price || ""} onChange={(e) => setEditingMenuItem({ ...editingMenuItem, price: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMenuItem(null)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => editingMenuItem && updateMenuItem.mutate({ id: editingMenuItem.id, name: editingMenuItem.name, description: editingMenuItem.description, price: editingMenuItem.price })}
              disabled={updateMenuItem.isPending}
              className="bg-[#B87333] text-white hover:bg-[#9A6028]"
            >
              {updateMenuItem.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE GYM CLASS DIALOG ═══ */}
      <Dialog open={showCreateGymClass} onOpenChange={setShowCreateGymClass}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuwe les</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
              <Input value={gymForm.className} onChange={(e) => setGymForm({ ...gymForm, className: e.target.value })} placeholder="Power Yoga" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Instructeur</label>
                <Input value={gymForm.instructor} onChange={(e) => setGymForm({ ...gymForm, instructor: e.target.value })} placeholder="Lisa" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Categorie</label>
                <Select value={gymForm.category} onValueChange={(v) => setGymForm({ ...gymForm, category: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GYM_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Dag</label>
                <Select value={gymForm.dayOfWeek.toString()} onValueChange={(v) => setGymForm({ ...gymForm, dayOfWeek: parseInt(v) })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d, i) => <SelectItem key={i} value={i.toString()}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Start</label>
                <Input type="time" value={gymForm.startTime} onChange={(e) => setGymForm({ ...gymForm, startTime: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Eind</label>
                <Input type="time" value={gymForm.endTime} onChange={(e) => setGymForm({ ...gymForm, endTime: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Max deelnemers</label>
              <Input type="number" value={gymForm.maxParticipants} onChange={(e) => setGymForm({ ...gymForm, maxParticipants: parseInt(e.target.value) || 20 })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGymClass(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createGymClass.mutate({ className: gymForm.className, instructor: gymForm.instructor || undefined, category: gymForm.category as any, dayOfWeek: gymForm.dayOfWeek, startTime: gymForm.startTime, endTime: gymForm.endTime, maxParticipants: gymForm.maxParticipants, locationId: gymForm.locationId })}
              disabled={createGymClass.isPending || !gymForm.className}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {createGymClass.isPending ? "Aanmaken..." : "Les aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ EDIT GYM CLASS DIALOG ═══ */}
      <Dialog open={!!editingGymClass} onOpenChange={(open) => { if (!open) setEditingGymClass(null); }}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Les bewerken</DialogTitle></DialogHeader>
          {editingGymClass && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
                <Input value={editingGymClass.className} onChange={(e) => setEditingGymClass({ ...editingGymClass, className: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Instructeur</label>
                  <Input value={editingGymClass.instructor || ""} onChange={(e) => setEditingGymClass({ ...editingGymClass, instructor: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Max deelnemers</label>
                  <Input type="number" value={editingGymClass.maxParticipants || 20} onChange={(e) => setEditingGymClass({ ...editingGymClass, maxParticipants: parseInt(e.target.value) || 20 })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Start</label>
                  <Input type="time" value={editingGymClass.startTime} onChange={(e) => setEditingGymClass({ ...editingGymClass, startTime: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
                <div>
                  <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Eind</label>
                  <Input type="time" value={editingGymClass.endTime} onChange={(e) => setEditingGymClass({ ...editingGymClass, endTime: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGymClass(null)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => editingGymClass && updateGymClass.mutate({ id: editingGymClass.id, className: editingGymClass.className, instructor: editingGymClass.instructor, startTime: editingGymClass.startTime, endTime: editingGymClass.endTime, maxParticipants: editingGymClass.maxParticipants })}
              disabled={updateGymClass.isPending}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {updateGymClass.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE PROVISIONING TEMPLATE DIALOG ═══ */}
      <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuw provisioning template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
              <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="Receptie Portrait Template" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Schermtype</label>
                <Select value={templateForm.screenType} onValueChange={(v) => setTemplateForm({ ...templateForm, screenType: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SCREEN_TYPES.map(t => <SelectItem key={t} value={t}>{SCREEN_TYPE_META[t]?.label || t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Orientatie</label>
                <Select value={templateForm.defaultOrientation} onValueChange={(v) => setTemplateForm({ ...templateForm, defaultOrientation: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Resolutie</label>
                <Select value={templateForm.defaultResolution} onValueChange={(v) => setTemplateForm({ ...templateForm, defaultResolution: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1080x1920">1080x1920 (FHD Portrait)</SelectItem>
                    <SelectItem value="1920x1080">1920x1080 (FHD Landscape)</SelectItem>
                    <SelectItem value="2160x3840">2160x3840 (4K Portrait)</SelectItem>
                    <SelectItem value="3840x2160">3840x2160 (4K Landscape)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Helderheid %</label>
                <Input type="number" value={templateForm.defaultBrightness} onChange={(e) => setTemplateForm({ ...templateForm, defaultBrightness: parseInt(e.target.value) || 100 })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTemplate(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createTemplate.mutate({ name: templateForm.name, screenType: templateForm.screenType as any, defaultOrientation: templateForm.defaultOrientation as any, defaultResolution: templateForm.defaultResolution, defaultBrightness: templateForm.defaultBrightness })}
              disabled={createTemplate.isPending || !templateForm.name}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createTemplate.isPending ? "Aanmaken..." : "Template aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
