// src/controllers/userController.js
// ==================================
// Route handlers for user profile operations
// Get user profile and update user profile

const User = require("../models/User");

// ============================================================
// ASYNC HANDLER WRAPPER
// ============================================================
// Catches async errors and passes them to Express error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private (requires authentication)
// @req.user Populated by authMiddleware (protect)
// ============================================================
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware in authMiddleware
  const userId = req.user._id;

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    bio: user.bio,
    location: user.location,
    createdAt: user.createdAt,
  });
});

// ============================================================
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private (requires authentication)
// @body    { fullName, bio, avatar, location, password }
// ============================================================
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { fullName, bio, avatar, location, password, currentPassword } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // If user is changing password, verify current password first
  if (password && password.trim()) {
    if (!currentPassword || !currentPassword.trim()) {
      res.status(400);
      throw new Error("Current password is required to set a new password");
    }

    // Must explicitly select password field since it's excluded by default
    const userWithPassword = await User.findById(userId).select("+password");
    const isPasswordValid = await userWithPassword.matchPassword(currentPassword);

    if (!isPasswordValid) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = password;
  }

  // Update allowed fields
  if (fullName !== undefined) user.fullName = fullName || "";
  if (bio !== undefined) user.bio = bio || "";
  if (location !== undefined) user.location = location || "";

  // Save to database (password will be hashed by pre-save hook if changed)
  await user.save();

  res.json({
    _id: user._id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    bio: user.bio,
    location: user.location,
    message: "Profile updated successfully",
  });
});

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  getUserProfile,
  updateUserProfile,
};
