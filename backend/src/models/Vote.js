// src/models/Vote.js
// ===================
// Audit trail model — stores every vote cast as a separate document.
// This lets us:
//   1. Check if an IP already voted on a specific poll (deduplication)
//   2. Count votes per option using MongoDB aggregation
//   3. Keep a permanent record even if a poll is deleted
//
// We do NOT embed votes inside the Poll document because:
//   - Polls can get many votes — embedded arrays have a size limit (16MB per document)
//   - Querying nested arrays is less efficient than querying a separate collection
//   - The voters[] array in Poll is a DENORMALIZED copy for fast read queries

const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  // Which poll this vote belongs to
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Poll",       // Creates a reference to the Poll model
    required: true,
  },

  // Which option was chosen (0 = first option, 1 = second, etc.)
  optionIndex: {
    type: Number,
    required: true,
    min: 0,
  },

  // IP address of the voter — used for one-vote-per-poll enforcement
  ipAddress: {
    type: String,
    required: true,
  },

  // Timestamp of when the vote was cast
  votedAt: {
    type: Date,
    default: Date.now,
  },
});

// ======== COMPOUND INDEX ========
// This ensures FAST lookups for: "Has this IP already voted on this poll?"
// Without this index, every vote check would scan ALL votes.
// With this index, MongoDB can find the answer in O(log n) time.
// { unique: true } means the SAME IP cannot vote on the SAME poll twice.
voteSchema.index({ pollId: 1, ipAddress: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);

module.exports = Vote;