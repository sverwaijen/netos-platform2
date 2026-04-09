import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import {
  Monitor, Palette, Image, Building2, Upload, Tv, Wifi, WifiOff,
  Plus, Search, RefreshCw, Settings, Eye, Trash2, Play, List,
  MapPin, ChefHat, Dumbbell, Navigation, LayoutGrid, AlertTriangle,
  CheckCircle2, XCircle, Clock, Zap, Copy, ExternalLink, Signal,
  Layers, FileImage, Video, Globe, Type, ArrowUpDown, MoreVertical,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────
type TabKey = "screens" | "content" | "playlists" | "wayfinding" | "kitchen" | "gym" | "provisioning";

const SCREEN_TYPE_ICONS: Record<string, any> = {
  reception: Navigation,
  gym: Dumbbell,
  kitchen: ChefHat,
  wayfinding: MapPin,
  general: Monitor,
  meeting_room: Building2,
  elevator: Layers,
  parking: MapPin,
};

const SCREEN_TYPE_COLORS: Record<string, string> = {
  reception: "#627653",
  gym: "#8B6914",
  kitchen: "#B87333",
  wayfinding: "#4A7C59",
  general: "#627653",
  meeting_room: "#5B6B7C",
  elevator: "#7C5B6B",
  parking: "#6B7C5B",
};

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  online: { color: "#627653", icon: CheckCircle2, label: "Online" },
  offline: { color: "#dc2626", icon: XCircle, label: "Offline" },
  provisioning: { color: "#f59e0b", icon: Clock, label: "Provisioning" },
  maintenance: { color: "#6366f1", icon: Settings, label: "Maintenance" },
  error: { color: "#dc2626", icon: AlertTriangle, label: "Error" },
};

const CONTENT_TYPE_ICONS: Record<string, any> = {
  image: FileImage,
  video: Video,
  html: Type,
  url: Globe,
  menu_card: ChefHat,
  wayfinding: Navigation,
  gym_schedule: Dumbbell,
  weather: Globe,
  clock: Clock,
  news_ticker: Type,
  company_presence: Building2,
  welcome_screen: Monitor,
  announcement: Zap,
};

