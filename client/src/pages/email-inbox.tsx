import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, LogOut, Search, Inbox, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

export default function EmailInbox() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("vyomai-email-token");
    if (!token) {
      setLocation("/email/login");
    }
  }, [setLocation]);

  const { data: emails = [], isLoading } = useQuery<EmailMessage[]>({
    queryKey: ["/api/email/inbox"],
    enabled: !!localStorage.getItem("vyomai-email-token"),
    queryFn: async () => {
      const token = localStorage.getItem("vyomai-email-token");
      const email = localStorage.getItem("vyomai-email-address");
      if (!token || !email) {
        throw new Error("Not authenticated");
      }
      const response = await fetch(`/api/email/inbox?email=${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }
      return response.json();
    },
  });

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("vyomai-email-token");
    localStorage.removeItem("vyomai-email-address");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    setLocation("/email/login");
  };

  const userEmail = localStorage.getItem("vyomai-email-address");

  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Email</h1>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
            data-testid="button-logout-email"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 sm:p-6 lg:p-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-card/50 border-border/50">
              <Button className="w-full gap-2 mb-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold" data-testid="button-compose-email">
                <Send className="w-4 h-4" />
                Compose Email
              </Button>

              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-medium transition-colors" data-testid="button-inbox-nav">
                  <Inbox className="w-5 h-5" />
                  <span>Inbox</span>
                  <span className="ml-auto text-sm bg-primary text-white px-2 py-1 rounded">
                    {filteredEmails.length}
                  </span>
                </button>
              </nav>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50"
                  data-testid="input-search-email"
                />
              </div>
            </div>

            {/* Email List or Detail */}
            {selectedEmail ? (
              <Card className="bg-card/50 border-border/50 p-6">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-primary hover:underline mb-4 font-medium"
                  data-testid="button-back-inbox"
                >
                  ← Back to Inbox
                </button>

                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedEmail.subject}</h2>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>
                        <span className="font-semibold">From:</span> {selectedEmail.from}
                      </p>
                      <p>
                        <span className="font-semibold">To:</span> {selectedEmail.to}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span>{" "}
                        {formatDistanceToNow(new Date(selectedEmail.date), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-4">
                    <div className="prose dark:prose-invert max-w-none text-foreground whitespace-pre-wrap">
                      {selectedEmail.body}
                    </div>
                  </div>
                </div>
              </Card>
            ) : isLoading ? (
              <Card className="bg-card/50 border-border/50 p-8 text-center">
                <div className="space-y-4">
                  <div className="inline-block p-3 rounded-lg bg-primary/10">
                    <Mail className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <p className="text-muted-foreground">Loading emails...</p>
                </div>
              </Card>
            ) : filteredEmails.length === 0 ? (
              <Card className="bg-card/50 border-border/50 p-8 text-center">
                <div className="space-y-4">
                  <div className="inline-block p-3 rounded-lg bg-primary/10">
                    <Inbox className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground">
                    {searchQuery ? "No emails match your search" : "Your inbox is empty"}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredEmails.map((email) => (
                  <Card
                    key={email.id}
                    className="p-4 bg-card/50 border-border/50 cursor-pointer hover:bg-card/70 transition-colors"
                    onClick={() => setSelectedEmail(email)}
                    data-testid={`email-row-${email.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {email.from}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {email.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(email.date), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!email.read && (
                        <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
