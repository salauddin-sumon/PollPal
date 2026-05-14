// src/pages/PollPage.jsx
// =======================
// Public voting page — anyone with the link can:
//   - View the poll question and options
//   - Vote (once per IP)
//   - See live results with animated percentage bars
//   - Results auto-refresh every 3 seconds

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";

function PollPage() {
  // Extract shareLink from URL: /poll/abc123 → shareLink = "abc123"
  const { shareLink } = useParams();

  // ======== STATE ========
  const [poll, setPoll] = useState(null);       // Poll data from API
  const [selectedOption, setSelectedOption] = useState(null); // User's chosen option index
  const [hasVoted, setHasVoted] = useState(false); // Has THIS user voted?
  const [loading, setLoading] = useState(true); // Initial page load
  const [voting, setVoting] = useState(false);  // Vote submission in progress
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);  // Share link copied indicator

  // ======== FETCH POLL DATA ========
  // useCallback memoizes this function so it doesn't change on every re-render
  // This is important because we call it in a setInterval
  const fetchPoll = useCallback(async () => {
    try {
      const { data } = await api.get(`/polls/${shareLink}`);
      setPoll(data);

      // Check if poll is no longer active
      if (!data.isActive || data.isExpired) {
        setError(""); // Clear any previous error
      }
    } catch (err) {
      // Only show error on initial load. Don't overwrite if we already have data.
      if (!poll) {
        setError(
          err.response?.data?.message || "Failed to load poll"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [shareLink]); // Recreate only if shareLink changes

  // ======== INITIAL LOAD ========
  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  // ======== LIVE POLLING: Refresh results every 3 seconds ========
  useEffect(() => {
    // Only start polling if we already have data and poll is active
    if (!poll || !poll.isActive || poll.isExpired) return;

    // setInterval runs fetchPoll every 3000ms (3 seconds)
    const interval = setInterval(() => {
      fetchPoll();
    }, 3000);

    // Cleanup: clear the interval when component unmounts or poll changes
    return () => clearInterval(interval);
  }, [poll?.isActive, poll?.isExpired, fetchPoll]);

  // ======== HANDLE VOTE ========
  const handleVote = async (optionIndex) => {
    // Prevent voting if already voted or voting in progress
    if (hasVoted || voting) return;

    setError("");
    setSuccess("");
    setVoting(true);

    try {
      const { data } = await api.post(`/polls/${shareLink}/vote`, {
        optionIndex,
      });

      // Mark as voted (disable further voting)
      setHasVoted(true);
      setSelectedOption(optionIndex);
      setSuccess("Your vote has been recorded!");

      // Update poll data with the response from the server
      // This ensures the results shown are from the same request
      setPoll({
        ...poll,
        totalVotes: data.totalVotes,
        options: data.options,
      });

    } catch (err) {
      const message = err.response?.data?.message;

      // If they already voted, mark as voted anyway
      if (message === "You have already voted on this poll") {
        setHasVoted(true);
        setError("You have already voted on this poll");
      } else {
        setError(message || "Failed to submit vote");
      }
    } finally {
      setVoting(false);
    }
  };

  // ======== COPY SHARE LINK ========
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading poll...</p>
      </div>
    );
  }

  // ======== ERROR STATE (poll not found) ========
  if (error && !poll) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4 text-red-500">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Poll Not Found
        </h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  // ======== MAIN POLL DISPLAY ========
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* ======== POLL HEADER CARD ======== */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-6">
        {/* Status badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {poll.isActive && !poll.isExpired ? (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              LIVE
            </span>
          ) : (
            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
              CLOSED
            </span>
          )}

          {poll.isExpired && (
            <span className="bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
              EXPIRED
            </span>
          )}
        </div>

        {/* Question */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {poll.question}
        </h1>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>By {poll.creatorName}</span>
          <span>•</span>
          <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}</span>
          {poll.isActive && !poll.isExpired && (
            <>
              <span>•</span>
              <span>
                Expires {new Date(poll.expiresAt).toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ======== OPTIONS / RESULTS ======== */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-5">
          {hasVoted ? "Results" : "Cast Your Vote"}
        </h3>

        {/* Error & Success messages */}
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

        <div className="space-y-4">
          {poll.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const percentage = option.percentage || 0;
            const voteCount = option.votes || 0;

            return (
              <div key={option._id || index}>
                {/* Vote button (before voting) */}
                {!hasVoted ? (
                  <button
                    onClick={() => handleVote(index)}
                    disabled={
                      voting ||
                      !poll.isActive ||
                      poll.isExpired
                    }
                    className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all cursor-pointer ${
                      !poll.isActive || poll.isExpired
                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        : voting
                        ? "border-blue-200 bg-blue-50 text-gray-500 cursor-wait"
                        : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option.text}</span>
                      {voting && isSelected && (
                        <span className="text-blue-600 text-sm">
                          Submitting...
                        </span>
                      )}
                    </div>
                  </button>
                ) : (
                  /* Results bar (after voting) */
                  <div
                    className={`relative rounded-xl overflow-hidden border-2 ${
                      isSelected
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    {/* Animated percentage bar */}
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-300 to-blue-400 transition-all duration-1000 ease-out rounded-xl"
                      style={{ width: `${percentage}%` }}
                    ></div>

                    {/* Content (positioned above the bar with z-index) */}
                    <div className="relative z-10 px-5 py-4 flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {option.text}
                        {isSelected && (
                          <span className="ml-2 text-blue-600 text-sm">
                            ✓ Your vote
                          </span>
                        )}
                      </span>
                      <span className="font-bold text-gray-800">
                        {percentage}% ({voteCount})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Already voted message */}
        {hasVoted && (
          <p className="text-center text-gray-400 text-sm mt-6">
            Voting is closed for you. Results update in real-time.
          </p>
        )}

        {/* Closed poll message */}
        {(!poll.isActive || poll.isExpired) && !hasVoted && (
          <p className="text-center text-gray-400 text-sm mt-4">
            This poll is no longer accepting votes.
          </p>
        )}
      </div>

      {/* ======== SHARE SECTION ======== */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Share This Poll
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={window.location.href}
            readOnly
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm cursor-pointer whitespace-nowrap"
          >
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PollPage;