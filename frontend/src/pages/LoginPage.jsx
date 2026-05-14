// src/pages/LoginPage.jsx
// ========================
// Login form — authenticates existing users
// On success: saves user data + token, redirects to home
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

function LoginPage() {
  const navigate = useNavigate();
    const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      // Store user info in localStorage
            // Use Auth Context to set user state globally
      login(
        {
          _id: data._id,
          username: data.username,
          email: data.email,
          isAdmin: data.isAdmin,
        },
        data.token
      );

      // Redirect to home
      navigate("/");

    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Welcome Back
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Sign in to manage your polls
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;