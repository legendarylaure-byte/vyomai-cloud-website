import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import type { VisitorStats } from "@shared/schema";

export function VisitorCounter() {
  const { data } = useQuery<VisitorStats>({
    queryKey: ["/api/visitors"],
    refetchInterval: 30000,
  });

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full glass text-sm font-medium"
      data-testid="visitor-counter"
    >
      <Eye className="w-4 h-4 text-primary" />
      <span className="text-foreground/80">
        {data?.totalVisitors?.toLocaleString() ?? "---"}
      </span>
      <span className="text-muted-foreground text-xs">visitors</span>
    </div>
  );
}
