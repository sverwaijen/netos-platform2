import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Locations from "./pages/Locations";
import LocationDetail from "./pages/LocationDetail";
import Bookings from "./pages/Bookings";
import WalletPage from "./pages/WalletPage";
import BundlesPage from "./pages/BundlesPage";
import Companies from "./pages/Companies";
import Visitors from "./pages/Visitors";
import SigningPage from "./pages/SigningPage";
import DevicesPage from "./pages/DevicesPage";
import NotificationsPage from "./pages/NotificationsPage";
import InvitesPage from "./pages/InvitesPage";
import SettingsPage from "./pages/SettingsPage";
import CrmPipeline from "./pages/CrmPipeline";
import CrmLeadDetail from "./pages/CrmLeadDetail";
import CrmCampaigns from "./pages/CrmCampaigns";
import CrmTemplates from "./pages/CrmTemplates";
import CrmMarketingFlow from "./pages/CrmMarketingFlow";
import ResourceManagement from "./pages/ResourceManagement";
import KioskDisplay from "./pages/KioskDisplay";
import ButlerKiosk from "./pages/ButlerKiosk";
import ButlerAdmin from "./pages/ButlerAdmin";
import DashboardLayout from "./components/DashboardLayout";
import ParkingAdmin from "./pages/ParkingAdmin";
import OperationsDashboard from "./pages/OperationsDashboard";
import RoomControl from "./pages/RoomControl";
import CrmTriggers from "./pages/CrmTriggers";
import CrmLeadEntry from "./pages/CrmLeadEntry";
import CrmVisitors from "./pages/CrmVisitors";
import MemberDatabase from "./pages/MemberDatabase";
import ReEngagementFunnel from "./pages/ReEngagementFunnel";
import AppShell from "./components/AppShell";
import AppHome from "./pages/app/AppHome";
import AppBookings from "./pages/app/AppBookings";
import AppWallet from "./pages/app/AppWallet";
import AppAccess from "./pages/app/AppAccess";
import AppProfile from "./pages/app/AppProfile";
import AppSupport from "./pages/app/AppSupport";
import AppParking from "./pages/app/AppParking";
import ParkingVisitor from "./pages/app/ParkingVisitor";
import SignageDisplay from "./pages/SignageDisplay";
import MenuDashboard from "./pages/MenuDashboard";
import KitchenPrepDisplay from "./pages/KitchenPrepDisplay";
import UserRolesPage from "./pages/UserRolesPage";

function WrappedPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function WrappedApp({ component: Component }: { component: React.ComponentType }) {
  return (
    <AppShell>
      <Component />
    </AppShell>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Admin / Dashboard routes */}
      <Route path="/dashboard">{() => <WrappedPage component={Dashboard} />}</Route>
      <Route path="/locations/:slug">{() => <DashboardLayout><LocationDetail /></DashboardLayout>}</Route>
      <Route path="/locations">{() => <WrappedPage component={Locations} />}</Route>
      <Route path="/bookings">{() => <WrappedPage component={Bookings} />}</Route>
      <Route path="/wallet">{() => <WrappedPage component={WalletPage} />}</Route>
      <Route path="/bundles">{() => <WrappedPage component={BundlesPage} />}</Route>
      <Route path="/companies">{() => <WrappedPage component={Companies} />}</Route>
      <Route path="/visitors">{() => <WrappedPage component={Visitors} />}</Route>
      <Route path="/signing">{() => <WrappedPage component={SigningPage} />}</Route>
      <Route path="/devices">{() => <WrappedPage component={DevicesPage} />}</Route>
      <Route path="/notifications">{() => <WrappedPage component={NotificationsPage} />}</Route>
      <Route path="/invites">{() => <WrappedPage component={InvitesPage} />}</Route>
      <Route path="/settings/roles">{() => <WrappedPage component={UserRolesPage} />}</Route>
      <Route path="/settings">{() => <WrappedPage component={SettingsPage} />}</Route>
      <Route path="/crm/leads/:id">{() => <DashboardLayout><CrmLeadDetail /></DashboardLayout>}</Route>
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
      <Route path="/room-control">{() => <WrappedPage component={RoomControl} />}</Route>
      <Route path="/menu">{() => <WrappedPage component={MenuDashboard} />}</Route>
      {/* Standalone kiosk routes */}
      <Route path="/butler">{() => <ButlerKiosk />}</Route>
      <Route path="/kiosk/display" component={KioskDisplay} />
      <Route path="/signage/display" component={SignageDisplay} />
      {/* Public parking visitor page */}
      <Route path="/parking/visitor/:qrToken" component={ParkingVisitor} />
      <Route path="/kitchen/prep" component={KitchenPrepDisplay} />
      {/* Member App routes (mobile-first PWA) */}
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
