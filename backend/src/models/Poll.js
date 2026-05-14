// src/models/Poll.js
// ===================
// The main Poll schema — stores questions, options, vote counts,
// creator info, expiry time, and the shareable link.

const mongoose = require("mongoose");

// ======== OPTION SUB-SCHEMA ========
// Each poll has 2-6 options. Rather than storing options as just strings,
// we use a sub-document with text, vote count, and an array of voter IPs.
// The voters[] array is a DENORMALIZED copy — it speeds up result display
// but the Vote collection remains the source of truth.
const optionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Option text is required"],
      trim: true,
      maxlength: [200, "Option text cannot exceed 200 characters"],
    },
    votes: {
      type: Number,
      default: 0,    // Starts at 0; we increment this when a vote is cast
    },
    voters: [
      {
        type: String, // IP addresses of people who voted for THIS option
      },
    ],
  },
  { _id: true } // Each option gets its own unique _id (useful for frontend keys)
);

// ======== POLL SCHEMA ========
const pollSchema = new mongoose.Schema(
  {
    // The poll question
    question: {
      type: String,
      required: [true, "Poll question is required"],
      trim: true,
      maxlength: [500, "Question cannot exceed 500 characters"],
    },

    // Array of options (2-6, validated below)
    options: {
      type: [optionSchema],
      validate: {
        validator: function (options) {
          // Ensures between 2 and 6 options
          return options.length >= 2 && options.length <= 6;
        },
        message: "A poll must have between 2 and 6 options",
      },
    },

    // Who created this poll (reference to User model)
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Store the creator's name here so we don't need to join User table
    // every time we display a poll. This is DENORMALIZATION for performance.
    creatorName: {
      type: String,
      required: true,
    },

    // Total votes across all options (denormalized for quick display)
    totalVotes: {
      type: Number,
      default: 0,
    },

    // When the poll expires and stops accepting votes
    expiresAt: {
      type: Date,
      required: [true, "Expiry time is required"],
    },

    // Is the poll still accepting votes?
    isActive: {
      type: Boolean,
      default: true,
    },

    // Unique shareable link ID (e.g., "abc123def")
    // We generate this with nanoid when creating the poll
    shareLink: {
      type: String,
      required: true,
      unique: true,      // Ensures no two polls have the same link
      index: true,       // We'll frequently look up polls by shareLink
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ======== INDEXES ========
// Index on creator for fast "My Polls" queries
pollSchema.index({ creator: 1, createdAt: -1 });

// Index on isActive + expiresAt for the node-cron expiry check
// The cron job will query: find all polls where isActive=true AND expiresAt < now
pollSchema.index({ isActive: 1, expiresAt: 1 });

// ======== VIRTUAL: isExpired ========
// A virtual is a computed property that doesn't get stored in the database.
// It returns true if the poll's expiry time has passed.
// We use this in our controller to check expiry without manual Date comparisons.
pollSchema.virtual("isExpired").get(function () {
  return new Date() > this.expiresAt;
});

// Ensure virtuals are included when converting to JSON
pollSchema.set("toJSON", { virtuals: true });
pollSchema.set("toObject", { virtuals: true });

const Poll = mongoose.model("Poll", pollSchema);

module.exports = Poll;