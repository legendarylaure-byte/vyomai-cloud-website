import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Edit, Save, Loader2, Calendar, Clock, FileText, Video, Zap, Eye, EyeOff, Search, Filter, Download, Upload, FileJson, User, Link2 } from "lucide-react";
import html2pdf from "html2pdf.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertArticleSchema, type Article } from "@shared/schema";
import { z } from "zod";

const articleFormSchema = insertArticleSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  mediaUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleFormSchema>;

const typeIcons: Record<string, React.ReactNode> = {
  article: <FileText className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
  demo: <Zap className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  article: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30",
  video: "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30",
  demo: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
};

export function ArticlesPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [dateFilterOption, setDateFilterOption] = useState<string>("custom");
  const [customDateFrom, setCustomDateFrom] = useState<string>("");
  const [customDateTo, setCustomDateTo] = useState<string>("");
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [mediaPreview, setMediaPreview] = useState<string>("");
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
  const [isDraggingMedia, setIsDraggingMedia] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<"url" | "upload">("upload");

  const { data: articles = [], isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "article",
      mediaUrl: "",
      thumbnailUrl: "",
      published: false,
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      if (!token) {
        throw new Error("You must be logged in to create articles");
      }
      return apiRequest("POST", "/api/admin/articles", data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ 
        title: "Article created as Draft ✓",
        description: "Click 'Publish' to make it visible on your website"
      });
      setIsDialogOpen(false);
      setThumbnailPreview("");
      setMediaPreview("");
      form.reset();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to create article. Please try again.";
      toast({ title: "Error creating article", description: errorMessage, variant: "destructive" });
    },
  });

  const updateArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const token = localStorage.getItem("vyomai-admin-token");
      if (!token) {
        throw new Error("You must be logged in to update articles");
      }
      return apiRequest("PUT", `/api/admin/articles/${editingArticle?.id}`, data, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article updated successfully ✓", description: "Your changes have been saved" });
      setIsDialogOpen(false);
      setEditingArticle(null);
      setThumbnailPreview("");
      setMediaPreview("");
      form.reset();
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to update article. Please try again.";
      toast({ title: "Error updating article", description: errorMessage, variant: "destructive" });
    },
  });

  const deleteArticleMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("vyomai-admin-token");
      if (!token) {
        throw new Error("You must be logged in to delete articles");
      }
      return apiRequest("DELETE", `/api/admin/articles/${id}`, undefined, { Authorization: `Bearer ${token}` });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Article deleted successfully ✓", description: "The article has been removed" });
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "Failed to delete article. Please try again.";
      toast({ title: "Error deleting article", description: errorMessage, variant: "destructive" });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async (article: Article) => {
      const token = localStorage.getItem("vyomai-admin-token");
      const updateData = {
        title: article.title,
        content: article.content,
        type: article.type,
        mediaUrl: article.mediaUrl || "",
        thumbnailUrl: article.thumbnailUrl || "",
        published: !article.published
      };
      return apiRequest(
        "PUT",
        `/api/admin/articles/${article.id}`,
        updateData,
        { Authorization: `Bearer ${token}` }
      );
    },
    onSuccess: (_, article) => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      const isNowPublished = !article.published;
      toast({
        title: isNowPublished ? "Article Published ✓" : "Article Unpublished",
        description: isNowPublished ? "Now visible on your website" : "Hidden from your website",
      });
    },
    onError: () => {
      toast({ title: "Error updating article", description: "Please try again", variant: "destructive" });
    },
  });

  const onSubmit = (data: ArticleFormData) => {
    if (editingArticle) {
      updateArticleMutation.mutate(data);
    } else {
      createArticleMutation.mutate(data);
    }
  };

  const handleFileUpload = (file: File, setPreview: (url: string) => void, fieldName: "thumbnailUrl" | "mediaUrl") => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setPreview(base64String);
      form.setValue(fieldName, base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent, setIsDragging: (val: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent, setIsDragging: (val: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDropThumbnail = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingThumbnail(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileUpload(file, setThumbnailPreview, "thumbnailUrl");
      toast({ title: "Image uploaded ✓", description: "Featured image has been added" });
    } else {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
    }
  };

  const handleDropMedia = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingMedia(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/") || file.type === "application/pdf")) {
      handleFileUpload(file, setMediaPreview, "mediaUrl");
      toast({ title: "Media file uploaded ✓", description: "Your media file has been added" });
    } else {
      toast({ title: "Invalid file", description: "Please upload an image, video, or PDF file", variant: "destructive" });
    }
  };

  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);
    try {
      const reportData = {
        totalArticles: filteredArticles.length,
        published: filteredArticles.filter(a => a.published).length,
        drafts: filteredArticles.filter(a => !a.published).length,
        articles: filteredArticles.filter(a => a.type === "article").length,
        videos: filteredArticles.filter(a => a.type === "video").length,
        demos: filteredArticles.filter(a => a.type === "demo").length,
      };

      const publishRate = reportData.totalArticles > 0 ? ((reportData.published / reportData.totalArticles) * 100).toFixed(1) : 0;
      const draftRate = reportData.totalArticles > 0 ? ((reportData.drafts / reportData.totalArticles) * 100).toFixed(1) : 0;
      
      // Intelligent metrics for future-proofing
      const creatorMetrics = filteredArticles.reduce((acc, article) => {
        const creator = article.createdBy || 'System';
        if (!acc[creator]) acc[creator] = 0;
        acc[creator]++;
        return acc;
      }, {} as Record<string, number>);
      
      const avgContentLength = filteredArticles.length > 0 ? Math.round(filteredArticles.reduce((sum, a) => sum + a.content.length, 0) / filteredArticles.length) : 0;

      const html = `
        <div style="padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); min-height: 100vh;">
          <!-- Header with Branding -->
          <div style="background: linear-gradient(135deg, #0066cc 0%, #00a8ff 100%); color: white; padding: 40px; border-radius: 12px; text-align: center; margin-bottom: 40px; box-shadow: 0 10px 30px rgba(0,102,204,0.3);">
            <h1 style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: -1px;">Analytics Intelligence Report</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">VyomAi Cloud Pvt. Ltd - Articles & Media Hub</p>
          </div>

          <!-- Executive Summary -->
          <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); border-left: 5px solid #0066cc;">
            <h2 style="color: #0066cc; margin-top: 0; font-size: 20px; font-weight: 600;">Executive Summary</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; font-size: 14px; color: #555;">
              <div><strong>Report Generated:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString()}</div>
              <div><strong>Date Range:</strong> ${customDateFrom ? new Date(customDateFrom).toLocaleDateString() : 'All Time'} to ${customDateTo ? new Date(customDateTo).toLocaleDateString() : 'Today'}</div>
              <div><strong>Total Records:</strong> ${reportData.totalArticles} items</div>
              <div><strong>Report Version:</strong> 2.0 - Intelligent Analytics</div>
            </div>
          </div>

          <!-- Key Metrics Dashboard -->
          <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(102,126,234,0.3);">
              <p style="font-size: 12px; margin: 0 0 10px 0; opacity: 0.9; font-weight: 600;">TOTAL CONTENT</p>
              <p style="font-size: 32px; margin: 0; font-weight: 700;">${reportData.totalArticles}</p>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(245,87,108,0.3);">
              <p style="font-size: 12px; margin: 0 0 10px 0; opacity: 0.9; font-weight: 600;">PUBLISHED</p>
              <p style="font-size: 32px; margin: 0; font-weight: 700;">${reportData.published}</p>
              <p style="font-size: 11px; margin: 8px 0 0 0; opacity: 0.85;">${publishRate}%</p>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(79,172,254,0.3);">
              <p style="font-size: 12px; margin: 0 0 10px 0; opacity: 0.9; font-weight: 600;">DRAFTS</p>
              <p style="font-size: 32px; margin: 0; font-weight: 700;">${reportData.drafts}</p>
              <p style="font-size: 11px; margin: 8px 0 0 0; opacity: 0.85;">${draftRate}%</p>
            </div>
            <div style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(67,233,123,0.3);">
              <p style="font-size: 12px; margin: 0 0 10px 0; opacity: 0.9; font-weight: 600;">ARTICLES</p>
              <p style="font-size: 32px; margin: 0; font-weight: 700;">${reportData.articles}</p>
            </div>
            <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(250,112,154,0.3);">
              <p style="font-size: 12px; margin: 0 0 10px 0; opacity: 0.9; font-weight: 600;">VIDEOS</p>
              <p style="font-size: 32px; margin: 0; font-weight: 700;">${reportData.videos}</p>
            </div>
            <div style="background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(48,207,208,0.3);">
              <p style="font-size: 12px; margin: 0 0 10px 0; opacity: 0.9; font-weight: 600;">DEMOS</p>
              <p style="font-size: 32px; margin: 0; font-weight: 700;">${reportData.demos}</p>
            </div>
          </div>

          <!-- Content Type Analysis -->
          <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
            <h2 style="color: #0066cc; margin-top: 0; font-size: 20px; font-weight: 600; border-bottom: 3px solid #0066cc; padding-bottom: 15px;">Content Distribution Analysis</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background: linear-gradient(135deg, #0066cc 0%, #00a8ff 100%); color: white;">
                <td style="padding: 14px; font-weight: 600; text-align: left; border-radius: 6px 0 0 0;">Content Type</td>
                <td style="padding: 14px; font-weight: 600; text-align: center;">Count</td>
                <td style="padding: 14px; font-weight: 600; text-align: center;">Percentage</td>
                <td style="padding: 14px; font-weight: 600; text-align: center; border-radius: 0 6px 0 0;">Bar Chart</td>
              </tr>
              <tr style="background: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px;">📄 Articles</td>
                <td style="padding: 12px; text-align: center; font-weight: 600;">${reportData.articles}</td>
                <td style="padding: 12px; text-align: center;">${reportData.totalArticles > 0 ? ((reportData.articles / reportData.totalArticles) * 100).toFixed(1) : 0}%</td>
                <td style="padding: 12px; text-align: center;"><div style="background: #667eea; height: 24px; border-radius: 4px; width: ${reportData.totalArticles > 0 ? ((reportData.articles / reportData.totalArticles) * 100) : 0}%; margin: 0 auto;"></div></td>
              </tr>
              <tr style="background: white; border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px;">🎥 Videos</td>
                <td style="padding: 12px; text-align: center; font-weight: 600;">${reportData.videos}</td>
                <td style="padding: 12px; text-align: center;">${reportData.totalArticles > 0 ? ((reportData.videos / reportData.totalArticles) * 100).toFixed(1) : 0}%</td>
                <td style="padding: 12px; text-align: center;"><div style="background: #f093fb; height: 24px; border-radius: 4px; width: ${reportData.totalArticles > 0 ? ((reportData.videos / reportData.totalArticles) * 100) : 0}%; margin: 0 auto;"></div></td>
              </tr>
              <tr style="background: #f8f9fa;">
                <td style="padding: 12px;">⚡ Demos</td>
                <td style="padding: 12px; text-align: center; font-weight: 600;">${reportData.demos}</td>
                <td style="padding: 12px; text-align: center;">${reportData.totalArticles > 0 ? ((reportData.demos / reportData.totalArticles) * 100).toFixed(1) : 0}%</td>
                <td style="padding: 12px; text-align: center;"><div style="background: #4facfe; height: 24px; border-radius: 4px; width: ${reportData.totalArticles > 0 ? ((reportData.demos / reportData.totalArticles) * 100) : 0}%; margin: 0 auto;"></div></td>
              </tr>
            </table>
          </div>

          <!-- Status Analysis -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
              <h3 style="color: #4caf50; margin-top: 0; font-weight: 600;">Published Content</h3>
              <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 28px; font-weight: 700; color: #4caf50;">${reportData.published}</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Live on website</p>
              </div>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
              <h3 style="color: #ff9800; margin-top: 0; font-weight: 600;">Draft Content</h3>
              <div style="background: #fff3e0; padding: 20px; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 28px; font-weight: 700; color: #ff9800;">${reportData.drafts}</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Waiting to publish</p>
              </div>
            </div>
          </div>

          <!-- Creator Contribution Analytics -->
          <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
            <h2 style="color: #0066cc; margin-top: 0; font-size: 20px; font-weight: 600; border-bottom: 3px solid #0066cc; padding-bottom: 15px;">Creator Contribution Metrics</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px;">
              ${Object.entries(creatorMetrics).map(([creator, count]) => `
                <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 15px; border-radius: 8px; border-left: 4px solid #0066cc;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase;">Creator</p>
                  <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: 700; color: #0066cc;">${creator}</p>
                  <p style="margin: 0; font-size: 13px; color: #888;">${count} content piece${count !== 1 ? 's' : ''}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Content Intelligence Metrics -->
          <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
            <h2 style="color: #0066cc; margin-top: 0; font-size: 20px; font-weight: 600; border-bottom: 3px solid #0066cc; padding-bottom: 15px;">Content Intelligence</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
              <div style="padding: 15px; background: #f0f7ff; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase;">Avg. Content Length</p>
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0066cc;">${avgContentLength.toLocaleString()} chars</p>
              </div>
              <div style="padding: 15px; background: #f0f7ff; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase;">Content with Media</p>
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #0066cc;">${filteredArticles.filter(a => a.mediaUrl || a.thumbnailUrl).length} items</p>
              </div>
            </div>
          </div>

          <!-- Detailed Content List with Creator Info -->
          <div style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.07); overflow-x: auto;">
            <h2 style="color: #0066cc; margin-top: 0; font-size: 20px; font-weight: 600; border-bottom: 3px solid #0066cc; padding-bottom: 15px;">Detailed Content Inventory</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; min-width: 900px;">
              <tr style="background: linear-gradient(135deg, #0066cc 0%, #00a8ff 100%); color: white; position: sticky; top: 0;">
                <td style="padding: 12px 10px; font-weight: 600; text-align: left; border-radius: 6px 0 0 0; min-width: 180px;">Title</td>
                <td style="padding: 12px 10px; font-weight: 600; text-align: center; min-width: 70px;">Type</td>
                <td style="padding: 12px 10px; font-weight: 600; text-align: center; min-width: 80px;">Status</td>
                <td style="padding: 12px 10px; font-weight: 600; text-align: center; min-width: 120px;">Creator</td>
                <td style="padding: 12px 10px; font-weight: 600; text-align: center; min-width: 100px; border-radius: 0 6px 0 0;">Date</td>
              </tr>
              ${filteredArticles.map((article, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#f8f9fa' : 'white'}; border-bottom: 1px solid #e0e0e0;">
                  <td style="padding: 10px; font-weight: 500; color: #0066cc;">${article.title.substring(0, 35)}${article.title.length > 35 ? '...' : ''}</td>
                  <td style="padding: 10px; text-align: center;"><span style="background: ${article.type === 'article' ? '#e3f2fd' : article.type === 'video' ? '#f3e5f5' : '#fff3e0'}; color: ${article.type === 'article' ? '#0066cc' : article.type === 'video' ? '#7b1fa2' : '#e65100'}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block;">${article.type}</span></td>
                  <td style="padding: 10px; text-align: center;"><span style="background: ${article.published ? '#e8f5e9' : '#fff3e0'}; color: ${article.published ? '#4caf50' : '#ff9800'}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block;">${article.published ? 'Published' : 'Draft'}</span></td>
                  <td style="padding: 10px; text-align: center; color: #666; font-size: 11px; font-weight: 500;">${article.createdBy || 'System'}</td>
                  <td style="padding: 10px; text-align: center; color: #666; font-size: 11px;">${new Date(article.createdAt).toLocaleDateString()} ${new Date(article.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(102,126,234,0.3);">
            <p style="margin: 0 0 10px 0; font-weight: 600; font-size: 14px;">VyomAi Cloud Pvt. Ltd - Content Management Analytics</p>
            <p style="margin: 5px 0; font-size: 12px; opacity: 0.9;">© 2025 All Rights Reserved | Intelligent Report Generation</p>
            <p style="margin: 10px 0 0 0; font-size: 11px; opacity: 0.8;">This is an automated report generated by the advanced analytics system</p>
          </div>
        </div>
      `;

      const element = document.createElement("div");
      element.innerHTML = html;
      
      const opt = {
        margin: 10,
        filename: `VyomAi_Articles_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait", unit: "mm", format: "a4" },
      };

      html2pdf().set(opt).from(element).save();
      toast({
        title: "Report Downloaded ✓",
        description: "Your analytics report has been generated and downloaded",
      });
    } catch (error) {
      toast({
        title: "Error generating report",
        description: "Something went wrong",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and sort logic
  let filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || article.type === filterType;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && article.published) ||
      (filterStatus === "draft" && !article.published);
    
    // Date filter logic
    let matchesDate = true;
    const articleDate = new Date(article.createdAt);
    const today = new Date();
    const articleDay = new Date(articleDate.getFullYear(), articleDate.getMonth(), articleDate.getDate());
    const diffTime = today.getTime() - articleDay.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (dateFilterOption === "custom" && (customDateFrom || customDateTo)) {
      const fromDate = customDateFrom ? new Date(customDateFrom) : new Date(0);
      const toDate = customDateTo ? new Date(customDateTo) : new Date();
      matchesDate = articleDate >= fromDate && articleDate <= toDate;
    } else if (dateFilterOption === "today") {
      matchesDate = diffDays < 1;
    } else if (dateFilterOption === "week") {
      matchesDate = diffDays < 7;
    } else if (dateFilterOption === "month") {
      matchesDate = diffDays < 30;
    } else if (dateFilterOption === "year") {
      matchesDate = diffDays < 365;
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  if (sortBy === "newest") {
    filteredArticles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === "oldest") {
    filteredArticles.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sortBy === "title") {
    filteredArticles.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Calculate stats
  const stats = {
    total: articles.length,
    published: articles.filter((a) => a.published).length,
    drafts: articles.filter((a) => !a.published).length,
    articles: articles.filter((a) => a.type === "article").length,
    videos: articles.filter((a) => a.type === "video").length,
    demos: articles.filter((a) => a.type === "demo").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent animate-in zoom-in duration-500">
            Articles & Media Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="inline-block bg-gradient-to-r from-green-500 via-primary to-blue-500 bg-clip-text text-transparent font-semibold opacity-80 hover:opacity-100 transition-opacity duration-300 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
              Manage your content library
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingArticle(null);
                  form.reset();
                  setThumbnailPreview("");
                  setMediaPreview("");
                }}
                data-testid="button-add-article"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Content
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "Create Article"}</DialogTitle>
              <DialogDescription>
                {editingArticle ? "Update the article details below" : "Fill in the details to create a new article"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Article title" {...field} data-testid="input-article-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-article-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="demo">Demo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write your article, demo, or video description" rows={5} {...field} data-testid="textarea-article-content" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <FormLabel>Featured Image / Thumbnail</FormLabel>
                  
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailMode("upload");
                        setThumbnailPreview("");
                        form.setValue("thumbnailUrl", "");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        thumbnailMode === "upload"
                          ? "bg-white text-purple-700 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThumbnailMode("url");
                        setThumbnailPreview("");
                        form.setValue("thumbnailUrl", "");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                        thumbnailMode === "url"
                          ? "bg-white text-purple-700 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Link2 className="w-4 h-4" />
                      External URL
                    </button>
                  </div>

                  {thumbnailMode === "upload" ? (
                    <div
                      onDragOver={(e) => handleDragOver(e, setIsDraggingThumbnail)}
                      onDragLeave={(e) => handleDragLeave(e, setIsDraggingThumbnail)}
                      onDrop={handleDropThumbnail}
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                        isDraggingThumbnail
                          ? "border-purple-500 bg-purple-50 scale-[1.02]"
                          : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/50"
                      }`}
                      data-testid="dropzone-featured-image"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Upload className={`w-8 h-8 transition-all ${isDraggingThumbnail ? "text-purple-600 scale-110" : "text-gray-400"}`} />
                        <div className="text-center">
                          <p className="font-medium text-sm text-gray-700">Drag and drop your image here</p>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                      </div>
                      <label className="absolute inset-0 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], setThumbnailPreview, "thumbnailUrl");
                              toast({ title: "Image uploaded", description: "Featured image added successfully" });
                            }
                          }}
                          className="hidden"
                          data-testid="input-upload-featured-image"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={form.watch("thumbnailUrl") || ""}
                        onChange={(e) => {
                          form.setValue("thumbnailUrl", e.target.value);
                          setThumbnailPreview(e.target.value);
                        }}
                        data-testid="input-thumbnail-url"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">Enter the URL of an external image</p>
                    </div>
                  )}
                  
                  {thumbnailPreview && (
                    <div className="relative mt-2">
                      <img 
                        src={thumbnailPreview} 
                        alt="Preview" 
                        className="h-32 w-full rounded-lg object-cover border border-gray-200 shadow-sm"
                        onError={() => setThumbnailPreview("")}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setThumbnailPreview("");
                          form.setValue("thumbnailUrl", "");
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white shadow-sm"
                        data-testid="button-remove-featured-image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <FormLabel>Media / Video</FormLabel>
                  <div className="space-y-3">
                    <Input
                      placeholder="YouTube URL (e.g., https://youtube.com/watch?v=...) or media link"
                      value={form.watch("mediaUrl")}
                      onChange={(e) => form.setValue("mediaUrl", e.target.value)}
                      data-testid="input-article-media-url"
                      className="w-full"
                    />
                    <div className="text-xs text-center text-muted-foreground">or</div>
                    <div
                      onDragOver={(e) => handleDragOver(e, setIsDraggingMedia)}
                      onDragLeave={(e) => handleDragLeave(e, setIsDraggingMedia)}
                      onDrop={handleDropMedia}
                      className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer ${
                        isDraggingMedia
                          ? "border-purple-500 bg-purple-500/5 scale-105"
                          : "border-muted-foreground/30 bg-muted/30 hover:border-purple-500/50 hover:bg-purple-500/2"
                      }`}
                      data-testid="dropzone-media"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Video className={`w-8 h-8 transition-all ${isDraggingMedia ? "text-purple-500 scale-110" : "text-muted-foreground"}`} />
                        <div className="text-center">
                          <p className="font-medium text-sm">Drag and drop your media file here</p>
                          <p className="text-xs text-muted-foreground mt-1">Image, Video, or PDF</p>
                        </div>
                      </div>
                      <label className="absolute inset-0 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*,video/*,.pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], setMediaPreview, "mediaUrl");
                              toast({ title: "Media file uploaded ✓", description: "Your media file has been added" });
                            }
                          }}
                          className="hidden"
                          data-testid="input-upload-media"
                        />
                      </label>
                    </div>
                  </div>
                  {mediaPreview && (
                    <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded p-3">
                      <p className="text-xs text-green-700 dark:text-green-400 font-medium">Media file uploaded successfully</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMediaPreview("");
                          form.setValue("mediaUrl", "");
                        }}
                        data-testid="button-remove-media"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        data-testid="checkbox-article-published"
                        className="w-4 h-4"
                      />
                      <FormLabel className="mb-0">Publish on website</FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createArticleMutation.isPending || updateArticleMutation.isPending}
                  className="w-full"
                  data-testid="button-save-article"
                >
                  {createArticleMutation.isPending || updateArticleMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingArticle ? "Update" : "Create"} Article
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
          </Dialog>
          <Button
            onClick={generatePDFReport}
            disabled={isGeneratingPDF || filteredArticles.length === 0}
            variant="outline"
            className="gap-2"
            data-testid="button-download-report"
          >
            {isGeneratingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isGeneratingPDF ? "Generating..." : "Download Report"}
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        <Card className="hover-elevate" data-testid="stat-total-articles">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total</p>
            <p className="text-2xl font-bold text-primary mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="stat-published">
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-green-600" />
              <p className="text-xs text-muted-foreground font-medium">Published</p>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.published}</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="stat-drafts">
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              <EyeOff className="w-3 h-3 text-yellow-600" />
              <p className="text-xs text-muted-foreground font-medium">Drafts</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.drafts}</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="stat-articles">
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-600" />
              <p className="text-xs text-muted-foreground font-medium">Articles</p>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.articles}</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="stat-videos">
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              <Video className="w-3 h-3 text-purple-600" />
              <p className="text-xs text-muted-foreground font-medium">Videos</p>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.videos}</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate" data-testid="stat-demos">
          <CardContent className="p-4">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <p className="text-xs text-muted-foreground font-medium">Demos</p>
            </div>
            <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.demos}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-articles"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Content Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger data-testid="select-filter-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="article">Articles</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="demo">Demos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger data-testid="select-filter-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Date Range</label>
                <Select value={dateFilterOption} onValueChange={setDateFilterOption}>
                  <SelectTrigger data-testid="select-filter-date">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {dateFilterOption === "custom" && (
                <>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">From Date</label>
                    <Input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      data-testid="input-date-from"
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">To Date</label>
                    <Input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      data-testid="input-date-to"
                      className="w-full"
                    />
                  </div>
                </>
              )}
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="select-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      {isLoading ? (
        
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-3">Loading your content...</p>
          </CardContent>
        </Card>
      ) : filteredArticles.length > 0 ? (
        <div className="space-y-3">
          {filteredArticles.map((article, index) => (
            <Card
              key={article.id}
              className="hover-elevate transition-all animate-in fade-in slide-in-from-bottom-2 overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
              data-testid={`article-card-${article.id}`}
            >
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row gap-4 p-4">
                  {/* Thumbnail */}
                  {article.thumbnailUrl && (
                    <div className="md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={article.thumbnailUrl}
                        alt={article.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Content & Metadata */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-base line-clamp-2 hover:text-primary transition-colors">{article.title}</h3>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {article.published && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 font-medium">
                              Published
                            </span>
                          )}
                          {!article.published && (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30 font-medium">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.content}</p>

                      {/* Creator Badge */}
                      {article.createdBy && (
                        <div className="mb-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5 font-medium w-fit" data-testid={`badge-creator-${article.id}`}>
                            <User className="w-3 h-3" />
                            Created by {article.createdBy}
                          </span>
                        </div>
                      )}

                      {/* Metadata Tags */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1.5 ${typeColors[article.type]}`}
                          data-testid={`badge-type-${article.type}`}
                        >
                          {typeIcons[article.type]}
                          {article.type.charAt(0).toUpperCase() + article.type.slice(1)}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-muted-foreground/20 flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3 h-3" />
                          {formatDate(article.createdAt)}
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-muted-foreground/20 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(article.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublishMutation.mutate(article)}
                        disabled={togglePublishMutation.isPending}
                        data-testid={`button-toggle-publish-${article.id}`}
                        className={`gap-1.5 transition-colors ${
                          article.published
                            ? "text-green-600 hover:text-green-700"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                        title={article.published ? "Unpublish article" : "Publish article"}
                      >
                        {togglePublishMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : article.published ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                        {article.published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingArticle(article);
                          setThumbnailPreview(article.thumbnailUrl || "");
                          setMediaPreview(article.mediaUrl || "");
                          form.reset({
                            title: article.title,
                            content: article.content,
                            type: article.type,
                            mediaUrl: article.mediaUrl || "",
                            thumbnailUrl: article.thumbnailUrl || "",
                            published: article.published
                          });
                          setIsDialogOpen(true);
                        }}
                        data-testid={`button-edit-article-${article.id}`}
                        className="gap-1.5"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteArticleMutation.mutate(article.id)}
                        data-testid={`button-delete-article-${article.id}`}
                        className="gap-1.5 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No articles found. Create your first one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
