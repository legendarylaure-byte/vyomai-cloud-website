import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Video, Presentation, ExternalLink, Clock, BookOpen, User, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/text-reveal";
import { ArticleSummary } from "@/components/article-summary";
import type { Article } from "@shared/schema";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] },
  },
};

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
      className="relative pb-20 pt-16 sm:pt-24 overflow-hidden section-a tint-warm"
      data-testid="section-media"
    >
      <div className="absolute inset-0 mandala-pattern opacity-[0.015]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 60, filter: "blur(12px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
        >
          <SectionHeader
            badge="Knowledge Base"
            title={<>Insights & <span className="gradient-brand-text">Resources</span></>}
            subtitle="Dive into our curated collection of articles, tutorials, and live demos to unlock AI's potential for your organization."
          />

          {/* Featured Article */}
          {!isLoading && featuredArticle && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-5%" }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            >
              <div 
                className="mb-16 cursor-pointer group"
              onClick={() => setSelectedArticle(featuredArticle)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedArticle(featuredArticle); } }}
              data-testid="card-featured-article"
            >
              <Card className="glass-card border-0 overflow-hidden relative card-hover-glow shimmer-hover">
                <div className="absolute top-4 left-4 z-20">
                  <Badge className="bg-gradient-to-r from-accent to-primary text-foreground border-0">
                    ⭐ Featured
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-video md:aspect-auto relative overflow-hidden">
                    {featuredArticle.thumbnailUrl ? (
                      <img
                        src={featuredArticle.thumbnailUrl}
                        alt={featuredArticle.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <FileText className="w-16 h-16 text-primary/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <ExternalLink className="w-10 h-10 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    <h3 className="text-2xl font-bold mb-3 font-display group-hover:text-primary transition-colors">
                      {featuredArticle.title}
                    </h3>
                    <p className="text-muted-foreground mb-6 line-clamp-3">
                      {featuredArticle.content}
                    </p>
                    <ArticleSummary articleId={featuredArticle.id} content={featuredArticle.content} title={featuredArticle.title} />
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {new Date(featuredArticle.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      {featuredArticle.createdBy && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-brand-start/20 text-brand-start dark:text-brand-mid border border-brand-start/30 flex items-center gap-1.5 font-medium w-fit" data-testid={`badge-creator-featured-${featuredArticle.id}`}>
                          <User className="w-3 h-3" />
                          Created by {featuredArticle.createdBy}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
            </motion.div>
          )}

          {/* Filters and Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-card/5 dark:bg-card/5 border border-border/10 rounded-full p-1 gap-1 overflow-x-auto">
                <TabsTrigger value="all" className="rounded-full px-5 py-2 text-sm font-medium data-[state=active]:gradient-brand data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-brand-start/25 transition-all duration-300" data-testid="tab-all">All</TabsTrigger>
                <TabsTrigger value="article" className="rounded-full px-5 py-2 text-sm font-medium data-[state=active]:gradient-brand data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-brand-start/25 transition-all duration-300" data-testid="tab-articles">Articles</TabsTrigger>
                <TabsTrigger value="video" className="rounded-full px-5 py-2 text-sm font-medium data-[state=active]:gradient-brand data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-brand-start/25 transition-all duration-300" data-testid="tab-videos">Videos</TabsTrigger>
                <TabsTrigger value="demo" className="rounded-full px-5 py-2 text-sm font-medium data-[state=active]:gradient-brand data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-brand-start/25 transition-all duration-300" data-testid="tab-demos">Demos</TabsTrigger>
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
                <motion.div
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-5%" }}
                >
                  {otherArticles.map((article, index) => {
                    const Icon = typeIcons[article.type];
                    return (
                      <motion.div key={article.id} variants={itemVariants}>
                        <Card
                          className="glass-card border-0 transition-all duration-300 cursor-pointer group overflow-hidden relative card-hover-glow shimmer-hover"
                          onClick={() => setSelectedArticle(article)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedArticle(article); } }}
                          data-testid={`card-article-${article.id}`}
                        >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-accent/0 group-hover:from-primary/10 group-hover:via-primary/15 group-hover:to-accent/10 transition-all duration-300" />
                        <CardContent className="p-0 relative z-10">
                          <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative overflow-hidden">
                            {article.thumbnailUrl ? (
                              <img
                                src={article.thumbnailUrl}
                                alt={article.title}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <Icon className="w-12 h-12 text-primary/50" />
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ExternalLink className="w-8 h-8 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
                            <h3 className="font-semibold mb-2 font-display line-clamp-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {article.content}
                            </p>
                            <ArticleSummary articleId={article.id} content={article.content} title={article.title} />
                            <div className="flex flex-col gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              {article.createdBy && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-start/20 text-brand-start dark:text-brand-mid border border-brand-start/30 flex items-center gap-1.5 font-medium w-fit" data-testid={`badge-creator-${article.id}`}>
                                  <User className="w-3 h-3" />
                                  Created by {article.createdBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      </motion.div>
                    );
                  })}
                </motion.div>
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
        </motion.div>
      </div>

      {/* Modal */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto z-[100] bg-background/95 backdrop-blur-xl border-border/20 shadow-2xl shadow-primary/10">
          {selectedArticle && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{typeEmojis[selectedArticle.type]}</span>
                  <div>
                    <Badge className="mb-2 capitalize bg-primary/20 text-primary dark:text-accent border-primary/30">{selectedArticle.type}</Badge>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <Clock className="w-4 h-4" />
                        {readingTime(selectedArticle.content)} min read
                        <span>•</span>
                        {new Date(selectedArticle.createdAt).toLocaleDateString()}
                      </div>
                      {selectedArticle.createdBy && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary dark:text-accent border border-primary/25 flex items-center gap-1.5 font-medium w-fit" data-testid={`badge-creator-modal-${selectedArticle.id}`}>
                          <User className="w-3 h-3" />
                          Created by {selectedArticle.createdBy}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <DialogTitle className="text-3xl font-display text-foreground">{selectedArticle.title}</DialogTitle>
              </DialogHeader>
              
              {selectedArticle.thumbnailUrl && (
                <img
                  src={selectedArticle.thumbnailUrl}
                  alt={selectedArticle.title}
                  loading="lazy"
                  className="w-full aspect-video object-cover rounded-lg mb-6"
                />
              )}
              
              {selectedArticle.type === "video" && selectedArticle.mediaUrl && (
                <div className="aspect-video mb-10 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-primary/20 relative z-20 shadow-sm block w-full">
                  <iframe
                    src={(() => {
                      try {
                        const url = new URL(selectedArticle.mediaUrl);
                        if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
                          const videoId = url.searchParams.get("v") || url.pathname.split("/").pop();
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
              
              <div className="max-w-none pb-20 relative z-10">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/80">{selectedArticle.content}</p>
              </div>

              <RelatedArticles currentId={selectedArticle.id} onSelect={setSelectedArticle} articles={articles || []} />
              
              {selectedArticle.type === "demo" && selectedArticle.mediaUrl && (
                <Button asChild className="mt-8 w-full mb-10 admin-btn-glow">
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

function RelatedArticles({ currentId, onSelect, articles }: { currentId: string; onSelect: (a: Article) => void; articles: Article[] }) {
  const published = articles.filter(a => a.id !== currentId && a.published);
  const current = articles.find(a => a.id === currentId);
  const currentTags = (current?.tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

  let related = published.filter(a => {
    const otherTags = (a.tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    return currentTags.some(t => otherTags.includes(t));
  });

  if (related.length < 3 && current) {
    const sameType = published.filter(a => a.type === current.type && !related.some(r => r.id === a.id));
    related = [...related, ...sameType];
  }

  related = related.slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        Related Articles
      </h3>
      <div className="grid md:grid-cols-3 gap-4">
        {related.map((article) => {
          const Icon = typeIcons[article.type];
          return (
            <Card
              key={article.id}
              className="cursor-pointer hover-elevate transition-all duration-300 overflow-hidden group border border-border/50"
              onClick={() => onSelect(article)}
            >
              <CardContent className="p-0">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center relative overflow-hidden">
                  {article.thumbnailUrl ? (
                    <img src={article.thumbnailUrl} alt={article.title} loading="lazy" width="400" height="225" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Icon className="w-8 h-8 text-primary/40" />
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xs">{typeEmojis[article.type]}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">{article.type}</Badge>
                  </div>
                  <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h4>
                  <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Read more
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
