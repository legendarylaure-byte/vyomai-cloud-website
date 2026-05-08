import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Video, Presentation, ExternalLink, Clock, BookOpen, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import type { Article } from "@shared/schema";

const typeIcons = {
  article: FileText,
  video: Video,
  demo: Presentation,
};

const typeEmojis = {
  article: "📚",
  video: "🎥",
  demo: "🚀",
};

export function MediaSection() {
  const { ref, isVisible } = useScrollAnimation();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const publishedArticles = articles?.filter((a) => a.published) || [];
  
  // Filter articles based on active tab - show ALL content for "all" tab
  const getFilteredArticles = () => {
    if (activeTab === "all") {
      // Return ALL published articles for the "All" tab
      return publishedArticles;
    }
    
    // For specific types, show all of that type
    return publishedArticles.filter((a) => a.type === activeTab);
  };
  
  const filteredArticles = getFilteredArticles();
  const featuredArticle = publishedArticles[0];
  const otherArticles = filteredArticles.filter(a => a.id !== featuredArticle?.id);

  const readingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  return (
    <section
      id="media"
      className="relative py-24 overflow-hidden"
      data-testid="section-media"
    >
      <div className="absolute inset-0 mandala-pattern opacity-5" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div
          ref={ref}
          className={`scroll-fade-in ${isVisible ? "visible" : ""}`}
        >
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4 flex items-center justify-center gap-2 mx-auto w-fit">
              <BookOpen className="w-4 h-4" />
              Knowledge Base
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-[Space_Grotesk]">
              <span className="text-foreground">Insights & </span>
              <span className="gradient-text">Resources</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Dive into our curated collection of articles, tutorials, and live demos 
              to unlock AI's potential for your organization.
            </p>
          </div>

          {/* Featured Article */}
          {!isLoading && featuredArticle && (
            <div 
              className="mb-16 cursor-pointer group"
              onClick={() => setSelectedArticle(featuredArticle)}
              data-testid="card-featured-article"
            >
              <Card className="glass-card border-0 hover-elevate overflow-hidden relative">
                <div className="absolute top-4 left-4 z-20">
                  <Badge className="bg-gradient-to-r from-accent to-primary text-white border-0">
                    ⭐ Featured
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto relative overflow-hidden">
                    {featuredArticle.thumbnailUrl ? (
                      <img
                        src={featuredArticle.thumbnailUrl}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <ExternalLink className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <CardContent className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{typeEmojis[featuredArticle.type]}</span>
                      <Badge variant="outline" className="capitalize">
                        {featuredArticle.type}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {readingTime(featuredArticle.content)} min read
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {featuredArticle.title}
                    </h3>
                    <p className="text-muted-foreground mb-6 line-clamp-3">
                      {featuredArticle.content}
                    </p>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {new Date(featuredArticle.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      {featuredArticle.createdBy && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5 font-medium w-fit" data-testid={`badge-creator-featured-${featuredArticle.id}`}>
                          <User className="w-3 h-3" />
                          Created by {featuredArticle.createdBy}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          )}

          {/* Filters and Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-muted/50 border border-border">
                <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                <TabsTrigger value="article" data-testid="tab-articles">Articles</TabsTrigger>
                <TabsTrigger value="video" data-testid="tab-videos">Videos</TabsTrigger>
                <TabsTrigger value="demo" data-testid="tab-demos">Demos</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-8">
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="glass-card border-0">
                      <CardContent className="p-0">
                        <Skeleton className="h-48 rounded-t-lg" />
                        <div className="p-5 space-y-3">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : otherArticles.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherArticles.map((article, index) => {
                    const Icon = typeIcons[article.type];
                    return (
                      <Card
                        key={article.id}
                        className="glass-card border-0 hover-elevate transition-all duration-300 cursor-pointer group overflow-hidden relative"
                        onClick={() => setSelectedArticle(article)}
                        style={{ transitionDelay: `${index * 50}ms` }}
                        data-testid={`card-article-${article.id}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-accent/0 group-hover:from-primary/10 group-hover:via-primary/15 group-hover:to-accent/10 transition-all duration-300" />
                        <CardContent className="p-0 relative z-10">
                          <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                            {article.thumbnailUrl ? (
                              <img
                                src={article.thumbnailUrl}
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <Icon className="w-12 h-12 text-primary/50" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{typeEmojis[article.type]}</span>
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {article.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                <Clock className="w-3 h-3" />
                                {readingTime(article.content)}m
                              </div>
                            </div>
                            <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {article.content}
                            </p>
                            <div className="flex flex-col gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              {article.createdBy && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5 font-medium w-fit" data-testid={`badge-creator-${article.id}`}>
                                  <User className="w-3 h-3" />
                                  Created by {article.createdBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6 group hover-elevate">
                    <FileText className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No content in this category</h3>
                  <p className="text-muted-foreground mb-6">
                    More {activeTab === "all" ? "content" : activeTab} coming soon. Check back for updates!
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab("all")}
                    data-testid="button-view-all"
                  >
                    View All Content
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto z-[9999] bg-background/95 backdrop-blur-xl border-white/20">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{typeEmojis[selectedArticle.type]}</span>
                  <div>
                    <Badge className="mb-2 capitalize">{selectedArticle.type}</Badge>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {readingTime(selectedArticle.content)} min read
                        <span>•</span>
                        {new Date(selectedArticle.createdAt).toLocaleDateString()}
                      </div>
                      {selectedArticle.createdBy && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5 font-medium w-fit" data-testid={`badge-creator-modal-${selectedArticle.id}`}>
                          <User className="w-3 h-3" />
                          Created by {selectedArticle.createdBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <DialogTitle className="text-3xl">{selectedArticle.title}</DialogTitle>
              </DialogHeader>
              
              {selectedArticle.thumbnailUrl && (
                <img
                  src={selectedArticle.thumbnailUrl}
                  alt={selectedArticle.title}
                  className="w-full aspect-video object-cover rounded-lg mb-6"
                />
              )}
              
              {selectedArticle.type === "video" && selectedArticle.mediaUrl && (
                <div className="aspect-video mb-10 rounded-lg overflow-hidden bg-black/5 border border-border/50 relative z-20 shadow-sm block w-full">
                  <iframe
                    src={(() => {
                      try {
                        const url = new URL(selectedArticle.mediaUrl);
                        if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
                          const videoId = url.searchParams.get("v") || url.pathname.split("/").pop();
                          // Add origin to fix Error 153 (domain permissions)
                          return `https://www.youtube.com/embed/${videoId}?origin=${window.location.origin}`;
                        }
                        return selectedArticle.mediaUrl;
                      } catch (e) {
                        return selectedArticle.mediaUrl;
                      }
                    })()}
                    className="w-full h-full"
                    allowFullScreen
                    title={selectedArticle.title}
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  />
                </div>
              )}
              
              <div className="prose prose-neutral dark:prose-invert max-w-none pb-20 relative z-10">
                <p className="whitespace-pre-wrap text-base leading-relaxed">{selectedArticle.content}</p>
              </div>
              
              {selectedArticle.type === "demo" && selectedArticle.mediaUrl && (
                <Button asChild className="mt-8 w-full mb-10">
                  <a href={selectedArticle.mediaUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Demo in New Tab
                  </a>
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
