// src/middleware/authMiddleware.js
// =================================
// Middleware that protects routes — only allows authenticated users.
// It reads the JWT from cookies, verifies it, looks up the user,
// and attaches the user object to req.user for downstream handlers.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // --- STEP 1: Extract token from cookie or Authorization header ---
  // req.cookies exists because of cookie-parser middleware in server.js
  // We store the token under the key "token" during login/register.
  token = req.cookies?.token;

  // Fallback to Authorization header for cross-origin requests or token-based auth
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // --- STEP 2: Check if token exists ---
  if (!token) {
    // 401 = Unauthorized — the client didn't send any credentials
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }

  try {
    // --- STEP 3: Verify the token ---
    // jwt.verify() checks the signature against our JWT_SECRET
    // If the token was tampered with or expired, it throws an error
    // decoded contains whatever we put in the payload: { id: "user_mongo_id" }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --- STEP 4: Find the user in the database ---
    // We use the ID from the token's payload
    // .select("-password") explicitly excludes password (extra safety)
    // even though our model already has select:false on password
    req.user = await User.findById(decoded.id).select("-password");

    // --- STEP 5: Check if user still exists ---
    // Edge case: token is valid but the user was deleted from the database
    // (e.g., admin removed them, or account deletion)
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized — user no longer exists");
    }

    // --- STEP 6: All good, proceed to the route handler ---
    // next() passes control to the next middleware or the route handler
    // The route handler will have access to req.user
    next();
  } catch (error) {
    // Token verification failed (expired, malformed, wrong signature)
    res.status(401);
    throw new Error("Not authorized — token invalid or expired");
  }
};

module.exports = { protect };