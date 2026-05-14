// src/context/AuthContext.jsx
// ============================
// Authentication Context — provides user state to ALL components
// 
// Problem before: Navbar checked localStorage once on mount.
// Login/Register updated localStorage, but Navbar didn't know.
// 
// Solution: React Context + State
//   - AuthProvider wraps the entire app
//   - user state is stored in context (not just localStorage)
//   - When login/register updates context, all consumers re-render
//   - We ALSO sync to localStorage for persistence across refreshes

import { createContext, useContext, useState, useEffect } from "react";

// Create the context (initially null)
const AuthContext = createContext(null);

// Custom hook to use auth — components call useAuth() instead of useContext(AuthContext)
// This gives us cleaner imports and better error messages
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider component — wraps the entire app
export const AuthProvider = ({ children }) => {
  // user is null when not logged in, or { _id, username, email } when logged in
  const [user, setUser] = useState(null);
  // token for API calls (also in HTTP-only cookie, but useful as backup)
  const [token, setToken] = useState(null);
  // loading is true while we check localStorage on initial mount
  const [loading, setLoading] = useState(true);

  // On mount, check localStorage for existing auth data
  // This handles the case where user refreshes the page
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }

    setLoading(false); // Done checking
  }, []);

  // Login function — called by LoginPage and RegisterPage
  const login = (userData, authToken) => {
    // Update state (causes all consumers to re-render)
    setUser(userData);
    setToken(authToken);

    // Also persist to localStorage for page refresh survival
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", authToken);
  };

  // Logout function — called by Navbar
  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);

    // Clear localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  // The value object is what consumers receive
  // We expose user, token, login, logout, and loading
  const value = {
    user,       // null | { _id, username, email }
    token,      // null | "eyJhb..."
    login,      // function(userData, token)
    logout,     // function()
    loading,    // true while checking localStorage
    isAuthenticated: !!user,  // boolean — true if user exists
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;