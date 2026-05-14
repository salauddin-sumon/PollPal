// server.js — Entry point for the PollPal backend
// ================================================
// This file boots up Express, connects to MongoDB,
// and registers all route handlers.

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");

// Load environment variables from .env file BEFORE anything else
dotenv.config();

// ======== IMPORTS FOR FEATURE FLAGS ========
// We'll uncomment these as we build each feature
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const pollRoutes = require("./src/routes/pollRoutes");
const { expirePolls } = require("./src/utils/cronJobs");

// ======== INITIALIZE EXPRESS ========
const app = express();

// ======== MIDDLEWARE ========
// cors() allows frontend to talk to backend
// In development: http://localhost:5173
// In production: allow Vercel deployments
const isProduction = process.env.NODE_ENV === "production";

const allowedOrigins = [
  "http://localhost:5173",  // Development
  "http://localhost:3000",  // Alternative dev
  process.env.FRONTEND_URL,  // Production (set in Render)
].filter(Boolean);  // Remove undefined values

// In production, also allow common Vercel domains
if (isProduction) {
  allowedOrigins.push(
    "https://pollpal.vercel.app",
    "https://pollpal-git-main.vercel.app"
  );
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow all localhost origins
    if (!isProduction && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments (pollpal-*.vercel.app)
    if (isProduction && origin && origin.match(/^https:\/\/pollpal-.*\.vercel\.app$/)) {
      return callback(null, true);
    }

    console.log('CORS blocked origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,               // Allows cookies to be sent cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// express.json() parses JSON bodies from POST/PUT requests
app.use(express.json());

// cookie-parser reads cookies from request headers and makes them available as req.cookies
app.use(cookieParser());

// ======== ROUTES ========
// We'll register routes as we build controllers
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/polls", pollRoutes);

// ======== BASIC HEALTH CHECK ROUTE ========
// Useful to verify the server is running
app.get("/", (req, res) => {
  res.json({ message: "PollPal API is running!" });
});

// ======== GLOBAL ERROR HANDLER ========
// This middleware catches all errors thrown in route handlers.
// It has 4 parameters — Express recognizes error handlers by having exactly 4 params.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // If the error has a statusCode property, use it; otherwise default to 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Log the full error stack in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.error("❌ ERROR:", err);
  }

  res.status(statusCode).json({
    message: err.message,
    // Only expose stack trace in development mode
    // In production, we hide implementation details from users
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// ======== DATABASE CONNECTION & SERVER START ========
// const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening
// connectDB().then(() => {
//   app.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//     // expirePolls();
//   });
// });

// ======== DATABASE CONNECTION & SERVER START ========
const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start listening
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    expirePolls();
  });
}).catch((error) => {
  console.error('❌ Database connection failed:', error.message);
  console.log('🚀 Starting server without database connection for testing...');
  // Start server even if DB fails
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT} (DB connection failed)`);
  });
});