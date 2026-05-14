// src/routes/pollRoutes.js
// =========================
// Express router for all poll-related endpoints
// Some routes are public (view, vote), some are protected (create, my polls, delete)

const express = require("express");
const router = express.Router();
const {
  createPoll,
  getPollByLink,
  castVote,
  getMyPolls,
  deletePoll,
} = require("../controllers/pollController");
const { protect } = require("../middleware/authMiddleware");
const { voteLimiter } = require("../middleware/rateLimiter");

// ============================================================
// PROTECTED ROUTES (must be logged in)
// These come FIRST because they have specific paths
// ============================================================

// POST /api/polls
// Create a new poll
router.post("/", protect, createPoll);

// GET /api/polls/my-polls
// Get all polls created by the logged-in user
// ⚠️ IMPORTANT: This MUST be defined BEFORE /:shareLink
// because Express matches routes in order. If /:shareLink comes first,
// "my-polls" would be treated as a shareLink parameter
router.get("/my-polls", protect, getMyPolls);

// ============================================================
// PUBLIC ROUTES (no authentication required)
// Parameterized routes come AFTER specific ones
// ============================================================

// GET /api/polls/:shareLink
// Anyone with the link can view the poll and its results
router.get("/:shareLink", getPollByLink);

// POST /api/polls/:shareLink/vote
// Anyone can vote, but rate limited (10 votes/min per IP)
router.post("/:shareLink/vote", voteLimiter, castVote);

// ============================================================
// PROTECTED PARAMETERIZED ROUTES
// ============================================================

// DELETE /api/polls/:id
// Delete a poll by its MongoDB _id
router.delete("/:id", protect, deletePoll);

module.exports = router;