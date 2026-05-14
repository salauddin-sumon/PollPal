// src/pages/ProfilePage.jsx
// ========================
// User profile management page
// Displays user info and allows updating profile details

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, loading: authLoading, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    location: "",
    email: "",
    username: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load user profile on mount, but wait for auth state to settle
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get("/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setFormData({
          fullName: data.fullName || "",
          bio: data.bio || "",
          location: data.location || "",
          email: data.email,
          username: data.username,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (authLoading) {
      return;
    }

    if (!token || !isAuthenticated) {
      navigate("/login");
      return;
    }

    loadProfile();
  }, [token, authLoading, isAuthenticated, navigate]);

  const handleProfileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUpdating(true);

    try {
      const updatePayload = {
        fullName: formData.fullName,
        bio: formData.bio,
        location: formData.location,
      };

      const { data } = await api.put("/users/profile", updatePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(data.message || "Profile updated successfully");
      setIsEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordData.currentPassword) {
      setError("Current password is required");
      return;
    }

    if (passwordData.password.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setUpdating(true);

    try {
      await api.put(
        "/users/profile",
        {
          currentPassword: passwordData.currentPassword,
          password: passwordData.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password");
    } finally {
      setUpdating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 mb-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
            <p className="text-gray-500">
              View your account details and update them when needed.
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
            >
              Edit Profile
            </button>
          )}
        </div>

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

        <div className="mb-8 pb-8 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Picture</h2>
          <div className="flex items-center gap-6">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=PollPal"
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-600">
                All users share the same avatar for simplicity.
              </p>
            </div>
          </div>
        </div>

        {!isEditing ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Username</h3>
                <p className="text-gray-900">{formData.username}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Email</h3>
                <p className="text-gray-900">{formData.email}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Full Name</h3>
              <p className="text-gray-900">{formData.fullName || "Not added yet"}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
              <p className="text-gray-900 whitespace-pre-wrap">{formData.bio || "Not added yet"}</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
              <p className="text-gray-900">{formData.location || "Not added yet"}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Profile</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleProfileChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleProfileChange}
                placeholder="Tell us about yourself..."
                rows="3"
                maxLength="200"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/200 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleProfileChange}
                placeholder="City, Country"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={updating}
                className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-100 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Change Password</h2>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"
          >
            {showPasswordForm ? "Cancel" : "Change"}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter your current password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
                placeholder="Enter your new password (min 6 characters)"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm your new password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              />
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {updating ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
