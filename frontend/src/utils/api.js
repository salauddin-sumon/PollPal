// src/utils/api.js
// =================
// Pre-configured Axios instance for calling our backend API.
// Benefits:
//   - Base URL is defined once, not hardcoded everywhere
//   - withCredentials: true sends cookies (JWT token) with every request
//   - Uses VITE_BACKEND_URL for flexibility across environments

import axios from "axios";

const rawBaseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
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