import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { usePermissions } from "@/hooks/usePermissions";
import { useTheme } from "@/contexts/ThemeContext";
import { BRAND } from "@/lib/brand";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  MapPin,
  Calendar,
  Wallet,
  Building2,
  Users,
  Monitor,
  Cpu,
  Bell,
  UserPlus,
  Settings,
  CreditCard,
  Target,
  Mail,
  FileText,
  Layers,
  Coffee,
  Car,
  Ticket,
  Thermometer,
  Zap,
  Eye,
  UsersRound,
  Crosshair,
  Key,
  ChefHat,
  ChevronRight,
  Sun,
  Moon,
  Shield,
  FileSignature,
  BarChart3,
  TrendingUp,
  Leaf,
  type LucideIcon,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import type { Permission } from "@shared/roles";

// ── Types ───────────────────────────────────────────────────────────
interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  /** Permission required to see this item. Omit = visible to all authenticated users */
  permission?: Permission;
}

interface NavCategory {
  label: string;
  icon: LucideIcon;
  /** Permission required to see this category. Omit = visible to all */
  permission?: Permission;
  items: NavItem[];
}

// ── Navigation structure ────────────────────────────────────────────
const navCategories: NavCategory[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", permission: "dashboard.view" },
    ],
  },
  {
    label: "Spaces",
    icon: MapPin,
    items: [
      { icon: MapPin, label: "Locations", path: "/locations", permission: "locations.view" },
      { icon: Layers, label: "Resources", path: "/resources", permission: "resources.view" },
      { icon: Calendar, label: "Bookings", path: "/bookings", permission: "bookings.view" },
      { icon: Calendar, label: "Calendar", path: "/bookings/calendar", permission: "bookings.view" },
      { icon: Thermometer, label: "Room Control", path: "/room-control", permission: "roomcontrol.view" },
    ],
  },
  {
    label: "People",
    icon: Users,
    items: [
      { icon: UsersRound, label: "Members", path: "/members", permission: "members.view" },
      { icon: Building2, label: "Companies", path: "/companies", permission: "companies.view" },
      { icon: Users, label: "Visitors", path: "/visitors", permission: "visitors.view" },
      { icon: UserPlus, label: "Invites", path: "/invites", permission: "invites.view" },
    ],
  },
  {
    label: "Finance",
    icon: Wallet,
    items: [
      { icon: Wallet, label: "Credits & Wallet", path: "/wallet", permission: "wallet.view" },
      { icon: CreditCard, label: "Plans & Packages", path: "/bundles", permission: "bundles.view" },
      { icon: Shield, label: "Budget Controls", path: "/budget-controls", permission: "budget_controls.view" },
      { icon: FileSignature, label: "Commit Contracts", path: "/commit-contracts", permission: "commit_contracts.view" },
      { icon: BarChart3, label: "Credit Admin", path: "/credits/admin", permission: "credits.manage" },
    ],
  },
  {
    label: "CRM",
    icon: Target,
    permission: "crm.view",
    items: [
      { icon: Target, label: "Pipeline", path: "/crm", permission: "crm.view" },
      { icon: TrendingUp, label: "Guest Conversion", path: "/crm/conversion", permission: "crm.view" },
      { icon: Zap, label: "Marketing Flow", path: "/crm/flow", permission: "crm.manage" },
      { icon: Crosshair, label: "Triggers", path: "/crm/triggers", permission: "crm.manage" },
      { icon: Eye, label: "Website Bezoekers", path: "/crm/visitors", permission: "crm.view" },
      { icon: Mail, label: "Campaigns", path: "/crm/campaigns", permission: "crm.manage" },
      { icon: FileText, label: "Templates", path: "/crm/templates", permission: "crm.manage" },
      { icon: Key, label: "Re-Engagement", path: "/re-engagement", permission: "reengagement.view" },
    ],
  },
  {
    label: "Operations",
    icon: Ticket,
    permission: "operations.view",
    items: [
      { icon: Ticket, label: "Operations", path: "/operations", permission: "operations.view" },
      { icon: Car, label: "Parking", path: "/parking", permission: "parking.view" },
      { icon: Coffee, label: "Butler Kiosk", path: "/butler/admin", permission: "butler.view" },
      { icon: ChefHat, label: "Menukaart", path: "/menu", permission: "menu.view" },
      { icon: Monitor, label: "Signage", path: "/signing", permission: "signage.view" },
    ],
  },
  {
    label: "System",
    icon: Cpu,
    permission: "devices.view",
    items: [
      { icon: Cpu, label: "Devices & IoT", path: "/devices", permission: "devices.view" },
      { icon: Bell, label: "Notifications", path: "/notifications", permission: "notifications.view" },
      { icon: Shield, label: "User Roles", path: "/settings/roles", permission: "roles.view" },
      { icon: Settings, label: "Settings", path: "/settings", permission: "settings.view" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSED_CATEGORIES_KEY = "sidebar-collapsed-categories";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="flex flex-col items-center gap-6 p-6 md:p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 mb-3">
              <img src={BRAND.logo} alt="Mr. Green" className="h-5 md:h-6 opacity-80" />
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-center text-foreground">
              Sign in to continue
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground text-center max-w-sm">
              Access to the SKYNET platform requires authentication.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all text-sm md:text-base"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { can } = usePermissions();
  const { theme, toggleTheme, switchable } = useTheme();

  // Track which categories are open
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_CATEGORIES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default: all open
    return Object.fromEntries(navCategories.map((c) => [c.label, true]));
  });

  useEffect(() => {
    localStorage.setItem(COLLAPSED_CATEGORIES_KEY, JSON.stringify(openCategories));
  }, [openCategories]);

  const toggleCategory = (label: string) => {
    setOpenCategories((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Find active menu item label for mobile header
  const activeLabel = navCategories
    .flatMap((c) => c.items)
    .find((item) => location.startsWith(item.path))?.label ?? "SKYNET";

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft =
        sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Close mobile sidebar on navigation
  const handleNavClick = (path: string) => {
    setLocation(path);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Filter categories and items based on permissions
  const visibleCategories = navCategories
    .filter((cat) => !cat.permission || can(cat.permission))
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => !item.permission || can(item.permission)),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img src={BRAND.logo} alt="Mr. Green" className="h-4 shrink-0 opacity-80" />
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            {visibleCategories.map((category) => (
              <SidebarGroup key={category.label} className="py-0.5">
                {isCollapsed ? (
                  /* When collapsed, show items as icon-only buttons */
                  <SidebarMenu className="px-2">
                    {category.items.map((item) => {
                      const isActive = location.startsWith(item.path);
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => handleNavClick(item.path)}
                            tooltip={item.label}
                            className="h-9 transition-all font-normal"
                          >
                            <item.icon
                              className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                            />
                            <span className="truncate">{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                ) : (
                  /* When expanded, show collapsible categories */
                  <Collapsible
                    open={openCategories[category.label] ?? true}
                    onOpenChange={() => toggleCategory(category.label)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel className="cursor-pointer select-none hover:bg-accent/50 rounded-md transition-colors px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between group/label">
                        <div className="flex items-center gap-2">
                          <category.icon className="h-3.5 w-3.5" />
                          <span>{category.label}</span>
                        </div>
                        <ChevronRight
                          className={`h-3 w-3 transition-transform duration-200 ${
                            openCategories[category.label] ? "rotate-90" : ""
                          }`}
                        />
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarGroupContent>
                        <SidebarMenu className="px-2">
                          {category.items.map((item) => {
                            const isActive = location.startsWith(item.path);
                            return (
                              <SidebarMenuItem key={item.path}>
                                <SidebarMenuButton
                                  isActive={isActive}
                                  onClick={() => handleNavClick(item.path)}
                                  tooltip={item.label}
                                  className="h-9 transition-all font-normal pl-5"
                                >
                                  <item.icon
                                    className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`}
                                  />
                                  <span className="truncate">{item.label}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3 space-y-2">
            {/* Theme toggle */}
            {switchable && (
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/50 transition-colors w-full text-left text-sm text-muted-foreground group-data-[collapsible=icon]:justify-center"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0" />
                )}
                <span className="group-data-[collapsible=icon]:hidden truncate">
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </button>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-primary/30 shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleNavClick("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        {!isMobile && (
          <div
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
            onMouseDown={() => {
              if (isCollapsed) return;
              setIsResizing(true);
            }}
            style={{ zIndex: 50 }}
          />
        )}
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background shrink-0" />
              <img src={BRAND.logo} alt="Mr. Green" className="h-3.5 opacity-80 shrink-0" />
              <span className="tracking-tight text-foreground font-medium text-sm truncate">
                {activeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {switchable && (
                <button
                  onClick={toggleTheme}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-accent/50 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleNavClick("/settings")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </SidebarInset>
    </>
  );
}
