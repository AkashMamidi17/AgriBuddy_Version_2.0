import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const API_BASE_URL = "http://localhost:5000";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = "An error occurred";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Unable to connect to server. Please ensure the server is running.");
    }
    throw error;
  }
}

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getQueryFn = (options: { on401?: 'returnNull' | 'throw' } = {}) => {
  return async ({ queryKey }: { queryKey: string[] }) => {
    try {
      const data = await apiRequest(queryKey[0]);
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.includes('401') && options.on401 === 'returnNull') {
        return null;
      }
      throw error;
    }
  };
};
