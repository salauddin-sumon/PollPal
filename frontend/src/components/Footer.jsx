// src/components/Footer.jsx
// =======================
// Shared footer displayed on every page
// Includes brand, useful links, and a brief copyright notice

import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-200 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-3">
        <div>
          <h2 className="text-xl font-semibold text-white">PollPal</h2>
          <p className="mt-3 text-sm text-slate-400 leading-6">
            Simple, secure polling for teams and communities. Create, share, and review results with confidence.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Quick links
          </h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-white transition-colors">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-white transition-colors">
                Register
              </Link>
            </li>
            <li>
              <Link to="/my-polls" className="hover:text-white transition-colors">
                My Polls
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Contact
          </h3>
          <p className="mt-4 text-sm text-slate-300 leading-6">
            Questions or feedback? Reach out to our support team at
            <br />
            <a href="mailto:support@pollpal.app" className="text-white hover:underline">
              support@pollpal.app
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800 mt-6 py-4">
        <div className="max-w-6xl mx-auto px-4 text-sm text-slate-500 text-center">
          © {new Date().getFullYear()} PollPal. Built for secure polling and clean results.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
