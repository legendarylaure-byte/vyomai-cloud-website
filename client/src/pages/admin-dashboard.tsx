import { useEffect, lazy, Suspense } from "react";
import { useLocation, Route, Switch } from "wouter";
import { AdminLayout } from "@/pages/admin/layout";
import { AdminDashboard } from "@/pages/admin/dashboard";
import { ArticlesPage } from "@/pages/admin/articles";
import { TeamPage } from "@/pages/admin/team";
import { PricingPage } from "@/pages/admin/pricing";
import { BookingsPage } from "@/pages/admin/bookings";
import { InquiriesPage } from "@/pages/admin/inquiries";
import { CommunicationsPage } from "@/pages/admin/communications";
import { SettingsPage } from "@/pages/admin/settings";
import { PopupFormsPage } from "@/pages/admin/popup-forms";
import { HomepageContentPage } from "@/pages/admin/homepage-content";
import { UsersPage } from "@/pages/admin/users";
import SocialMediaAdmin from "@/pages/admin/social-media";

import { SocialMediaIntegrationPage } from "@/pages/admin/social-media-integration";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AdminDashboardRouter() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("vyomai-admin-token");
    if (!token) {
      setLocation("/admin");
    }
  }, [setLocation]);

  return (
    <Switch>

      <Route>
        <AdminLayout>
          <Switch>
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin/homepage-content" component={HomepageContentPage} />
            <Route path="/admin/articles" component={ArticlesPage} />
            <Route path="/admin/team" component={TeamPage} />
            <Route path="/admin/pricing" component={PricingPage} />
            <Route path="/admin/bookings" component={BookingsPage} />
            <Route path="/admin/inquiries" component={InquiriesPage} />
            <Route path="/admin/communications" component={CommunicationsPage} />
            <Route path="/admin/users" component={UsersPage} />
            <Route path="/admin/social-media-integration" component={SocialMediaIntegrationPage} />
            <Route path="/admin/social-media" component={SocialMediaIntegrationPage} />
            <Route path="/admin/popup-forms" component={PopupFormsPage} />
            <Route path="/admin/settings" component={SettingsPage} />
            <Route path="/admin" component={AdminDashboard} />
          </Switch>
        </AdminLayout>
      </Route>
    </Switch>
  );
}
