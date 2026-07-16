import axios from "axios";
import { getSSOToken, redirectToLogin } from "./auth/SSOHandler";


const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  const { protocol, hostname, port } = window.location;
  const portStr = port ? `:${port}` : '';

  if (hostname.includes('localhost') && !process.env.REACT_APP_API_BASE_URL) {
    // HRMS backend on port 8082
    return `${protocol}//${hostname}:8082/api`;
  }

  return `${protocol}//${hostname}${portStr}/api`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor: Attach Scaloz IAM token ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Try scaloz_token first (SSO token from Scaloz IAM)
    const ssoToken = getSSOToken();
    // Fallback: legacy token key (for forgot-password etc.)
    const legacyToken = sessionStorage.getItem("token");
    const rawToken = ssoToken || legacyToken;

    if (rawToken) {
      // Strip any accidental surrounding quotes
      const token = rawToken.startsWith('"') && rawToken.endsWith('"')
        ? rawToken.slice(1, -1)
        : rawToken;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Response Interceptor: Handle 401 → redirect to Scaloz IAM ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[SSO] 401 Unauthorized — token invalid or expired. Redirecting to Scaloz IAM...');
      // Clear stale token
      sessionStorage.removeItem('scaloz_token');
      sessionStorage.removeItem('token');
      // Redirect to IAM login with current page as redirect_to
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;

