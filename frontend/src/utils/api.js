// src/utils/api.js
// =================
// Pre-configured Axios instance for calling our backend API.
// Benefits:
//   - Base URL is defined once, not hardcoded everywhere
//   - withCredentials: true sends cookies (JWT token) with every request
//   - Uses VITE_BACKEND_URL for flexibility across environments

import axios from "axios";

// VITE_BACKEND_URL in .env.local is often the production API (Vercel deploys). In `vite dev`,
// that would skip the proxy and call Render — cold starts / CORS / offline APIs look like
// ERR_NETWORK. In dev, use the Vite proxy unless the URL is explicitly local or
// VITE_USE_REMOTE_API=true.
const envUrl = import.meta.env.VITE_BACKEND_URL?.trim();
const forceRemoteApi = import.meta.env.VITE_USE_REMOTE_API === "true";
const isLocalApiUrl =
  envUrl &&
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(envUrl);

const rawBaseURL = (() => {
  if (import.meta.env.DEV && !forceRemoteApi) {
    if (!envUrl || /^https:\/\//i.test(envUrl) || !isLocalApiUrl) {
      return "/api";
    }
    return envUrl;
  }
  return envUrl || "http://localhost:5000/api";
})();

if (import.meta.env.PROD && !envUrl) {
  console.warn(
    "[PollPal] Set VITE_BACKEND_URL on Vercel to your Render API base URL (e.g. https://your-service.onrender.com/api)."
  );
}
const baseURL = (() => {
  const trimmed = rawBaseURL.replace(/\/+$|\s+/g, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
})();

const api = axios.create({
  // Backend server URL — uses environment variable or defaults to localhost
  baseURL,

  // Send cookies (our JWT token) with every request
  // This is ESSENTIAL — without it, protected routes fail
  withCredentials: true,

  // Set default headers for all requests
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

/** Maps axios errors to a user-visible string (network, CORS, API JSON). */
export function getApiErrorMessage(err, fallback) {
  const body = err.response?.data;
  if (body && typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }
  if (body?.errors && typeof body.errors === "object") {
    const first = Object.values(body.errors).flat()[0];
    if (typeof first === "string") return first;
    if (first?.message) return String(first.message);
  }
  if (!err.response && (err.code === "ERR_NETWORK" || err.message === "Network Error")) {
    return import.meta.env.PROD
      ? "Cannot reach the API. In Vercel set VITE_BACKEND_URL to your Render URL ending in /api. If the API is up, registration can still fail until you redeploy the backend after a CORS update."
      : "Cannot reach the API. With `vite dev`, start the backend on port 5000; requests use the /api proxy.";
  }
  const status = err.response?.status;
  if (status) {
    return `Request failed (${status}). Check the browser Network tab for details.`;
  }
  return fallback;
}