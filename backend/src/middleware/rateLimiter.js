// src/middleware/rateLimiter.js
// ==============================
// Rate limiting middleware using express-rate-limit
// We create two limiters:
//   1. voteLimiter — strict, prevents vote spamming
//   2. globalLimiter — gentle, protects all routes from abuse

const rateLimit = require("express-rate-limit");

// ============================================================
// VOTE LIMITER
// ============================================================
// Applies ONLY to the vote endpoint.
// 10 votes per 60 seconds per IP address.
const voteLimiter = rateLimit({
  // 60 seconds = 1 minute
  windowMs: 60 * 1000,

  // Max 10 requests per window per IP
  max: 10,

  // Standard headers that tell the client their rate limit status
  standardHeaders: true,

  // Legacy headers (X-RateLimit-*) for older clients — we disable these
  legacyHeaders: false,

  // Message sent when rate limit is exceeded
  message: {
    message:
      "Too many votes from this IP. Please wait a minute before voting again.",
  },

  // ⚡ FIX: Use validate: { xForwardedForHeader: false } to handle IPs properly
  // AND remove the custom keyGenerator — the default uses req.ip which is
  // already the trusted IP set by Express. The warning was because our custom
  // keyGenerator wasn't using the recommended IPv6 helper.
  // Express's req.ip already handles IPv4/IPv6 mapping correctly.
  validate: {
    xForwardedForHeader: false, // We don't use proxies in development
  },
});

// ============================================================
// GLOBAL LIMITER (optional, lighter touch)
// ============================================================
// Applies to ALL routes. 100 requests per 15 minutes per IP.
const globalLimiter = rateLimit({
  // 15 minutes
  windowMs: 15 * 60 * 1000,

  // 100 requests per window per IP
  max: 100,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message: "Too many requests. Please try again later.",
  },

  validate: {
    xForwardedForHeader: false,
  },
});

module.exports = { voteLimiter, globalLimiter };