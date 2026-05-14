// src/App.jsx
// ============
// Root component — sets up routing and global layout
// React Router maps URLs to page components

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PollPage from "./pages/PollPage";
import MyPollsPage from "./pages/MyPollsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <BrowserRouter>
      {/* Navbar appears on every page */}
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/poll/:shareLink" element={<PollPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected route (we'll handle auth check inside the page) */}
          <Route path="/my-polls" element={<MyPollsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  );
}

export default App;