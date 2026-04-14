import { lazy } from "react";

// ─── Admin/Dashboard Pages ───────────────────────────────────────────
export const LazyHome = lazy(() => import("@/pages/Home"));
export const LazyDashboard = lazy(() => import("@/pages/Dashboard"));
export const LazyLocations = lazy(() => import("@/pages/Locations"));
export const LazyLocationDetail = lazy(() => import("@/pages/LocationDetail"));
export const LazyBookings = lazy(() => import("@/pages/Bookings"));
export const LazyWalletPage = lazy(() => import("@/pages/WalletPage"));
export const LazyBundlesPage = lazy(() => import("@/pages/BundlesPage"));
export const LazyCompanies = lazy(() => import("@/pages/Companies"));
export const LazyVisitors = lazy(() => import("@/pages/Visitors"));
export const LazySigningPage = lazy(() => import("@/pages/SigningPage"));
export const LazyDevicesPage = lazy(() => import("@/pages/DevicesPage"));
export const LazyNotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
export const LazyInvitesPage = lazy(() => import("@/pages/InvitesPage"));
export const LazySettingsPage = lazy(() => import("@/pages/SettingsPage"));

// ─── CRM Pages ──────────────────────────────────────────────────────
export const LazyCrmPipeline = lazy(() => import("@/pages/CrmPipeline"));
export const LazyCrmLeadDetail = lazy(() => import("@/pages/CrmLeadDetail"));
export const LazyCrmCampaigns = lazy(() => import("@/pages/CrmCampaigns"));
export const LazyCrmTemplates = lazy(() => import("@/pages/CrmTemplates"));
export const LazyCrmMarketingFlow = lazy(() => import("@/pages/CrmMarketingFlow"));
export const LazyCrmTriggers = lazy(() => import("@/pages/CrmTriggers"));
export const LazyCrmLeadEntry = lazy(() => import("@/pages/CrmLeadEntry"));
export const LazyCrmVisitors = lazy(() => import("@/pages/CrmVisitors"));

// ─── Resource & Operations Pages ────────────────────────────────
export const LazyResourceManagement = lazy(() => import("@/pages/ResourceManagement"));
export const LazyKioskDisplay = lazy(() => import("@/pages/KioskDisplay"));
export const LazyButlerKiosk = lazy(() => import("@/pages/ButlerKiosk"));
export const LazyButlerAdmin = lazy(() => import("@/pages/ButlerAdmin"));
export const LazyParkingAdmin = lazy(() => import("@/pages/ParkingAdmin"));
export const LazyOperationsDashboard = lazy(() => import("@/pages/OperationsDashboard"));
export const LazyRoomControl = lazy(() => import("@/pages/RoomControl"));

// ─── Member Database & Analytics Pages ──────────────────────────
export const LazyMemberDatabase = lazy(() => import("@/pages/MemberDatabase"));
export const LazyReEngagementFunnel = lazy(() => import("@/pages/ReEngagementFunnel"));

// ─── App Shell Pages (Mobile/Responsive) ────────────────────────
export const LazyAppHome = lazy(() => import("@/pages/app/AppHome"));
export const LazyAppBookings = lazy(() => import("@/pages/app/AppBookings"));
export const LazyAppBookingNew = lazy(() => import("@/pages/app/AppBookingNew"));
export const LazyAppWallet = lazy(() => import("@/pages/app/AppWallet"));
export const LazyAppAccess = lazy(() => import("@/pages/app/AppAccess"));
export const LazyAppProfile = lazy(() => import("@/pages/app/AppProfile"));
export const LazyAppSupport = lazy(() => import("@/pages/app/AppSupport"));
export const LazyAppParking = lazy(() => import("@/pages/app/AppParking"));
export const LazyParkingVisitor = lazy(() => import("@/pages/app/ParkingVisitor"));

// ─── Signage & Display Pages ────────────────────────────────────
export const LazySignageDisplay = lazy(() => import("@/pages/SignageDisplay"));
export const LazyMenuDashboard = lazy(() => import("@/pages/MenuDashboard"));
export const LazyKitchenPrepDisplay = lazy(() => import("@/pages/KitchenPrepDisplay"));

// ─── User Management Pages ──────────────────────────────────────
export const LazyUserRolesPage = lazy(() => import("@/pages/UserRolesPage"));
export const LazyBudgetControlsPage = lazy(() => import("@/pages/BudgetControlsPage"));
export const LazyCommitContractsPage = lazy(() => import("@/pages/CommitContractsPage"));
export const LazyCreditAdminDashboard = lazy(() => import("@/pages/CreditAdminDashboard"));
export const LazyCleaningDashboard = lazy(() => import("@/pages/CleaningDashboard"));
export const LazyMaintenanceDashboard = lazy(() => import("@/pages/MaintenanceDashboard"));
export const LazyIncidentEscalation = lazy(() => import("@/pages/IncidentEscalation"));

// ─── Catch-all ──────────────────────────────────────────────────
export const LazyNotFound = lazy(() => import("@/pages/NotFound"));
