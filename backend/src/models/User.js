// src/models/User.js
// ===========================
// Mongoose schema & model for User documents
// Defines: username, email, password (hashed), timestamps

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ======== SCHEMA DEFINITION ========
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,                     // Removes whitespace from both ends
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must be at most 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,                   // Mongoose creates a unique index in MongoDB
      lowercase: true,                // Converts to lowercase before saving
      trim: true,
      // Basic regex check for email format
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,                  // ⚠️ Excludes password from query results by default
    },
    // ======== PROFILE FIELDS ========
    fullName: {
      type: String,
      trim: true,
      maxlength: [50, "Full name must be at most 50 characters"],
      default: "",
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [200, "Bio must be at most 200 characters"],
      default: "",
    },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", // Default avatar
    },
    location: {
      type: String,
      trim: true,
      maxlength: [50, "Location must be at most 50 characters"],
      default: "",
    },
    // ======== ADMIN FIELD ========
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,  // Automatically adds createdAt and updatedAt fields
  }
);

// ======== PRE-SAVE HOOK ========
// This runs BEFORE a user document is saved to the database.
// We use a regular function (not arrow) because we need 'this' to refer to the document.
// ======== PRE-SAVE HOOK ========
// Mongoose detects the 'async' keyword and handles next() automatically.
// When using async, do NOT call next() manually — just return or let it complete.
// If the function completes without error, Mongoose calls next() for you.
// If it throws, Mongoose calls next(error) for you.
userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return; // Early return = skip hashing, Mongoose handles next()
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // No return value needed — when the async function completes,
  // Mongoose automatically calls next()
});

// ======== INSTANCE METHOD ========
// This method is available on any user document we retrieve.
// It compares a candidate password (entered during login) with the stored hash.
userSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt.compare() hashes the entered password with the same salt
  // and checks if it matches the stored hash
  return await bcrypt.compare(enteredPassword, this.password);
};

// ======== CREATE MODEL ========
// The first argument "User" tells Mongoose to use the "users" collection
// (Mongoose automatically lowercases and pluralizes the model name)
const User = mongoose.model("User", userSchema);

module.exports = User;