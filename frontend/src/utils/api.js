// src/utils/api.js
// =================
// Pre-configured Axios instance for calling our backend API.
// Benefits:
//   - Base URL is defined once, not hardcoded everywhere
//   - withCredentials: true sends cookies (JWT token) with every request
//   - Uses VITE_BACKEND_URL for flexibility across environments

import axios from "axios";

const api = axios.create({
  // Backend server URL — uses environment variable or defaults to localhost
  // For Vercel deployment, set VITE_BACKEND_URL to your Render backend URL
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api",

  // Send cookies (our JWT token) with every request
  // This is ESSENTIAL — without it, protected routes fail
  withCredentials: true,

  // Set default headers for all requests
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;