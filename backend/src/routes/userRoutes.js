// src/routes/userRoutes.js
// =========================
// Express router for user-related endpoints
// Groups all user-related routes under /api/users
// Requires authentication (protect middleware)

const express = require("express");
const router = express.Router();
const { getUserProfile, updateUserProfile } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// ============================================================
// All routes below require authentication via protect middleware
// ============================================================

// ============================================================
// GET /api/users/profile
// ============================================================
// Returns the authenticated user's profile information
// No body needed — uses req.user from protect middleware
router.get("/profile", protect, getUserProfile);

// ============================================================
// PUT /api/users/profile
// ============================================================
// Updates the authenticated user's profile
// Body: { fullName, bio, avatar, location, password, currentPassword }
// - password & currentPassword: only if user wants to change password
// - currentPassword: required if changing password
router.put("/profile", protect, updateUserProfile);

module.exports = router;
