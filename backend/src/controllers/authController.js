// src/controllers/authController.js
// ==================================
// Route handlers for user registration and login
// Each function takes (req, res) and sends back JSON responses
// We use a wrapper to catch async errors automatically

const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ============================================================
// ASYNC HANDLER WRAPPER
// ============================================================
// Problem: If an async function throws an error (e.g., DB down),
// Express doesn't catch it automatically, and the request hangs.
//
// Solution: This wrapper catches any rejected promise and passes
// the error to Express's error-handling middleware via next().
// We wrap every async route handler with this to avoid try/catch
// repetition in every single function.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (anyone can register)
// ============================================================
const registerUser = asyncHandler(async (req, res) => {
  // --- STEP 1: Destructure the request body ---
  // req.body comes from express.json() middleware
  // The frontend sends: { username, email, password }
  const { username, email, password } = req.body;

  // --- STEP 2: Validate input ---
  // Basic checks before touching the database.
  // This gives instant feedback without a DB query.
  if (!username || !email || !password) {
    // 400 = Bad Request — the client sent incomplete data
    res.status(400);
    throw new Error("Please provide username, email, and password");
  }

  // --- STEP 3: Check if user already exists ---
  // We search by email because it's unique.
  // findOne() returns null if no match, or the document if found.
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    // 409 = Conflict — the resource already exists
    res.status(409);
    throw new Error("A user with this email already exists");
  }

  // --- STEP 4: Create the user ---
  // User.create() is shorthand for new User() + .save()
  // The pre-save hook in our model automatically hashes the password
  const user = await User.create({
    username,
    email,
    password, // Plain text now, will be hashed by the model hook
  });

  // --- STEP 5: Success response ---
  if (user) {
    // Generate JWT token using the utility we built
    const token = generateToken(user._id);

    // Set the token as an HTTP-only cookie
    // HTTP-only means JavaScript can't read it (protection against XSS attacks)
    res.cookie("token", token, {
      httpOnly: true,       // Browser JS cannot access this cookie
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict",   // Cookie only sent for same-site requests
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      // 7 days × 24 hours × 60 minutes × 60 seconds × 1000 ms
    });

    // 201 = Created — a new resource was successfully made
    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      token: token, // We also send token in response body for flexibility
    });
  } else {
    // This covers unexpected creation failures
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// ============================================================
// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
// ============================================================
const loginUser = asyncHandler(async (req, res) => {
  // --- STEP 1: Destructure credentials ---
  const { email, password } = req.body;

  // --- STEP 2: Basic validation ---
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  // --- STEP 3: Find user by email ---
  // IMPORTANT: We use .select("+password") because our User model
  // has select: false on the password field.
  // Without this, user.password would be undefined, and we'd
  // never be able to verify the password!
  const user = await User.findOne({ email }).select("+password");

  // --- STEP 4: Check if user exists AND password matches ---
  // We do both checks together to prevent "user enumeration" attacks.
  // If we said "user not found" separately from "wrong password,"
  // an attacker could figure out which emails are registered.
  if (user && (await user.matchPassword(password))) {
    // Password matched! Generate token and send success
    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 200 = OK — standard success response
    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      token: token,
    });
  } else {
    // Generic error — doesn't reveal whether email or password was wrong
    // 401 = Unauthorized — credentials are invalid
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// ============================================================
// EXPORT
// ============================================================
module.exports = { registerUser, loginUser };