export default function SigningPage() {
  const [tab, setTab] = useState<TabKey>("screens");
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedScreenType, setSelectedScreenType] = useState<string>("all");
  const [showCreateScreen, setShowCreateScreen] = useState(false);
  const [showCreateContent, setShowCreateContent] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showCreateBuilding, setShowCreateBuilding] = useState(false);
  const [showCreateMenuItem, setShowCreateMenuItem] = useState(false);
  const [showCreateGymClass, setShowCreateGymClass] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<any>(null);

  // ─── Queries ─────────────────────────────────────────────────────
  const { data: locations } = trpc.locations.list.useQuery();
  const { data: screenStats } = trpc.signageScreens.stats.useQuery(
    selectedLocation !== "all" ? { locationId: parseInt(selectedLocation) } : undefined
  );
  const { data: screens, refetch: refetchScreens } = trpc.signageScreens.list.useQuery(
    {
      locationId: selectedLocation !== "all" ? parseInt(selectedLocation) : undefined,
      screenType: selectedScreenType !== "all" ? selectedScreenType : undefined,
      search: search || undefined,
    }
  );
  const { data: content, refetch: refetchContent } = trpc.signageContent.list.useQuery({
    locationId: selectedLocation !== "all" ? parseInt(selectedLocation) : undefined,
    search: search || undefined,
  });
  const { data: playlists, refetch: refetchPlaylists } = trpc.signagePlaylists.list.useQuery({
    locationId: selectedLocation !== "all" ? parseInt(selectedLocation) : undefined,
  });
  const { data: buildings } = trpc.wayfinding.buildings.useQuery(
    selectedLocation !== "all" ? { locationId: parseInt(selectedLocation) } : undefined
  );
  const { data: companyAssignments } = trpc.wayfinding.companyAssignments.useQuery();
  const { data: provisioningTemplates } = trpc.signageProvisioning.list.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();

  const utils = trpc.useUtils();

  // ─── Mutations ───────────────────────────────────────────────────
  const createScreen = trpc.signageScreens.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Screen created. Token: ${data.provisioningToken}`);
      setShowCreateScreen(false);
      refetchScreens();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateScreen = trpc.signageScreens.update.useMutation({
    onSuccess: () => { toast.success("Screen updated"); refetchScreens(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteScreen = trpc.signageScreens.delete.useMutation({
    onSuccess: () => { toast.success("Screen deleted"); refetchScreens(); setSelectedScreen(null); },
    onError: (e) => toast.error(e.message),
  });

  const rebootScreen = trpc.signageScreens.reboot.useMutation({
    onSuccess: () => toast.success("Reboot command sent"),
    onError: (e) => toast.error(e.message),
  });

  const assignPlaylist = trpc.signageScreens.assignPlaylist.useMutation({
    onSuccess: () => { toast.success("Playlist assigned"); refetchScreens(); },
    onError: (e) => toast.error(e.message),
  });

  const createContent = trpc.signageContent.create.useMutation({
    onSuccess: () => { toast.success("Content created"); setShowCreateContent(false); refetchContent(); },
    onError: (e) => toast.error(e.message),
  });

  const createPlaylist = trpc.signagePlaylists.create.useMutation({
    onSuccess: () => { toast.success("Playlist created"); setShowCreatePlaylist(false); refetchPlaylists(); },
    onError: (e) => toast.error(e.message),
  });

  const createBuilding = trpc.wayfinding.createBuilding.useMutation({
    onSuccess: () => { toast.success("Building created"); setShowCreateBuilding(false); utils.wayfinding.buildings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const createMenuItem = trpc.kitchenMenu.create.useMutation({
    onSuccess: () => { toast.success("Menu item created"); setShowCreateMenuItem(false); },
    onError: (e) => toast.error(e.message),
  });

  const createGymClass = trpc.gymSchedule.create.useMutation({
    onSuccess: () => { toast.success("Class created"); setShowCreateGymClass(false); },
    onError: (e) => toast.error(e.message),
  });

  const createTemplate = trpc.signageProvisioning.create.useMutation({
    onSuccess: () => { toast.success("Template created"); setShowCreateTemplate(false); utils.signageProvisioning.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // ─── Form States ────────────────────────────────────────────────
  const [screenForm, setScreenForm] = useState({
    name: "", screenType: "reception" as string, locationId: 0,
    orientation: "portrait", floor: "", zone: "",
  });
  const [contentForm, setContentForm] = useState({
    title: "", contentType: "image" as string, mediaUrl: "", htmlContent: "",
    externalUrl: "", duration: 15, locationId: 0, priority: 0,
  });
  const [playlistForm, setPlaylistForm] = useState({
    name: "", description: "", screenType: "reception" as string, locationId: 0,
  });
  const [buildingForm, setBuildingForm] = useState({
    name: "", code: "", address: "", floors: 1, locationId: 0,
  });
  const [menuForm, setMenuForm] = useState({
    name: "", description: "", category: "lunch" as string, price: "",
    locationId: 0, isVegan: false, isVegetarian: false,
  });
  const [gymForm, setGymForm] = useState({
    className: "", instructor: "", category: "cardio" as string,
    dayOfWeek: new Date().getDay(), startTime: "09:00", endTime: "10:00",
    maxParticipants: 20, locationId: 0,
  });
  const [templateForm, setTemplateForm] = useState({
    name: "", screenType: "reception" as string,
    defaultOrientation: "portrait", defaultResolution: "1080x1920",
    defaultBrightness: 100,
  });

  // ─── Computed ────────────────────────────────────────────────────
  const screensByType = useMemo(() => {
    if (!screens) return {};
    const grouped: Record<string, typeof screens> = {};
    screens.forEach(s => {
      if (!grouped[s.screenType]) grouped[s.screenType] = [];
      grouped[s.screenType].push(s);
    });
    return grouped;
  }, [screens]);

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: "screens", label: "Schermen", icon: Monitor },
    { key: "content", label: "Content", icon: FileImage },
    { key: "playlists", label: "Playlists", icon: List },
    { key: "wayfinding", label: "Wayfinding", icon: Navigation },
    { key: "kitchen", label: "Keuken", icon: ChefHat },
    { key: "gym", label: "Gym", icon: Dumbbell },
    { key: "provisioning", label: "Provisioning", icon: Zap },
  ];

  return (
    <div className="space-y-8 p-1">
      {/* Header */}
      <div>
        <div className="text-[9px] font-semibold tracking-[4px] uppercase text-[#627653] mb-3">SKYNET — Digital Signage</div>
        <h1 className="text-[clamp(24px,3vw,36px)] font-extralight tracking-[-0.5px]">
          Signage <strong className="font-semibold">platform.</strong>
        </h1>
        <p className="text-sm text-[#888] font-light mt-2 max-w-lg">
          Centraal beheer van {screenStats?.total || 0} schermen over alle locaties. Auto-provisioning, content management en live monitoring.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[1px] bg-white/[0.04]">
        {[
          { label: "Totaal", value: screenStats?.total || 0, icon: Monitor, color: "#627653" },
          { label: "Online", value: screenStats?.online || 0, icon: CheckCircle2, color: "#22c55e" },
          { label: "Offline", value: screenStats?.offline || 0, icon: XCircle, color: "#dc2626" },
          { label: "Provisioning", value: screenStats?.provisioning || 0, icon: Clock, color: "#f59e0b" },
          { label: "Error", value: screenStats?.error || 0, icon: AlertTriangle, color: "#ef4444" },
          { label: "Maintenance", value: screenStats?.maintenance || 0, icon: Settings, color: "#6366f1" },
        ].map((kpi, i) => (
          <div key={i} className="bg-[#111] p-5 flex items-center gap-3">
            <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            <div>
              <div className="text-[10px] text-[#888] tracking-[1px] uppercase">{kpi.label}</div>
              <div className="text-xl font-extralight">{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <Input
            placeholder="Zoek schermen, content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/[0.03] border-white/[0.06]"
          />
        </div>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-48 bg-white/[0.03] border-white/[0.06]">
            <SelectValue placeholder="Alle locaties" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle locaties</SelectItem>
            {(locations || []).map((l: any) => (
              <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedScreenType} onValueChange={setSelectedScreenType}>
          <SelectTrigger className="w-48 bg-white/[0.03] border-white/[0.06]">
            <SelectValue placeholder="Alle types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle types</SelectItem>
            {["reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking"].map(t => (
              <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { refetchScreens(); refetchContent(); refetchPlaylists(); }} className="border-white/[0.06] bg-transparent">
          <RefreshCw className="w-4 h-4 mr-2" />Ververs
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/[0.06] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-[10px] font-semibold tracking-[2px] uppercase transition-all border-b-2 whitespace-nowrap ${
              tab === t.key
                ? "border-[#627653] text-white"
                : "border-transparent text-[#888] hover:text-white"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ SCREENS TAB ═══ */}
      {tab === "screens" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Schermen ({screens?.length || 0})</h2>
            <Button onClick={() => setShowCreateScreen(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f]">
              <Plus className="w-4 h-4 mr-2" />Nieuw scherm
            </Button>
          </div>

          {/* Screen type overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(screensByType).map(([type, typeScreens]) => {
              const Icon = SCREEN_TYPE_ICONS[type] || Monitor;
              const color = SCREEN_TYPE_COLORS[type] || "#627653";
              const online = typeScreens.filter(s => s.status === "online").length;
              return (
                <div key={type} className="bg-[#111] border border-white/[0.06] rounded-lg p-4 hover:border-white/[0.12] transition-all cursor-pointer"
                  onClick={() => setSelectedScreenType(type)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: `${color}20` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <div className="text-sm font-light capitalize">{type.replace("_", " ")}</div>
                      <div className="text-[10px] text-[#888]">{typeScreens.length} schermen</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(online / typeScreens.length) * 100}%`, background: color }} />
                    </div>
                    <span className="text-[10px] text-[#888]">{online}/{typeScreens.length}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Screen list */}
          <div className="space-y-0">
            {(screens || []).map((screen: any) => {
              const statusCfg = STATUS_CONFIG[screen.status] || STATUS_CONFIG.offline;
              const TypeIcon = SCREEN_TYPE_ICONS[screen.screenType] || Monitor;
              const typeColor = SCREEN_TYPE_COLORS[screen.screenType] || "#627653";
              const loc = (locations || []).find((l: any) => l.id === screen.locationId);
              return (
                <div
                  key={screen.id}
                  className="flex items-center justify-between py-4 px-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  onClick={() => setSelectedScreen(screen)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded flex items-center justify-center relative" style={{ background: `${typeColor}15` }}>
                      <TypeIcon className="w-5 h-5" style={{ color: typeColor }} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#111]" style={{ background: statusCfg.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-light">{screen.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#888]">{loc?.name || `Location #${screen.locationId}`}</span>
                        {screen.floor && <span className="text-[10px] text-[#888]">· Vloer {screen.floor}</span>}
                        {screen.zone && <span className="text-[10px] text-[#888]">· {screen.zone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-[9px] capitalize" style={{ borderColor: `${typeColor}40`, color: typeColor }}>
                      {screen.screenType.replace("_", " ")}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <statusCfg.icon className="w-3 h-3" style={{ color: statusCfg.color }} />
                      <span className="text-[10px] font-semibold tracking-[1px] uppercase" style={{ color: statusCfg.color }}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#888] font-mono">{screen.ipAddress || "—"}</span>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); window.open(`/signage/display?screenId=${screen.id}`, "_blank"); }}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {(!screens || screens.length === 0) && (
              <div className="text-center py-16">
                <Monitor className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
                <p className="text-sm text-[#888] font-light">Nog geen schermen geconfigureerd</p>
                <Button onClick={() => setShowCreateScreen(true)} variant="outline" className="mt-4 border-white/[0.06]">
                  <Plus className="w-4 h-4 mr-2" />Eerste scherm toevoegen
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ CONTENT TAB ═══ */}
      {tab === "content" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Content Library ({content?.length || 0})</h2>
            <Button onClick={() => setShowCreateContent(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f]">
              <Plus className="w-4 h-4 mr-2" />Nieuwe content
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(content || []).map((item: any) => {
              const ContentIcon = CONTENT_TYPE_ICONS[item.contentType] || FileImage;
              return (
                <Card key={item.id} className="bg-[#111] border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all">
                  {item.mediaUrl && (
                    <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${item.mediaUrl})` }} />
                  )}
                  {!item.mediaUrl && (
                    <div className="h-32 bg-white/[0.02] flex items-center justify-center">
                      <ContentIcon className="w-8 h-8 text-[#888] opacity-30" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-light">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px]">{item.contentType.replace("_", " ")}</Badge>
                          <span className="text-[10px] text-[#888]">{item.duration}s</span>
                        </div>
                      </div>
                    </div>
                    {item.targetScreenTypes && item.targetScreenTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.targetScreenTypes.map((t: string) => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#888]">{t}</span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {(!content || content.length === 0) && (
            <div className="text-center py-16">
              <FileImage className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">Nog geen content items</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ PLAYLISTS TAB ═══ */}
      {tab === "playlists" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Playlists ({playlists?.length || 0})</h2>
            <Button onClick={() => setShowCreatePlaylist(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f]">
              <Plus className="w-4 h-4 mr-2" />Nieuwe playlist
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(playlists || []).map((pl: any) => {
              const TypeIcon = SCREEN_TYPE_ICONS[pl.screenType] || Monitor;
              const color = SCREEN_TYPE_COLORS[pl.screenType] || "#627653";
              return (
                <Card key={pl.id} className="bg-[#111] border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all">
                  <div className="h-1.5" style={{ background: color }} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: `${color}20` }}>
                        <TypeIcon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-light">{pl.name}</p>
                        {pl.description && <p className="text-[11px] text-[#888] mt-0.5">{pl.description}</p>}
                      </div>
                      {pl.isDefault && <Badge className="bg-[#627653]/20 text-[#627653] text-[9px]">Default</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-[#888]">
                      <span>{pl.itemCount || 0} items</span>
                      <span>{pl.screenCount || 0} schermen</span>
                      <span className="capitalize">{pl.scheduleType}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {(!playlists || playlists.length === 0) && (
            <div className="text-center py-16">
              <List className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">Nog geen playlists</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ WAYFINDING TAB ═══ */}
      {tab === "wayfinding" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Wayfinding & Gebouwen</h2>
            <Button onClick={() => setShowCreateBuilding(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f]">
              <Plus className="w-4 h-4 mr-2" />Nieuw gebouw
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(buildings || []).map((b: any) => {
              const assignedCompanies = (companyAssignments || []).filter((a: any) => a.buildingId === b.id);
              return (
                <Card key={b.id} className="bg-[#111] border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all">
                  <div className="h-1.5 bg-[#4A7C59]" />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded bg-[#4A7C59]/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#4A7C59]" />
                      </div>
                      <div>
                        <p className="text-sm font-light">{b.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {b.code && <Badge variant="outline" className="text-[9px]">{b.code}</Badge>}
                          <span className="text-[10px] text-[#888]">{b.floors} verdieping{b.floors !== 1 ? "en" : ""}</span>
                        </div>
                      </div>
                    </div>
                    {b.address && <p className="text-[11px] text-[#888] mb-3">{b.address}</p>}
                    <div className="text-[10px] text-[#888]">{assignedCompanies.length} bedrijven toegewezen</div>
                    {assignedCompanies.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {assignedCompanies.slice(0, 5).map((a: any) => (
                          <div key={a.id} className="flex items-center gap-2 text-[11px]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#627653]" />
                            <span>{a.companyName}</span>
                            {a.floor && <span className="text-[#888]">Vloer {a.floor}</span>}
                            {a.roomNumber && <span className="text-[#888]">Kamer {a.roomNumber}</span>}
                          </div>
                        ))}
                        {assignedCompanies.length > 5 && (
                          <span className="text-[10px] text-[#888]">+{assignedCompanies.length - 5} meer</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {(!buildings || buildings.length === 0) && (
            <div className="text-center py-16">
              <Building2 className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[#888] font-light">Nog geen gebouwen geconfigureerd</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ KITCHEN TAB ═══ */}
      {tab === "kitchen" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Keuken Menu</h2>
            <Button onClick={() => setShowCreateMenuItem(true)} className="bg-[#B87333] text-white hover:bg-[#9A6028]">
              <Plus className="w-4 h-4 mr-2" />Nieuw item
            </Button>
          </div>
          <p className="text-sm text-[#888] font-light">Beheer menukaarten die op keuken-schermen worden weergegeven. Items worden automatisch getoond op basis van dag en categorie.</p>
          <div className="text-center py-12">
            <ChefHat className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
            <p className="text-sm text-[#888] font-light">Selecteer een locatie om menu items te beheren</p>
          </div>
        </div>
      )}

      {/* ═══ GYM TAB ═══ */}
      {tab === "gym" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Gym Rooster</h2>
            <Button onClick={() => setShowCreateGymClass(true)} className="bg-[#8B6914] text-white hover:bg-[#6B5010]">
              <Plus className="w-4 h-4 mr-2" />Nieuwe les
            </Button>
          </div>
          <p className="text-sm text-[#888] font-light">Beheer gym lessen en roosters die op gym-schermen worden weergegeven. Inclusief EGYM integratie.</p>
          <div className="text-center py-12">
            <Dumbbell className="w-8 h-8 text-[#888] mx-auto mb-3 opacity-30" />
            <p className="text-sm text-[#888] font-light">Selecteer een locatie om het gym rooster te beheren</p>
          </div>
        </div>
      )}

      {/* ═══ PROVISIONING TAB ═══ */}
      {tab === "provisioning" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-light">Auto-Provisioning Templates</h2>
            <Button onClick={() => setShowCreateTemplate(true)} className="bg-[#627653] text-white hover:bg-[#4a5a3f]">
              <Plus className="w-4 h-4 mr-2" />Nieuw template
            </Button>
          </div>
          <p className="text-sm text-[#888] font-light max-w-2xl">
            Provisioning templates bepalen hoe nieuwe schermen automatisch worden geconfigureerd. Wanneer een scherm zich aanmeldt met een provisioning token, wordt het automatisch gekoppeld aan de juiste playlist en instellingen op basis van het schermtype.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(provisioningTemplates || []).map((tpl: any) => {
              const TypeIcon = SCREEN_TYPE_ICONS[tpl.screenType] || Monitor;
              const color = SCREEN_TYPE_COLORS[tpl.screenType] || "#627653";
              return (
                <Card key={tpl.id} className="bg-[#111] border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all">
                  <div className="h-1.5" style={{ background: color }} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: `${color}20` }}>
                        <TypeIcon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-sm font-light">{tpl.name}</p>
                        <Badge variant="outline" className="text-[9px] mt-1 capitalize" style={{ borderColor: `${color}40`, color }}>
                          {tpl.screenType.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-[11px] text-[#888]">
                      <div>Orientatie: {tpl.defaultOrientation}</div>
                      <div>Resolutie: {tpl.defaultResolution}</div>
                      <div>Helderheid: {tpl.defaultBrightness}%</div>
                      <div>Auto-locatie: {tpl.autoAssignLocation ? "Ja" : "Nee"}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* How it works */}
          <Card className="bg-[#111] border-white/[0.06]">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold mb-4">Hoe auto-provisioning werkt</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Scherm aanmaken", desc: "Maak een nieuw scherm aan en ontvang een uniek provisioning token" },
                  { step: "2", title: "Token invoeren", desc: "Open de display URL op het scherm en voer het token in" },
                  { step: "3", title: "Auto-configuratie", desc: "Het scherm wordt automatisch geconfigureerd op basis van het template" },
                  { step: "4", title: "Content laden", desc: "De juiste playlist wordt geladen: gym data, menukaart of wayfinding" },
                ].map((s) => (
                  <div key={s.step} className="text-center">
                    <div className="w-8 h-8 rounded-full bg-[#627653]/20 text-[#627653] flex items-center justify-center mx-auto mb-2 text-sm font-semibold">{s.step}</div>
                    <p className="text-[11px] font-medium mb-1">{s.title}</p>
                    <p className="text-[10px] text-[#888]">{s.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ SCREEN DETAIL DIALOG ═══ */}
      <Dialog open={!!selectedScreen} onOpenChange={(open) => { if (!open) setSelectedScreen(null); }}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-light text-lg flex items-center gap-3">
              {selectedScreen && (() => {
                const TypeIcon = SCREEN_TYPE_ICONS[selectedScreen.screenType] || Monitor;
                const color = SCREEN_TYPE_COLORS[selectedScreen.screenType] || "#627653";
                return <TypeIcon className="w-5 h-5" style={{ color }} />;
              })()}
              {selectedScreen?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedScreen && (
            <div className="space-y-6">
              {/* Status & Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] rounded p-3">
                  <div className="text-[10px] text-[#888] tracking-[1px] uppercase mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedScreen.status] || STATUS_CONFIG.offline;
                      return (
                        <>
                          <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
                          <span className="text-sm" style={{ color: cfg.color }}>{cfg.label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="bg-white/[0.02] rounded p-3">
                  <div className="text-[10px] text-[#888] tracking-[1px] uppercase mb-1">Type</div>
                  <div className="text-sm capitalize">{selectedScreen.screenType.replace("_", " ")}</div>
                </div>
                <div className="bg-white/[0.02] rounded p-3">
                  <div className="text-[10px] text-[#888] tracking-[1px] uppercase mb-1">IP Adres</div>
                  <div className="text-sm font-mono">{selectedScreen.ipAddress || "—"}</div>
                </div>
                <div className="bg-white/[0.02] rounded p-3">
                  <div className="text-[10px] text-[#888] tracking-[1px] uppercase mb-1">Laatste heartbeat</div>
                  <div className="text-sm">{selectedScreen.lastHeartbeat ? new Date(selectedScreen.lastHeartbeat).toLocaleString("nl-NL") : "—"}</div>
                </div>
              </div>

              {/* Provisioning Token */}
              <div className="bg-white/[0.02] rounded p-3">
                <div className="text-[10px] text-[#888] tracking-[1px] uppercase mb-1">Provisioning Token</div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-[#627653]">{selectedScreen.provisioningToken}</code>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                    navigator.clipboard.writeText(selectedScreen.provisioningToken || "");
                    toast.success("Token gekopieerd");
                  }}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Playlist Assignment */}
              <div>
                <div className="text-[10px] text-[#888] tracking-[1px] uppercase mb-2">Playlist toewijzen</div>
                <Select
                  value={selectedScreen.currentPlaylistId?.toString() || "none"}
                  onValueChange={(v) => {
                    assignPlaylist.mutate({
                      screenId: selectedScreen.id,
                      playlistId: v === "none" ? null : parseInt(v),
                    });
                  }}
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.06]">
                    <SelectValue placeholder="Geen playlist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen playlist</SelectItem>
                    {(playlists || []).map((pl: any) => (
                      <SelectItem key={pl.id} value={pl.id.toString()}>{pl.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-[#888] tracking-[1px] uppercase mb-1">Helderheid</div>
                  <Input
                    type="number" min={0} max={100}
                    value={selectedScreen.brightness || 100}
                    onChange={(e) => updateScreen.mutate({ id: selectedScreen.id, brightness: parseInt(e.target.value) })}
                    className="bg-white/[0.03] border-white/[0.06]"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-[#888] tracking-[1px] uppercase mb-1">Volume</div>
                  <Input
                    type="number" min={0} max={100}
                    value={selectedScreen.volume || 0}
                    onChange={(e) => updateScreen.mutate({ id: selectedScreen.id, volume: parseInt(e.target.value) })}
                    className="bg-white/[0.03] border-white/[0.06]"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/[0.06] bg-transparent text-red-400" onClick={() => { if (confirm("Weet je zeker dat je dit scherm wilt verwijderen?")) deleteScreen.mutate({ id: selectedScreen?.id }); }}>
                <Trash2 className="w-4 h-4 mr-2" />Verwijderen
              </Button>
              <Button variant="outline" className="border-white/[0.06] bg-transparent" onClick={() => rebootScreen.mutate({ screenId: selectedScreen?.id })}>
                <RefreshCw className="w-4 h-4 mr-2" />Reboot
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/[0.06] bg-transparent" onClick={() => window.open(`/signage/display?screenId=${selectedScreen?.id}`, "_blank")}>
                <Eye className="w-4 h-4 mr-2" />Preview
              </Button>
              <Button onClick={() => setSelectedScreen(null)} className="bg-[#627653] text-white hover:bg-[#4a5a3f]">Sluiten</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE SCREEN DIALOG ═══ */}
      <Dialog open={showCreateScreen} onOpenChange={setShowCreateScreen}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuw scherm toevoegen</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
              <Input value={screenForm.name} onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })} placeholder="Ede — Receptie Links" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Locatie</label>
                <Select value={screenForm.locationId.toString()} onValueChange={(v) => setScreenForm({ ...screenForm, locationId: parseInt(v) })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Kies locatie" /></SelectTrigger>
                  <SelectContent>
                    {(locations || []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Type</label>
                <Select value={screenForm.screenType} onValueChange={(v) => setScreenForm({ ...screenForm, screenType: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking"].map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}</SelectItem>
                    ))}
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
              onClick={() => createScreen.mutate({
                name: screenForm.name,
                screenType: screenForm.screenType as any,
                locationId: screenForm.locationId,
                orientation: screenForm.orientation as any,
                floor: screenForm.floor || undefined,
                zone: screenForm.zone || undefined,
              })}
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
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuwe content</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
                    {["image", "video", "html", "url", "menu_card", "wayfinding", "gym_schedule", "weather", "clock", "news_ticker", "company_presence", "welcome_screen", "announcement"].map(t => (
                      <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Duur (sec)</label>
                <Input type="number" value={contentForm.duration} onChange={(e) => setContentForm({ ...contentForm, duration: parseInt(e.target.value) })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
            {["image", "video"].includes(contentForm.contentType) && (
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Media URL</label>
                <Input value={contentForm.mediaUrl} onChange={(e) => setContentForm({ ...contentForm, mediaUrl: e.target.value })} placeholder="https://..." className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            )}
            {contentForm.contentType === "url" && (
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Externe URL</label>
                <Input value={contentForm.externalUrl} onChange={(e) => setContentForm({ ...contentForm, externalUrl: e.target.value })} placeholder="https://..." className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            )}
            {contentForm.contentType === "html" && (
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">HTML Content</label>
                <textarea value={contentForm.htmlContent} onChange={(e) => setContentForm({ ...contentForm, htmlContent: e.target.value })} placeholder="<div>...</div>" className="mt-1 w-full h-32 bg-white/[0.03] border border-white/[0.06] rounded p-3 text-sm font-mono resize-none" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateContent(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createContent.mutate({
                title: contentForm.title,
                contentType: contentForm.contentType as any,
                mediaUrl: contentForm.mediaUrl || undefined,
                htmlContent: contentForm.htmlContent || undefined,
                externalUrl: contentForm.externalUrl || undefined,
                duration: contentForm.duration,
                locationId: contentForm.locationId || undefined,
                priority: contentForm.priority,
              })}
              disabled={createContent.isPending || !contentForm.title}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createContent.isPending ? "Aanmaken..." : "Content aanmaken"}
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
              <Input value={playlistForm.name} onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })} placeholder="Receptie — Ede" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Beschrijving</label>
              <Input value={playlistForm.description} onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Schermtype</label>
                <Select value={playlistForm.screenType} onValueChange={(v) => setPlaylistForm({ ...playlistForm, screenType: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["reception", "gym", "kitchen", "wayfinding", "general"].map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Locatie</label>
                <Select value={playlistForm.locationId.toString()} onValueChange={(v) => setPlaylistForm({ ...playlistForm, locationId: parseInt(v) })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Alle locaties" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Alle locaties</SelectItem>
                    {(locations || []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePlaylist(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createPlaylist.mutate({
                name: playlistForm.name,
                description: playlistForm.description || undefined,
                screenType: playlistForm.screenType as any,
                locationId: playlistForm.locationId || undefined,
              })}
              disabled={createPlaylist.isPending || !playlistForm.name}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createPlaylist.isPending ? "Aanmaken..." : "Playlist aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE BUILDING DIALOG ═══ */}
      <Dialog open={showCreateBuilding} onOpenChange={setShowCreateBuilding}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuw gebouw</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Naam</label>
              <Input value={buildingForm.name} onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })} placeholder="Gebouw A" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Code</label>
                <Input value={buildingForm.code} onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })} placeholder="A" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Verdiepingen</label>
                <Input type="number" value={buildingForm.floors} onChange={(e) => setBuildingForm({ ...buildingForm, floors: parseInt(e.target.value) })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Locatie</label>
                <Select value={buildingForm.locationId.toString()} onValueChange={(v) => setBuildingForm({ ...buildingForm, locationId: parseInt(v) })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Kies" /></SelectTrigger>
                  <SelectContent>
                    {(locations || []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Adres</label>
              <Input value={buildingForm.address} onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateBuilding(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createBuilding.mutate({
                name: buildingForm.name,
                code: buildingForm.code || undefined,
                address: buildingForm.address || undefined,
                floors: buildingForm.floors,
                locationId: buildingForm.locationId,
              })}
              disabled={createBuilding.isPending || !buildingForm.name || !buildingForm.locationId}
              className="bg-[#627653] text-white hover:bg-[#4a5a3f]"
            >
              {createBuilding.isPending ? "Aanmaken..." : "Gebouw aanmaken"}
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
              <Input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} placeholder="Oma's Tomatensoep" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Beschrijving</label>
              <Input value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Categorie</label>
                <Select value={menuForm.category} onValueChange={(v) => setMenuForm({ ...menuForm, category: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["breakfast", "lunch", "dinner", "snack", "drink", "soup", "salad", "sandwich", "special"].map(c => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Prijs</label>
                <Input value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} placeholder="4.50" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Locatie</label>
                <Select value={menuForm.locationId.toString()} onValueChange={(v) => setMenuForm({ ...menuForm, locationId: parseInt(v) })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Kies" /></SelectTrigger>
                  <SelectContent>
                    {(locations || []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateMenuItem(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createMenuItem.mutate({
                name: menuForm.name,
                description: menuForm.description || undefined,
                category: menuForm.category as any,
                price: menuForm.price || undefined,
                locationId: menuForm.locationId,
              })}
              disabled={createMenuItem.isPending || !menuForm.name || !menuForm.locationId}
              className="bg-[#B87333] text-white hover:bg-[#9A6028]"
            >
              {createMenuItem.isPending ? "Aanmaken..." : "Item aanmaken"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CREATE GYM CLASS DIALOG ═══ */}
      <Dialog open={showCreateGymClass} onOpenChange={setShowCreateGymClass}>
        <DialogContent className="bg-[#111] border-white/[0.06] sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-light text-lg">Nieuwe gym les</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Les naam</label>
              <Input value={gymForm.className} onChange={(e) => setGymForm({ ...gymForm, className: e.target.value })} placeholder="Morning Yoga" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Instructeur</label>
                <Input value={gymForm.instructor} onChange={(e) => setGymForm({ ...gymForm, instructor: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Categorie</label>
                <Select value={gymForm.category} onValueChange={(v) => setGymForm({ ...gymForm, category: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["cardio", "strength", "yoga", "pilates", "hiit", "cycling", "boxing", "stretching", "meditation", "egym"].map(c => (
                      <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
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
                    {["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"].map((d, i) => (
                      <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Start</label>
                <Input value={gymForm.startTime} onChange={(e) => setGymForm({ ...gymForm, startTime: e.target.value })} placeholder="09:00" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Eind</label>
                <Input value={gymForm.endTime} onChange={(e) => setGymForm({ ...gymForm, endTime: e.target.value })} placeholder="10:00" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Max deelnemers</label>
                <Input type="number" value={gymForm.maxParticipants} onChange={(e) => setGymForm({ ...gymForm, maxParticipants: parseInt(e.target.value) })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Locatie</label>
                <Select value={gymForm.locationId.toString()} onValueChange={(v) => setGymForm({ ...gymForm, locationId: parseInt(v) })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue placeholder="Kies" /></SelectTrigger>
                  <SelectContent>
                    {(locations || []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateGymClass(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createGymClass.mutate({
                className: gymForm.className,
                instructor: gymForm.instructor || undefined,
                category: gymForm.category as any,
                dayOfWeek: gymForm.dayOfWeek,
                startTime: gymForm.startTime,
                endTime: gymForm.endTime,
                maxParticipants: gymForm.maxParticipants,
                locationId: gymForm.locationId,
              })}
              disabled={createGymClass.isPending || !gymForm.className || !gymForm.locationId}
              className="bg-[#8B6914] text-white hover:bg-[#6B5010]"
            >
              {createGymClass.isPending ? "Aanmaken..." : "Les aanmaken"}
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
              <Input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="Gym Scherm Template" className="mt-1 bg-white/[0.03] border-white/[0.06]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Schermtype</label>
                <Select value={templateForm.screenType} onValueChange={(v) => setTemplateForm({ ...templateForm, screenType: v })}>
                  <SelectTrigger className="mt-1 bg-white/[0.03] border-white/[0.06]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["reception", "gym", "kitchen", "wayfinding", "general", "meeting_room", "elevator", "parking"].map(t => (
                      <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}</SelectItem>
                    ))}
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
                <Input value={templateForm.defaultResolution} onChange={(e) => setTemplateForm({ ...templateForm, defaultResolution: e.target.value })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
              <div>
                <label className="text-[10px] text-[#888] tracking-[2px] uppercase font-medium">Helderheid (%)</label>
                <Input type="number" min={0} max={100} value={templateForm.defaultBrightness} onChange={(e) => setTemplateForm({ ...templateForm, defaultBrightness: parseInt(e.target.value) })} className="mt-1 bg-white/[0.03] border-white/[0.06]" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTemplate(false)} className="border-white/10 bg-transparent">Annuleren</Button>
            <Button
              onClick={() => createTemplate.mutate({
                name: templateForm.name,
                screenType: templateForm.screenType as any,
                defaultOrientation: templateForm.defaultOrientation as any,
                defaultResolution: templateForm.defaultResolution,
                defaultBrightness: templateForm.defaultBrightness,
              })}
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
