import { Sparkles } from "lucide-react";
import { useAISummary } from "@/hooks/use-ai-summary";

interface ArticleSummaryProps {
  articleId: string;
  content: string;
  title: string;
}

export function ArticleSummary({ articleId, content, title }: ArticleSummaryProps) {
  const { data: summary, isLoading } = useAISummary({
    articleId,
    content,
    title,
  });

  if (isLoading) {
    return (
      <div className="ai-summary-badge mt-2">
        <Sparkles className="w-3 h-3 animate-pulse" />
        <span className="opacity-50">Generating summary...</span>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="ai-summary-badge mt-2">
      <Sparkles className="w-3 h-3 flex-shrink-0" />
      <span>{summary}</span>
    </div>
  );
}
