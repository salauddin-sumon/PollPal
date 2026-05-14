// src/routes/authRoutes.js
// =========================
// Express router for authentication endpoints
// Groups all auth-related routes under /api/auth

const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// ============================================================
// POST /api/auth/register
// ============================================================
// Body: { username: "string", email: "string", password: "string" }
// Creates a new user account and returns JWT token
router.post("/register", registerUser);

// ============================================================
// POST /api/auth/login
// ============================================================
// Body: { email: "string", password: "string" }
// Authenticates user and returns JWT token
router.post("/login", loginUser);

module.exports = router;