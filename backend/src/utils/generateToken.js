// src/utils/generateToken.js
// ===========================
// Utility function that creates a JSON Web Token (JWT)
// The token contains the user's ID, which we use to identify them
// on protected routes without them sending their password every time.

const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  // jwt.sign() creates a signed token
  // Parameter 1: payload — data we want to embed in the token (keep it small!)
  // Parameter 2: secret — used to sign/verify. NEVER expose this.
  // Parameter 3: options — expiresIn sets when the token becomes invalid
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",  // Token lasts 7 days before user must log in again
  });
};

module.exports = generateToken;