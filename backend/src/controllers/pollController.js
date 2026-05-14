// src/controllers/pollController.js
// ==================================
// All poll-related route handlers:
// Create, vote, view results, my polls, delete

const Poll = require("../models/Poll");
const Vote = require("../models/Vote");
const { nanoid } = require("nanoid");

// Same async wrapper pattern from authController
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================================
// @desc    Create a new poll
// @route   POST /api/polls
// @access  Private (must be logged in)
// ============================================================
const createPoll = asyncHandler(async (req, res) => {
  // --- STEP 1: Extract data from request body ---
  // question: "What's your favorite language?"
  // options: ["JavaScript", "Python", "Rust", "Go"]
  // expiresIn: 24 (hours from now)
  const { question, options, expiresIn } = req.body;

  // --- STEP 2: Validate inputs ---
  if (!question || !options || !expiresIn) {
    res.status(400);
    throw new Error("Please provide question, options, and expiresIn");
  }

  // Ensure options is an array with 2-6 strings
  if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
    res.status(400);
    throw new Error("Poll must have between 2 and 6 options");
  }

  // Check all options are non-empty strings
  const validOptions = options.every(
    (opt) => typeof opt === "string" && opt.trim().length > 0
  );
  if (!validOptions) {
    res.status(400);
    throw new Error("All options must be non-empty strings");
  }

  // expiresIn must be a positive number (hours)
  if (typeof expiresIn !== "number" || expiresIn <= 0) {
    res.status(400);
    throw new Error("expiresIn must be a positive number of hours");
  }

  // --- STEP 3: Generate unique share link ---
  // nanoid(8) creates an 8-character random string
  // Characters are URL-safe: A-Z, a-z, 0-9, underscore, hyphen
  // With 8 chars, we get 64^8 = 281 trillion possible combinations
  // Collision risk is practically zero for our use case
  const linkId = nanoid(8);

  // --- STEP 4: Format options for the database ---
  // Frontend sends: ["JavaScript", "Python", "Rust"]
  // We transform to: [{ text: "JavaScript", votes: 0, voters: [] }, ...]
  const formattedOptions = options.map((opt) => ({
    text: opt.trim(),
    votes: 0,
    voters: [],
  }));

  // --- STEP 5: Calculate expiry date ---
  // expiresIn is hours. Convert to milliseconds and add to current time.
  const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);

  // --- STEP 6: Create the poll ---
  const poll = await Poll.create({
    question: question.trim(),
    options: formattedOptions,
    creator: req.user._id,        // Comes from auth middleware
    creatorName: req.user.username, // Denormalized for fast reads
    expiresAt: expiresAt,
    shareLink: linkId,
  });

  // --- STEP 7: Send response ---
  // 201 = Created
  // shareURL is the full URL the frontend can display/copy
  res.status(201).json({
    _id: poll._id,
    question: poll.question,
    options: poll.options,
    creator: poll.creator,
    creatorName: poll.creatorName,
    expiresAt: poll.expiresAt,
    shareLink: poll.shareLink,
    shareURL: `/poll/${poll.shareLink}`,
    totalVotes: poll.totalVotes,
    isActive: poll.isActive,
    createdAt: poll.createdAt,
  });
});

// ============================================================
// @desc    Get a poll by its share link (for voting page)
// @route   GET /api/polls/:shareLink
// @access  Public (anyone with the link can view)
// ============================================================
const getPollByLink = asyncHandler(async (req, res) => {
  // --- STEP 1: Extract shareLink from URL params ---
  // req.params comes from the route definition: /api/polls/:shareLink
  // Express extracts the :shareLink part and puts it in req.params.shareLink
  const { shareLink } = req.params;

  // --- STEP 2: Find the poll ---
  const poll = await Poll.findOne({ shareLink });

  // --- STEP 3: Check if poll exists ---
  if (!poll) {
    res.status(404);
    throw new Error("Poll not found");
  }

  // --- STEP 4: Calculate percentages using aggregation ---
  // We call a helper function (defined below) that uses
  // MongoDB's aggregation pipeline to compute vote percentages
  const results = await getPollResults(poll._id, poll.options);

  // --- STEP 5: Return poll with computed results ---
  res.status(200).json({
    _id: poll._id,
    question: poll.question,
    creatorName: poll.creatorName,
    totalVotes: poll.totalVotes,
    expiresAt: poll.expiresAt,
    isActive: poll.isActive,
    isExpired: poll.isExpired, // Virtual field
    createdAt: poll.createdAt,
    options: results, // Options WITH percentage and clean data
  });
});

