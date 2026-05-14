// src/pages/HomePage.jsx
// =======================
// Main landing page:
//   - If logged in: shows "Create Poll" form
//   - If not logged in: shows prompt to register/login
//   - Shows recent poll activity (placeholder for now)

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

function HomePage() {
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  // ======== CREATE POLL FORM STATE ========
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]); // Start with 2 empty options
  const [expiresIn, setExpiresIn] = useState(24);   // Default: 24 hours
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ======== OPTION MANAGEMENT ========

  // Add a new option field (max 6)
  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  // Remove an option field (min 2)
  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  // Update a specific option's text
  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // ======== FORM SUBMISSION ========
  const handleCreatePoll = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // --- Client-side validation ---
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    // Filter out empty options
    const validOptions = options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      setError("Please provide at least 2 options");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(
        "/polls",
        {
          question: question.trim(),
          options: validOptions.map((opt) => opt.trim()),
          expiresIn: expiresIn,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Send token in header as backup
          },
        }
      );

      // Show success with the share link
      setSuccess(`Poll created! Share link: /poll/${data.shareLink}`);

      // Reset form
      setQuestion("");
      setOptions(["", ""]);
      setExpiresIn(24);

      // Copy share link to clipboard
      navigator.clipboard.writeText(
        `${window.location.origin}/poll/${data.shareLink}`
      );

    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create poll. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <section className="mb-10 rounded-3xl border border-slate-200 bg-white shadow-sm p-8 sm:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1 mb-4">
              Polls for teams, communities, and events
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Build faster consensus with polished, modern polls.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Create custom polls, collect votes, and share results instantly. PollPal makes it easy to launch secure polls that feel professional and perform reliably.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={isAuthenticated ? "/my-polls" : "/register"}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                {isAuthenticated ? "View your polls" : "Get started"}
              </Link>
              <Link
                to={isAuthenticated ? "/my-polls" : "/login"}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {isAuthenticated ? "Open dashboard" : "Sign in"}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:w-[450px]">
            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-lg">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Live results</p>
              <p className="mt-4 text-2xl font-semibold">Instant vote updates</p>
              <p className="mt-3 text-sm text-slate-300">
                See poll results in real time with animated progress and clear insights.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Flexible polls</p>
              <p className="mt-4 text-2xl font-semibold text-slate-900">Custom expiry</p>
              <p className="mt-3 text-sm text-slate-600">
                Choose how long your poll stays active, from one hour to one full week.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ======== LEFT COLUMN: Create Poll ======== */}
        <div>
          {isAuthenticated ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Create a Poll
              </h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleCreatePoll} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What's your question?"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options (2-6)
                  </label>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-gray-400 font-medium w-6 text-center">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
                        />
                        {options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(index)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                            title="Remove option"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Poll Duration
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 bg-white"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={6}>6 Hours</option>
                    <option value={12}>12 Hours</option>
                    <option value={24}>24 Hours</option>
                    <option value={48}>2 Days</option>
                    <option value={72}>3 Days</option>
                    <option value={168}>7 Days</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Creating Poll..." : "Create Poll"}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100" />
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Welcome to PollPal
              </h2>
              <p className="text-gray-500 mb-6">
                Create polls, share them with anyone, and see real-time results.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-white border border-blue-300 text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ======== RIGHT COLUMN: Info / Features ======== */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl font-bold text-blue-600">1.</span>
                <div>
                  <p className="font-semibold text-gray-700">Create a Poll</p>
                  <p className="text-gray-500 text-sm">
                    Write a question, add 2-6 options, and set an expiry time.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl font-bold text-blue-600">2.</span>
                <div>
                  <p className="font-semibold text-gray-700">Share the Link</p>
                  <p className="text-gray-500 text-sm">
                    Get a unique link to share with friends, colleagues, or social media.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl font-bold text-blue-600">3.</span>
                <div>
                  <p className="font-semibold text-gray-700">See Live Results</p>
                  <p className="text-gray-500 text-sm">
                    Votes update in real-time with animated percentage bars.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
            <h3 className="text-xl font-bold mb-3">Fair Voting</h3>
            <ul className="space-y-2 text-sm text-blue-50">
              <li>• One vote per IP address per poll</li>
              <li>• Rate limiting to prevent spam</li>
              <li>• Polls auto-close at expiry time</li>
              <li>• No account needed to vote</li>
              <li>• Real-time percentage updates</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-600 font-semibold">Why PollPal</p>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Organize decisions with confidence</h2>
          <p className="mt-3 text-sm text-slate-600">
            Use polished polls to collect feedback in a way that feels reliable and professional for every audience.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-600 font-semibold">Features</p>
          <ul className="mt-4 space-y-3 text-slate-600 text-sm">
            <li>• Easy poll creation with smart validation</li>
            <li>• Shareable links for quick distribution</li>
            <li>• Mobile-friendly voting experience</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-600 font-semibold">Designed for teams</p>
          <p className="mt-4 text-sm text-slate-600">
            Keep everyone aligned with transparent results, secure voting, and simple poll management from one dashboard.
          </p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;