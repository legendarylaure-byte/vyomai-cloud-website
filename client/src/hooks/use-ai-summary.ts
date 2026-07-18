import { useQuery } from "@tanstack/react-query";

interface UseAISummaryOptions {
  articleId: string;
  content: string;
  title: string;
  enabled?: boolean;
}

export function useAISummary({ articleId, content, title, enabled = true }: UseAISummaryOptions) {
  return useQuery({
    queryKey: ["article-summary", articleId],
    queryFn: async () => {
      const response = await fetch(`/api/articles/${articleId}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, title }),
      });
      const data = await response.json();
      return data.summary as string;
    },
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
