// src/routes/adminRoutes.js
// =========================
// Express router for admin panel endpoints
// All routes require BOTH authentication AND admin privileges

const express = require("express");
const router = express.Router();
const {
  getAllPolls,
  deletePoll,
  getAllUsers,
  deleteUser,
  toggleUserAdmin,
  getAdminStats,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");

// ============================================================
// ADMIN MIDDLEWARE
// ============================================================
// This middleware runs AFTER protect, so req.user is already populated
// It checks if the authenticated user has admin privileges
const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin) {
    res.status(403);
    throw new Error("Access denied. Admin privileges required.");
  }
  next();
};

// ============================================================
// All routes below require authentication AND admin privileges
// ============================================================

// ============================================================
// GET /api/admin/stats
// ============================================================
// Returns dashboard statistics for admin panel
router.get("/stats", protect, requireAdmin, getAdminStats);

// ============================================================
// POLL MANAGEMENT ROUTES
// ============================================================

// ============================================================
// GET /api/admin/polls
// ============================================================
// Returns all polls with creator info and vote statistics
router.get("/polls", protect, requireAdmin, getAllPolls);

// ============================================================
// DELETE /api/admin/polls/:id
// ============================================================
// Deletes a poll and all associated votes
router.delete("/polls/:id", protect, requireAdmin, deletePoll);

// ============================================================
// USER MANAGEMENT ROUTES
// ============================================================

// ============================================================
// GET /api/admin/users
// ============================================================
// Returns all users with poll counts
router.get("/users", protect, requireAdmin, getAllUsers);

// ============================================================
// DELETE /api/admin/users/:id
// ============================================================
// Deletes a user and all their polls/votes
router.delete("/users/:id", protect, requireAdmin, deleteUser);

// ============================================================
// PUT /api/admin/users/:id/toggle-admin
// ============================================================
// Toggles admin status for a user
router.put("/users/:id/toggle-admin", protect, requireAdmin, toggleUserAdmin);

module.exports = router;
