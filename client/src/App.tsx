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
import DashboardLayout from "./components/DashboardLayout";

function WrappedPage({ component: Component }: { component: React.ComponentType }) {
  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard">{() => <WrappedPage component={Dashboard} />}</Route>
      <Route path="/locations/:slug">{(params) => <DashboardLayout><LocationDetail /></DashboardLayout>}</Route>
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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
