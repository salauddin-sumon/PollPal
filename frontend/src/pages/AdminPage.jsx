// src/pages/AdminPage.jsx
// ========================
// Admin route for admin login and dashboard

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

function AdminPage() {
  const navigate = useNavigate();
  const { user, token, login, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [polls, setPolls] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (isAuthenticated && user?.isAdmin) {
      loadDashboard();
      return;
    }

    setLoading(false);
  }, [authLoading, isAuthenticated, user]);

  const handleCredentialsChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const { data } = await api.post("/auth/login", {
        email: credentials.email,
        password: credentials.password,
      });

      if (!data.isAdmin) {
        setError("This account is not an admin. Please use admin credentials.");
        return;
      }

      login(
        {
          _id: data._id,
          username: data.username,
          email: data.email,
          isAdmin: data.isAdmin,
        },
        data.token
      );

      setSuccess("Admin login successful. Loading dashboard...");
      await loadDashboard(data.token);
    } catch (err) {
      setError(err.response?.data?.message || "Admin login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadDashboard = async (authToken) => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/stats", {
        headers: { Authorization: `Bearer ${authToken || token}` },
      });
      setStats(data);
    } catch (err) {
      setError("Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  const loadPolls = async () => {
    try {
      const { data } = await api.get("/admin/polls", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPolls(data);
    } catch (err) {
      setError("Failed to load polls");
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await api.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
    } catch (err) {
      setError("Failed to load users");
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    setSuccess("");

    if (tab === "polls" && polls.length === 0) {
      loadPolls();
    } else if (tab === "users" && users.length === 0) {
      loadUsers();
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!confirm("Are you sure you want to delete this poll and all its votes?")) {
      return;
    }

    try {
      await api.delete(`/admin/polls/${pollId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Poll deleted successfully");
      setPolls(polls.filter((poll) => poll._id !== pollId));
    } catch (err) {
      setError("Failed to delete poll");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to delete user "${username}" and all their data?`)) {
      return;
    }

    try {
      await api.delete(`/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("User deleted successfully");
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      setError("Failed to delete user");
    }
  };

  const handleToggleAdmin = async (userId, username, isAdmin) => {
    const action = isAdmin ? "revoke admin privileges from" : "grant admin privileges to";
    if (!confirm(`Are you sure you want to ${action} "${username}"?`)) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/toggle-admin`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(`Admin privileges ${isAdmin ? "revoked" : "granted"} successfully`);
      setUsers(users.map((u) =>
        u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u
      ));
    } catch (err) {
      setError("Failed to update admin status");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading admin panel...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Admin Login</h1>
          <p className="text-gray-500 mb-6">
            Enter admin email and password to access the dashboard.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
              <input
                type="email"
                name="email"
                value={credentials.email}
                onChange={handleCredentialsChange}
                required
                placeholder="admin@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleCredentialsChange}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Signing in..." : "Sign in as Admin"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Panel</h1>
        <p className="text-gray-500 mb-8">
          Manage polls, users, and system settings.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {success}
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-8">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "polls", label: "Polls" },
            { id: "users", label: "Users" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Users</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers || 0}</p>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-2">Total Polls</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalPolls || 0}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Total Votes</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalVotes || 0}</p>
            </div>
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-800 mb-2">Active Polls</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.activePolls || 0}</p>
            </div>
          </div>
        )}

        {activeTab === "polls" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">All Polls</h2>
              <button
                onClick={loadPolls}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Question</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Creator</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Votes</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {polls.map((poll) => (
                    <tr key={poll._id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="max-w-xs truncate" title={poll.question}>
                          {poll.question}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {poll.createdBy?.username || "Unknown"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {poll.actualVoteCount}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          new Date(poll.expiresAt) > new Date()
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {new Date(poll.expiresAt) > new Date() ? "Active" : "Expired"}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => window.open(`/poll/${poll.shareLink}`, '_blank')}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 mr-2"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeletePoll(poll._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {polls.length === 0 && (
              <p className="text-gray-500 text-center py-8">No polls found</p>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">All Users</h2>
              <button
                onClick={loadUsers}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Full Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Polls</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Admin</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr key={userData._id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {userData.username}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {userData.email}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {userData.fullName || "-"}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        {userData.pollCount}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          userData.isAdmin
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {userData.isAdmin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <button
                          onClick={() => handleToggleAdmin(userData._id, userData.username, userData.isAdmin)}
                          className={`px-3 py-1 rounded text-xs mr-2 ${
                            userData.isAdmin
                              ? "bg-orange-500 text-white hover:bg-orange-600"
                              : "bg-purple-500 text-white hover:bg-purple-600"
                          }`}
                        >
                          {userData.isAdmin ? "Revoke" : "Grant"} Admin
                        </button>
                        <button
                          onClick={() => handleDeleteUser(userData._id, userData.username)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <p className="text-gray-500 text-center py-8">No users found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPage;