// ============================================================
// @desc    Cast a vote on a poll
// @route   POST /api/polls/:shareLink/vote
// @access  Public (but IP-tracked for deduplication)
// ============================================================
const castVote = asyncHandler(async (req, res) => {
  // --- STEP 1: Extract data ---
  const { shareLink } = req.params;
  const { optionIndex } = req.body;

  // --- STEP 2: Validate optionIndex ---
  if (optionIndex === undefined || optionIndex === null) {
    res.status(400);
    throw new Error("Please select an option to vote");
  }

  // --- STEP 3: Find the poll ---
  const poll = await Poll.findOne({ shareLink });

  if (!poll) {
    res.status(404);
    throw new Error("Poll not found");
  }

  // --- STEP 4: Check if poll is still active ---
  if (!poll.isActive) {
    res.status(400);
    throw new Error("This poll is no longer accepting votes");
  }

  // --- STEP 5: Check if poll has expired ---
  if (poll.isExpired) {
    res.status(400);
    throw new Error("This poll has expired");
  }

  // --- STEP 6: Validate optionIndex is within range ---
  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    res.status(400);
    throw new Error("Invalid option selected");
  }

  // --- STEP 7: Get voter's IP address ---
  // req.ip gives us the IP. In production, you might need
  // req.headers["x-forwarded-for"] if behind a proxy/load balancer.
  // For local dev, req.ip returns ::1 (IPv6 localhost) or 127.0.0.1
  const ipAddress = req.ip || req.connection.remoteAddress;

  // --- STEP 8: Check if this IP already voted on this poll ---
  // We use the Vote collection (source of truth) for this check.
  // The compound index { pollId: 1, ipAddress: 1 } makes this query instant.
  const existingVote = await Vote.findOne({
    pollId: poll._id,
    ipAddress: ipAddress,
  });

  if (existingVote) {
    res.status(409); // 409 = Conflict
    throw new Error("You have already voted on this poll");
  }

  // --- STEP 9: Record the vote in Vote collection ---
  // This is the SOURCE OF TRUTH.
  await Vote.create({
    pollId: poll._id,
    optionIndex: optionIndex,
    ipAddress: ipAddress,
  });

  // --- STEP 10: Update the Poll document (denormalized copy) ---
  // We use findByIdAndUpdate with direct index notation.
  // Instead of using the positional operator ($) which requires matching
  // a nested document, we use the optionIndex to build the exact path.
  // 
  // Example: If optionIndex is 0, the path becomes "options.0.votes"
  // This is SAFER and FASTER than the positional operator.
  
  // Build the dot-notation paths using the optionIndex
  const votesPath = `options.${optionIndex}.votes`;
  const votersPath = `options.${optionIndex}.voters`;

  // Create the update object dynamically
  const updateObj = {
    $inc: {
      totalVotes: 1,
      [votesPath]: 1,  // Computed property name: becomes "options.0.votes" etc.
    },
    $push: {
      [votersPath]: ipAddress,  // becomes "options.0.voters"
    },
  };

  await Poll.findByIdAndUpdate(poll._id, updateObj);
  // --- STEP 11: Get updated results ---
  const updatedPoll = await Poll.findById(poll._id);
  const results = await getPollResults(poll._id, updatedPoll.options);

  // --- STEP 12: Return success ---
  res.status(200).json({
    message: "Vote recorded successfully!",
    question: updatedPoll.question,
    totalVotes: updatedPoll.totalVotes,
    options: results,
  });
});

