// src/pages/MyPollsPage.jsx
// ==========================
// Protected page — shows all polls created by the logged-in user
// Features:
//   - List of polls with question, votes, status, share link
//   - Delete polls with confirmation
//   - Navigate to poll page to view results
//   - Copy share link to clipboard

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

function MyPollsPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ======== STATE ========
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(null); // ID of poll being deleted
  const [copiedLink, setCopiedLink] = useState(null); // ID of poll whose link was copied

  // ======== REDIRECT IF NOT LOGGED IN ========
  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // ======== FETCH USER'S POLLS ========
  const fetchMyPolls = async () => {
    try {
      const { data } = await api.get("/polls/my-polls");
      setPolls(data.polls);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load your polls"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMyPolls();
    }
  }, [isAuthenticated]);

  // ======== DELETE POLL ========
  const handleDelete = async (pollId) => {
    // Ask for confirmation before deleting
    const confirmed = window.confirm(
      "Are you sure you want to delete this poll? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeleting(pollId);

    try {
      await api.delete(`/polls/${pollId}`);

      // Remove the deleted poll from state (no need to refetch)
      setPolls(polls.filter((poll) => poll._id !== pollId));

    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to delete poll"
      );
    } finally {
      setDeleting(null);
    }
  };

  // ======== COPY SHARE LINK ========
  const handleCopyLink = (shareLink) => {
    const url = `${window.location.origin}/poll/${shareLink}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(shareLink);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // ======== FORMAT DATE ========
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ======== GET POLL STATUS ========
  const getPollStatus = (poll) => {
    if (!poll.isActive) return { text: "Closed", color: "bg-gray-100 text-gray-600" };
    if (new Date(poll.expiresAt) < new Date()) return { text: "Expired", color: "bg-red-100 text-red-600" };
    return { text: "Active", color: "bg-blue-100 text-blue-700" };
  };

  // ======== LOADING STATE ========
  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading your polls...</p>
      </div>
    );
  }

  // ======== NOT LOGGED IN (should redirect) ========
  if (!isAuthenticated) {
    return null; // useEffect will redirect
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ======== HEADER ======== */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Polls</h1>
          <p className="text-gray-500 mt-1">
            Manage your created polls
          </p>
        </div>
        <Link
          to="/"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
        >
          + Create New Poll
        </Link>
      </div>

      {/* ======== ERROR ======== */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* ======== POLLS LIST ======== */}
      {polls.length === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl shadow-lg p-12 border border-gray-100 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100"></div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            No polls yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first poll and share it with the world!
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
          >
            Create Your First Poll
          </Link>
        </div>
      ) : (
        /* Polls grid */
        <div className="space-y-4">
          {polls.map((poll) => {
            const status = getPollStatus(poll);
            return (
              <div
                key={poll._id}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left side: Poll info */}
                  <div className="flex-1 min-w-0">
                    {/* Status badge + question */}
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${status.color}`}
                      >
                        {status.text}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {poll.question}
                      </h3>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                      <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? "s" : ""}</span>
                      <span>Created {formatDate(poll.createdAt)}</span>
                      <span>Expires {formatDate(poll.expiresAt)}</span>
                      <span>/poll/{poll.shareLink}</span>
                    </div>

                    {/* Options summary */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {poll.options.map((option, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md"
                        >
                          {option.text}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right side: Action buttons */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* View button */}
                    <Link
                      to={`/poll/${poll.shareLink}`}
                      className="text-center text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-lg transition-colors"
                    >
                      View Poll
                    </Link>

                    {/* Copy link button */}
                    <button
                      onClick={() => handleCopyLink(poll.shareLink)}
                      className="text-gray-600 hover:text-gray-800 text-sm border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedLink === poll.shareLink ? "Copied!" : "Copy Link"}
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(poll._id)}
                      disabled={deleting === poll._id}
                      className="text-red-500 hover:text-red-700 text-sm border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {deleting === poll._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======== POLL COUNT SUMMARY ======== */}
      {polls.length > 0 && (
        <p className="text-center text-gray-400 text-sm mt-6">
          Showing {polls.length} poll{polls.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export default MyPollsPage;