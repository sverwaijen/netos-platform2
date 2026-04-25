import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import AppShell from "./components/AppShell";

// Eagerly loaded (landing page)
import Home from "./pages/Home";

// Lazy-loaded admin/dashboard pages
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Locations = React.lazy(() => import("./pages/Locations"));
const LocationDetail = React.lazy(() => import("./pages/LocationDetail"));
const Bookings = React.lazy(() => import("./pages/Bookings"));
const WalletPage = React.lazy(() => import("./pages/WalletPage"));
const BundlesPage = React.lazy(() => import("./pages/BundlesPage"));
const Companies = React.lazy(() => import("./pages/Companies"));
const Visitors = React.lazy(() => import("./pages/Visitors"));
const SigningPage = React.lazy(() => import("./pages/SigningPage"));
const DevicesPage = React.lazy(() => import("./pages/DevicesPage"));
const NotificationsPage = React.lazy(() => import("./pages/NotificationsPage"));
const InvitesPage = React.lazy(() => import("./pages/InvitesPage"));
const SettingsPage = React.lazy(() => import("./pages/SettingsPage"));
const CrmPipeline = React.lazy(() => import("./pages/CrmPipeline"));
const CrmLeadDetail = React.lazy(() => import("./pages/CrmLeadDetail"));
const CrmCampaigns = React.lazy(() => import("./pages/CrmCampaigns"));
const CrmTemplates = React.lazy(() => import("./pages/CrmTemplates"));
const CrmMarketingFlow = React.lazy(() => import("./pages/CrmMarketingFlow"));
const ResourceManagement = React.lazy(() => import("./pages/ResourceManagement"));
const KioskDisplay = React.lazy(() => import("./pages/KioskDisplay"));
const ButlerKiosk = React.lazy(() => import("./pages/ButlerKiosk"));
const ButlerAdmin = React.lazy(() => import("./pages/ButlerAdmin"));
const ParkingAdmin = React.lazy(() => import("./pages/ParkingAdmin"));
const OperationsDashboard = React.lazy(() => import("./pages/OperationsDashboard"));
const EscalationDashboard = React.lazy(() => import("./pages/EscalationDashboard"));
const RoomControl = React.lazy(() => import("./pages/RoomControl"));
const CrmTriggers = React.lazy(() => import("./pages/CrmTriggers"));
const CrmLeadEntry = React.lazy(() => import("./pages/CrmLeadEntry"));
const CrmVisitors = React.lazy(() => import("./pages/CrmVisitors"));
const MemberDatabase = React.lazy(() => import("./pages/MemberDatabase"));
const ReEngagementFunnel = React.lazy(() => import("./pages/ReEngagementFunnel"));
const SignageDisplay = React.lazy(() => import("./pages/SignageDisplay"));
const MenuDashboard = React.lazy(() => import("./pages/MenuDashboard"));
const KitchenPrepDisplay = React.lazy(() => import("./pages/KitchenPrepDisplay"));
const UserRolesPage = React.lazy(() => import("./pages/UserRolesPage"));
const BudgetControlsPage = React.lazy(() => import("./pages/BudgetControlsPage"));
const CommitContractsPage = React.lazy(() => import("./pages/CommitContractsPage"));
const CreditAdminDashboard = React.lazy(() => import("./pages/CreditAdminDashboard"));
const BookingCalendar = React.lazy(() => import("./pages/BookingCalendar"));
const BookingApprovalPage = React.lazy(() => import("./pages/BookingApprovalPage"));
const RecurringBookingsPage = React.lazy(() => import("./pages/RecurringBookingsPage"));
const OnboardingPage = React.lazy(() => import("./pages/OnboardingPage"));
const ExecutiveDashboard = React.lazy(() => import("./pages/ExecutiveDashboard"));
const PaymentHistory = React.lazy(() => import("./pages/PaymentHistory"));
const ComponentShowcase = React.lazy(() => import("./pages/ComponentShowcase"));

// Lazy-loaded member app pages
const AppHome = React.lazy(() => import("./pages/app/AppHome"));
const AppBookings = React.lazy(() => import("./pages/app/AppBookings"));
const AppBookingNew = React.lazy(() => import("./pages/app/AppBookingNew"));
const AppWallet = React.lazy(() => import("./pages/app/AppWallet"));
const AppAccess = React.lazy(() => import("./pages/app/AppAccess"));
const AppProfile = React.lazy(() => import("./pages/app/AppProfile"));
const AppSupport = React.lazy(() => import("./pages/app/AppSupport"));
const AppParking = React.lazy(() => import("./pages/app/AppParking"));
const ParkingVisitor = React.lazy(() => import("./pages/app/ParkingVisitor"));
const AppOrder = React.lazy(() => import("./pages/app/AppOrder"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function WrappedPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </DashboardLayout>
  );
}

