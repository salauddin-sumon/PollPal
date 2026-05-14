// src/utils/cronJobs.js
// ======================
// Scheduled background tasks using node-cron
// This file contains all automated jobs that run on a timer.
//
// Currently:
//   1. Expire Polls — runs every minute, deactivates polls past their expiry

const cron = require("node-cron");
const Poll = require("../models/Poll");

// ============================================================
// JOB: Expire Inactive Polls
// ============================================================
// Schedule: Every minute (* * * * *)
//
// This job:
//   1. Finds all polls where isActive = true AND expiresAt < now
//   2. Sets isActive = false for all of them
//   3. Logs how many polls were expired
//
// Why every minute?
//   - We don't need exact-second expiry precision
//   - 1 minute is fast enough that users won't notice
//   - If a poll expired at 3:05:42, it gets closed by 3:06:00 (max 18 second delay)
//   - One DB query per minute is negligible load

const expirePolls = () => {
  // Schedule the task
  cron.schedule("* * * * *", async () => {
    try {
      // Find all active polls whose expiry time has passed
      // $lte = "less than or equal to" — finds polls where expiresAt <= current time
      const result = await Poll.updateMany(
        {
          isActive: true,
          expiresAt: { $lte: new Date() },
        },
        {
          $set: { isActive: false },
        }
      );

      // Only log if we actually expired something
      if (result.modifiedCount > 0) {
        console.log(
          `⏰ Cron: Expired ${result.modifiedCount} poll(s) at ${new Date().toISOString()}`
        );
      }
    } catch (error) {
      // If something goes wrong (e.g., DB connection lost), log it
      // but DON'T crash the server — cron jobs should never bring down the app
      console.error("❌ Cron: Error expiring polls:", error.message);
    }
  });

  console.log("🕐 Cron job scheduled: Expire polls — runs every minute");
};

// ============================================================
// EXPORT
// ============================================================
module.exports = { expirePolls };