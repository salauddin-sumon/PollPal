// src/config/db.js
// ===========================
// Database connection module
// This file exports an async function that connects to MongoDB.
// We call it once from server.js, and it handles the connection lifecycle.

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // mongoose.connect() returns a promise
    // process.env.MONGO_URI comes from our .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // conn.connection.host shows which server we connected to
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    // Re-throw so server.js can start without DB (dev) or handle startup failure
    throw error;
  }
};

module.exports = connectDB;