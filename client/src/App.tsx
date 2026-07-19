import { Switch, Route, useLocation } from "wouter";
import { useEffect, useMemo, Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { WelcomePopup } from "@/components/welcome-popup";
import { ErrorBoundary } from "@/components/error-boundary";
import { PageTransition } from "@/components/page-transition";
import { SmartSearchModal } from "@/components/smart-search";
import { FloatingWidgets } from "@/components/floating-widgets";
import { MotionConfig } from "framer-motion";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

const AdminLoginQR = lazy(() => import("@/pages/admin-login-qr"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const EmailLogin = lazy(() => import("@/pages/email-login"));
const EmailInbox = lazy(() => import("@/pages/email-inbox"));
const TermsOfService = lazy(() => import("@/pages/terms-of-service"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const CookiePolicy = lazy(() => import("@/pages/cookie-policy"));

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function RouteSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <PageTransition>
      <Suspense fallback={<RouteSpinner />}>
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
          <Route path="/admin/analytics" component={AdminDashboard} />
          <Route path="/admin/testimonials" component={AdminDashboard} />
          <Route path="/admin/faq" component={AdminDashboard} />
          <Route path="/admin/leads" component={AdminDashboard} />
          <Route path="/admin/lead/:id" component={AdminDashboard} />
          <Route path="/email/login" component={EmailLogin} />
          <Route path="/email/inbox" component={EmailInbox} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/cookies" component={CookiePolicy} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </PageTransition>
  );
}

function App() {
  const [location] = useLocation();
  const isPublicRoute = !location.startsWith('/admin') && !location.startsWith('/email');
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => preloader.remove(), 600);
    }
  }, []);

  // Track page views for GA4 on route changes
  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: location,
        page_title: document.title,
      });
    }
  }, [location]);

  const content = (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <a href="#main-content" className="skip-to-content">
            Skip to content
          </a>
          <Toaster />
          {isPublicRoute && <WelcomePopup />}
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
          <SmartSearchModal />
          {isPublicRoute && <FloatingWidgets />}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </MotionConfig>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
  }

  return content;
}

export default App;