function WrappedApp({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Admin / Dashboard routes */}
      <Route path="/dashboard">{() => <WrappedPage component={Dashboard} />}</Route>
      <Route path="/executive">{() => <WrappedPage component={ExecutiveDashboard} />}</Route>
      <Route path="/locations/:slug">{() => <DashboardLayout><Suspense fallback={<PageLoader />}><LocationDetail /></Suspense></DashboardLayout>}</Route>
      <Route path="/locations">{() => <WrappedPage component={Locations} />}</Route>
      <Route path="/bookings/calendar">{() => <WrappedPage component={BookingCalendar} />}</Route>
      <Route path="/bookings/approvals">{() => <WrappedPage component={BookingApprovalPage} />}</Route>
      <Route path="/bookings/recurring">{() => <WrappedPage component={RecurringBookingsPage} />}</Route>
      <Route path="/bookings">{() => <WrappedPage component={Bookings} />}</Route>
      <Route path="/wallet">{() => <WrappedPage component={WalletPage} />}</Route>
      <Route path="/bundles">{() => <WrappedPage component={BundlesPage} />}</Route>
      <Route path="/payments">{() => <WrappedPage component={PaymentHistory} />}</Route>
      <Route path="/companies">{() => <WrappedPage component={Companies} />}</Route>
      <Route path="/visitors">{() => <WrappedPage component={Visitors} />}</Route>
      <Route path="/signing">{() => <WrappedPage component={SigningPage} />}</Route>
      <Route path="/devices">{() => <WrappedPage component={DevicesPage} />}</Route>
      <Route path="/notifications">{() => <WrappedPage component={NotificationsPage} />}</Route>
      <Route path="/invites">{() => <WrappedPage component={InvitesPage} />}</Route>
      <Route path="/onboarding">{() => <WrappedPage component={OnboardingPage} />}</Route>
      <Route path="/settings/roles">{() => <WrappedPage component={UserRolesPage} />}</Route>
      <Route path="/settings">{() => <WrappedPage component={SettingsPage} />}</Route>
      <Route path="/crm/leads/:id">{() => <DashboardLayout><Suspense fallback={<PageLoader />}><CrmLeadDetail /></Suspense></DashboardLayout>}</Route>
      <Route path="/crm/campaigns">{() => <WrappedPage component={CrmCampaigns} />}</Route>
      <Route path="/crm/templates">{() => <WrappedPage component={CrmTemplates} />}</Route>
      <Route path="/crm/flow">{() => <WrappedPage component={CrmMarketingFlow} />}</Route>
      <Route path="/crm/triggers">{() => <WrappedPage component={CrmTriggers} />}</Route>
      <Route path="/crm/new-lead">{() => <WrappedPage component={CrmLeadEntry} />}</Route>
      <Route path="/crm/visitors">{() => <WrappedPage component={CrmVisitors} />}</Route>
      <Route path="/crm">{() => <WrappedPage component={CrmPipeline} />}</Route>
      <Route path="/members">{() => <WrappedPage component={MemberDatabase} />}</Route>
      <Route path="/re-engagement">{() => <WrappedPage component={ReEngagementFunnel} />}</Route>
      <Route path="/resources">{() => <WrappedPage component={ResourceManagement} />}</Route>
      <Route path="/butler/admin">{() => <WrappedPage component={ButlerAdmin} />}</Route>
      <Route path="/parking">{() => <WrappedPage component={ParkingAdmin} />}</Route>
      <Route path="/operations">{() => <WrappedPage component={OperationsDashboard} />}</Route>
      <Route path="/escalations">{() => <WrappedPage component={EscalationDashboard} />}</Route>
      <Route path="/room-control">{() => <WrappedPage component={RoomControl} />}</Route>
      <Route path="/budget-controls">{() => <WrappedPage component={BudgetControlsPage} />}</Route>
      <Route path="/commit-contracts">{() => <WrappedPage component={CommitContractsPage} />}</Route>
      <Route path="/credits/admin">{() => <WrappedPage component={CreditAdminDashboard} />}</Route>
      <Route path="/menu">{() => <WrappedPage component={MenuDashboard} />}</Route>
      <Route path="/showcase">{() => <Suspense fallback={<PageLoader />}><ComponentShowcase /></Suspense>}</Route>
      {/* Standalone kiosk routes */}
      <Route path="/butler">{() => <Suspense fallback={<PageLoader />}><ButlerKiosk /></Suspense>}</Route>
      <Route path="/kiosk/display">{() => <Suspense fallback={<PageLoader />}><KioskDisplay /></Suspense>}</Route>
      <Route path="/signage/display">{() => <Suspense fallback={<PageLoader />}><SignageDisplay /></Suspense>}</Route>
      {/* Public parking visitor page */}
      <Route path="/parking/visitor/:qrToken">{() => <Suspense fallback={<PageLoader />}><ParkingVisitor /></Suspense>}</Route>
      <Route path="/kitchen/prep">{() => <Suspense fallback={<PageLoader />}><KitchenPrepDisplay /></Suspense>}</Route>
      {/* Member App routes (mobile-first PWA) */}
      <Route path="/app/bookings/new">{() => <WrappedApp component={AppBookingNew} />}</Route>
      <Route path="/app/order">{() => <WrappedApp component={AppOrder} />}</Route>
      <Route path="/app/bookings">{() => <WrappedApp component={AppBookings} />}</Route>
      <Route path="/app/wallet">{() => <WrappedApp component={AppWallet} />}</Route>
      <Route path="/app/access">{() => <WrappedApp component={AppAccess} />}</Route>
      <Route path="/app/parking">{() => <WrappedApp component={AppParking} />}</Route>
      <Route path="/app/support">{() => <WrappedApp component={AppSupport} />}</Route>
      <Route path="/app/profile">{() => <WrappedApp component={AppProfile} />}</Route>
      <Route path="/app">{() => <WrappedApp component={AppHome} />}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
