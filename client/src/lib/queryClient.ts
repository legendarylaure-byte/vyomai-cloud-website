import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          message = json.error || json.message || text;
        } catch {
          message = text;
        }
      }
    } catch {
      // Failed to read response
    }
    throw new Error(message);
  }
  return res;
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
  customHeaders?: Record<string, string>,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
    ...customHeaders,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Handle empty responses (204 No Content or DELETE operations)
  if (res.status === 204 || method === "DELETE") {
    return {} as T;
  }
  
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const headers: Record<string, string> = {};
    
    // Add authorization token for admin and protected endpoints
    if (url.includes("/api/admin") || url.includes("/api/bookings")) {
      const token = localStorage.getItem("vyomai-admin-token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
