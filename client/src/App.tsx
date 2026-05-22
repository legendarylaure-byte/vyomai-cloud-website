import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { WelcomePopup } from "@/components/welcome-popup";
import Home from "@/pages/home";
import AdminLoginQR from "@/pages/admin-login-qr";
import AdminDashboard from "@/pages/admin-dashboard";
import EmailLogin from "@/pages/email-login";
import EmailInbox from "@/pages/email-inbox";
import AdminSignup from "@/pages/admin-signup";
import NotFound from "@/pages/not-found";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin" component={AdminLoginQR} />
      <Route path="/admin/signup" component={AdminSignup} />
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
      <Route path="/admin/analytics" component={AdminDashboard} />
      <Route path="/admin/testimonials" component={AdminDashboard} />
      <Route path="/admin/faq" component={AdminDashboard} />
      <Route path="/admin/leads" component={AdminDashboard} />
      <Route path="/admin/lead/:id" component={AdminDashboard} />
      <Route path="/admin/faq" component={AdminDashboard} />
      <Route path="/email/login" component={EmailLogin} />
      <Route path="/email/inbox" component={EmailInbox} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const content = (
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

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId} useOneTap={false} cancel_on_tap_outside={false}>{content}</GoogleOAuthProvider>;
  }

  return content;
}

export default App;
