// src/components/Navbar.jsx
// =========================
// Navigation bar using Auth Context (no more localStorage reading)
// Reacts INSTANTLY to login/logout without page refresh

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-slate-900 shadow-md border-b border-slate-700">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="text-3xl font-bold text-white hover:text-slate-200 transition-colors"
        >
          PollPal
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-slate-200 hover:text-white transition-colors font-medium"
          >
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/my-polls"
                className="text-slate-200 hover:text-white transition-colors font-medium"
              >
                My Polls
              </Link>
              <span className="text-slate-500">|</span>
              <Link
                to="/profile"
                className="text-slate-100 hover:text-white transition-colors font-medium"
              >
                {user?.username}
              </Link>
              <button
                onClick={handleLogout}
                className="text-amber-300 hover:text-white transition-colors font-medium cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-200 hover:text-white transition-colors font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;