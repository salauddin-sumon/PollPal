// src/controllers/adminController.js
// ==================================
// Admin panel controllers for managing polls and users
// All routes require admin authentication

const User = require("../models/User");
const Poll = require("../models/Poll");
const Vote = require("../models/Vote");

// ============================================================
// ASYNC HANDLER WRAPPER
// ============================================================
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================
// @desc    Get all polls (admin only)
// @route   GET /api/admin/polls
// @access  Private (Admin only)
// ============================================================
const getAllPolls = asyncHandler(async (req, res) => {
  const polls = await Poll.find({})
    .populate("creator", "username email")
    .sort({ createdAt: -1 });

  // Get vote counts for each poll
  const pollsWithStats = await Promise.all(
    polls.map(async (poll) => {
      const voteCount = await Vote.countDocuments({ pollId: poll._id });
      return {
        _id: poll._id,
        question: poll.question,
        options: poll.options,
        totalVotes: poll.totalVotes,
        createdBy: poll.creator, // Return as createdBy for frontend compatibility
        createdAt: poll.createdAt,
        expiresAt: poll.expiresAt,
        shareLink: poll.shareLink,
        actualVoteCount: voteCount, // From Vote collection
      };
    })
  );

  res.json(pollsWithStats);
});

// ============================================================
// @desc    Delete a poll (admin only)
// @route   DELETE /api/admin/polls/:id
// @access  Private (Admin only)
// ============================================================
const deletePoll = asyncHandler(async (req, res) => {
  const pollId = req.params.id;

  // Delete poll and all associated votes
  await Poll.findByIdAndDelete(pollId);
  await Vote.deleteMany({ pollId: pollId });

  res.json({ message: "Poll and associated votes deleted successfully" });
});

// ============================================================
// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private (Admin only)
// ============================================================
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select("-password") // Exclude password field
    .sort({ createdAt: -1 });

  // Get poll counts for each user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const pollCount = await Poll.countDocuments({ createdBy: user._id });
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        bio: user.bio,
        location: user.location,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        pollCount: pollCount,
      };
    })
  );

  res.json(usersWithStats);
});

// ============================================================
// @desc    Delete a user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
// ============================================================
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Don't allow deleting self
  if (userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("Cannot delete your own account");
  }

  // Delete user and all their polls and votes
  await User.findByIdAndDelete(userId);
  await Poll.deleteMany({ createdBy: userId });
  await Vote.deleteMany({ pollId: { $in: await Poll.find({ createdBy: userId }).distinct('_id') } });

  res.json({ message: "User and associated data deleted successfully" });
});

// ============================================================
// @desc    Toggle user admin status (admin only)
// @route   PUT /api/admin/users/:id/toggle-admin
// @access  Private (Admin only)
// ============================================================
const toggleUserAdmin = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Don't allow changing own admin status
  if (userId === req.user._id.toString()) {
    res.status(400);
    throw new Error("Cannot change your own admin status");
  }

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isAdmin = !user.isAdmin;
  await user.save();

  res.json({
    message: `User admin status ${user.isAdmin ? 'granted' : 'revoked'}`,
    isAdmin: user.isAdmin
  });
});

// ============================================================
// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin only)
// ============================================================
const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalPolls = await Poll.countDocuments();
  const totalVotes = await Vote.countDocuments();
  const activePolls = await Poll.countDocuments({ expiresAt: { $gt: new Date() } });
  const adminUsers = await User.countDocuments({ isAdmin: true });

  res.json({
    totalUsers,
    totalPolls,
    totalVotes,
    activePolls,
    adminUsers,
  });
});

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  getAllPolls,
  deletePoll,
  getAllUsers,
  deleteUser,
  toggleUserAdmin,
  getAdminStats,
};
