import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WelcomePopup } from "@/components/welcome-popup";
import Home from "@/pages/home";
import AdminLoginQR from "@/pages/admin-login-qr";
import AdminDashboard from "@/pages/admin-dashboard";
import EmailLogin from "@/pages/email-login";
import EmailInbox from "@/pages/email-inbox";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminLoginQR} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/homepage-content" component={AdminDashboard} />
      <Route path="/admin/articles" component={AdminDashboard} />
      <Route path="/admin/team" component={AdminDashboard} />
      <Route path="/admin/pricing" component={AdminDashboard} />
      <Route path="/admin/bookings" component={AdminDashboard} />
      <Route path="/admin/inquiries" component={AdminDashboard} />
      <Route path="/admin/communications" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminDashboard} />
      <Route path="/admin/popup-forms" component={AdminDashboard} />
      <Route path="/admin/settings" component={AdminDashboard} />
      <Route path="/admin/social-media" component={AdminDashboard} />
      <Route path="/admin/social-media-integration" component={AdminDashboard} />
      <Route path="/admin/email-settings" component={AdminDashboard} />
      <Route path="/email/login" component={EmailLogin} />
      <Route path="/email/inbox" component={EmailInbox} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <WelcomePopup />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