// ============================================================
// @desc    Get all polls created by the logged-in user
// @route   GET /api/polls/my-polls
// @access  Private (must be logged in)
// ============================================================
const getMyPolls = asyncHandler(async (req, res) => {
  // Find polls where creator matches the logged-in user's ID
  // Sort by newest first (createdAt descending: -1)
  const polls = await Poll.find({ creator: req.user._id })
    .sort({ createdAt: -1 })
    .select("-options.voters"); // Exclude voter IPs from this view (privacy)

  res.status(200).json({
    count: polls.length,
    polls: polls,
  });
});

// ============================================================
// @desc    Delete a poll (only the creator can delete)
// @route   DELETE /api/polls/:id
// @access  Private (must be the poll's creator)
// ============================================================
const deletePoll = asyncHandler(async (req, res) => {
  // --- STEP 1: Find the poll ---
  const poll = await Poll.findById(req.params.id);

  // --- STEP 2: Check if poll exists ---
  if (!poll) {
    res.status(404);
    throw new Error("Poll not found");
  }

  // --- STEP 3: Check ownership ---
  // .toString() converts ObjectId to string for comparison
  if (poll.creator.toString() !== req.user._id.toString()) {
    res.status(403); // 403 = Forbidden (authenticated but not authorized)
    throw new Error("You can only delete your own polls");
  }

  // --- STEP 4: Delete associated votes ---
  await Vote.deleteMany({ pollId: poll._id });

  // --- STEP 5: Delete the poll ---
  // .deleteOne() or .findByIdAndDelete() — both work
  await Poll.findByIdAndDelete(req.params.id);

  res.status(200).json({
    message: "Poll deleted successfully",
  });
});

// ============================================================
// HELPER: Get Poll Results with Percentages
// ============================================================
// This function uses MongoDB aggregation to calculate vote percentages.
// It queries the Vote collection directly (source of truth) and computes
// percentage for each option.
//
// Why aggregation instead of just reading poll.options?
// - The voters[] arrays in the Poll document are a CACHE
// - The Vote collection is the SOURCE OF TRUTH
// - Aggregation guarantees accurate percentages every time
// - It's fast because of our compound indexes

const getPollResults = async (pollId, pollOptions) => {
  // --- STEP 1: Aggregate votes for this poll ---
  // MongoDB Aggregation Pipeline:
  // Think of it as a conveyor belt — each stage transforms the data
  const voteStats = await Vote.aggregate([
    // STAGE 1: $match — filter only votes for this poll
    {
      $match: { pollId: pollId },
    },
    // STAGE 2: $group — count votes per option
    // _id is the field we group by (optionIndex)
    // count is the number of documents in each group
    {
      $group: {
        _id: "$optionIndex", // Group by option index (0, 1, 2, ...)
        count: { $sum: 1 },  // Count each vote as 1
      },
    },
    // STAGE 3: $sort — sort by option index ascending
    {
      $sort: { _id: 1 },
    },
  ]);

  // voteStats now looks like:
  // [
  //   { _id: 0, count: 25 },  // 25 votes for option 0
  //   { _id: 1, count: 15 },  // 15 votes for option 1
  //   { _id: 2, count: 40 },  // etc.
  // ]

  // --- STEP 2: Calculate total votes ---
  const totalVotes = voteStats.reduce((sum, stat) => sum + stat.count, 0);

  // --- STEP 3: Build a map for quick lookup ---
  // Convert array to object: { 0: 25, 1: 15, 2: 40 }
  const voteMap = {};
  voteStats.forEach((stat) => {
    voteMap[stat._id] = stat.count;
  });

  // --- STEP 4: Merge poll options with vote counts and percentages ---
  const results = pollOptions.map((option, index) => {
    const voteCount = voteMap[index] || 0; // 0 if no votes for this option
    const percentage =
      totalVotes > 0
        ? Math.round((voteCount / totalVotes) * 100) // Rounded to whole number
        : 0;

    return {
      _id: option._id,
      text: option.text,
      votes: voteCount,
      percentage: percentage,
    };
  });

  return results;
};

// ============================================================
// EXPORT ALL HANDLERS
// ============================================================
module.exports = {
  createPoll,
  getPollByLink,
  castVote,
  getMyPolls,
  deletePoll,
};