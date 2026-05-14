// src/pages/RegisterPage.jsx
// ===========================
// Registration form — creates a new user account
// On success: saves user data + token, redirects to home
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

function RegisterPage() {
  // Navigation hook for redirecting after registration
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state — one object with all fields
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Error and loading states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes — updates the specific field in formData
  // The [e.target.name] syntax uses the input's name attribute as the key
  const handleChange = (e) => {
    setFormData({
      ...formData,                    // Spread existing fields
      [e.target.name]: e.target.value, // Update the changed field
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setError("");       // Clear any previous errors

    // --- Client-side validation ---
    // Check if passwords match BEFORE sending to the server
    // This gives instant feedback without an API call
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Check minimum password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // --- API Call ---
      // api.post sends a POST request to our backend
      // First argument: endpoint path (baseURL is already set in api.js)
      // Second argument: request body (sent as JSON)
      const { data } = await api.post("/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // --- Success ---
      // Store user info in localStorage so Navbar can show logged-in state
      // Note: The JWT token is already in an HTTP-only cookie (set by backend)
      // We also get the token in the response body for flexibility
            // --- Success ---
      // Use Auth Context to set user state globally
      // This instantly updates Navbar without page refresh!
      login(
        {
          _id: data._id,
          username: data.username,
          email: data.email,
          isAdmin: data.isAdmin,
        },
        data.token
      );

      // Redirect to home page
      navigate("/");

    } catch (err) {
      // --- Error Handling ---
      // err.response.data.message contains the error from our backend
      // If the backend is down, show a generic message
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      {/* Card container with shadow */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Create Account
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Join PollPal and start creating polls
        </p>

        {/* Error message — only shown when error exists */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Registration form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
            />
          </div>

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
            />
          </div>

          {/* Confirm Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Link to login page */}
        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;