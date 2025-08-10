// API Configuration
export const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

// API Endpoints
export const API_ENDPOINTS = {
  // Canvas
  CANVAS: "/api/canvas",

  // Heatmap
  HEATMAP: "/api/heatmap",

  // Stats and Analytics
  STATS: "/api/stats",

  // Replay
  REPLAY: "/api/replay",

  // User and Profile
  USER: "/api/user",
  PIXEL_INFO: "/api/pixel-info",

  // Badges
  BADGES: "/api/badges",

  // Authentication
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    VERIFY: "/auth/verify",
  },
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>) => {
  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }

  return url;
};

// Common query parameters
export const QUERY_PARAMS = {
  NO_CACHE: "nocache",
  HOURS: "hours",
  START: "start",
  END: "end",
} as const;
