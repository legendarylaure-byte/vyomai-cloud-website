import { useLocation, Link } from "wouter";
import {
  LogOut, BarChart3, FileText, Users, DollarSign, BookOpen, MessageSquare, Settings,
  Home, Share2, Mail, Menu, X, ChevronRight, Sparkles, UserCog, ExternalLink
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LaunchTimer } from "@/components/launch-timer";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("vyomai-admin-token");
    setLocation("/admin");
  };

  const menuGroups: MenuGroup[] = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
      ],
    },
    {
      title: "Content Management",
      items: [
        { label: "Home Page", href: "/admin/homepage-content", icon: Home },
        { label: "Articles & Media", href: "/admin/articles", icon: FileText },
        { label: "Team Members", href: "/admin/team", icon: Users },
      ],
    },
    {
      title: "Business",
      items: [
        { label: "Pricing Plans", href: "/admin/pricing", icon: DollarSign },
        { label: "Communications", href: "/admin/communications", icon: MessageSquare },
      ],
    },
    {
      title: "Integrations",
      items: [
        { label: "Social Media", href: "/admin/social-media-integration", icon: Share2 },
      ],
    },
    {
      title: "System",
      items: [
        { label: "User Management", href: "/admin/users", icon: UserCog },
        { label: "Popup Forms", href: "/admin/popup-forms", icon: Sparkles },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  const allItems = menuGroups.flatMap(group => group.items);
  const currentPage = allItems.find(item => location?.includes(item.href));

  return (
    <div className="flex h-screen bg-gray-100">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300",
          sidebarOpen ? "w-72" : "w-20"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <h1 className="text-gray-900 font-bold text-lg">VyomAi</h1>
                <p className="text-gray-500 text-xs">Admin Panel</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.title} className={cn("mb-6", groupIndex === 0 && "mb-4")}>
              {sidebarOpen && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location?.includes(item.href);
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} to={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all",
                          isActive
                            ? "bg-purple-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <Icon className={cn("w-5 h-5 flex-shrink-0", !sidebarOpen && "mx-auto")} />
                        {sidebarOpen && (
                          <>
                            <span className="font-medium text-[15px]">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                                {item.badge}
                              </span>
                            )}
                            {isActive && (
                              <ChevronRight className="w-4 h-4 ml-auto" />
                            )}
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors",
              !sidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarOpen ? "ml-72" : "ml-20"
      )}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {currentPage?.label || "Dashboard"}
            </h2>
            <p className="text-sm text-gray-500">
              Manage your {currentPage?.label?.toLowerCase() || "platform"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Header Actions */}
            <div className="flex items-center gap-4">
              {/* Permanent Animated Date Display */}
              {/* Permanent Animated Date Display */}
              <LaunchTimer />

              <a href="/" target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md group"
                >
                  <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                  View Site
                </Button>
              </a>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>Admin</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto bg-muted/20">
          <div className="container max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
