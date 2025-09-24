import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorDetail = res.statusText; // Default error detail
    try {
      // Try to parse as JSON first
      const errorJson = await res.json();
      if (errorJson && typeof errorJson === 'object' && errorJson.message) {
        errorDetail = errorJson.message;
      } else if (errorJson) {
        // If it's a JSON object but no 'message' field, stringify it
        errorDetail = JSON.stringify(errorJson);
      }
    } catch (e) {
      // If not JSON, fall back to text
      const text = await res.text();
      if (text) {
        errorDetail = text;
      }
    }
    throw new Error(`API Error ${res.status}: ${errorDetail}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  // Add Content-Type for requests with data
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add Authorization header if token exists
  const token = localStorage.getItem('smartq_token');
  console.log('apiRequest - Token from localStorage:', token);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log('apiRequest - Authorization header set:', headers["Authorization"]);
  }

  // Use full backend URL
  const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
  const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
  console.log('Making API request to:', fullUrl);

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Clone the response to allow multiple reads of the body
  const clonedRes = res.clone();

  // Handle token update response
  if (clonedRes.status === 401) {
    try {
      const errorData = await clonedRes.json(); // Read from cloned response
      if (errorData.newToken) {
        // Update token in localStorage
        localStorage.setItem('smartq_token', errorData.newToken);
        console.log('Token updated from server response');
        
        // Retry the request with new token
        return apiRequest(method, url, data);
      }
    } catch (e) {
      // If parsing fails, continue with normal error handling
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add Authorization header if token exists
    const token = localStorage.getItem('smartq_token');
    console.log('getQueryFn - Token from localStorage:', token);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      console.log('getQueryFn - Authorization header set:', headers["Authorization"]);
    }

    // Use full backend URL for query functions
    const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`;
    
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
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
