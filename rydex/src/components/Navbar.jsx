import { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Car,
  User,
  LogOut,
  Menu,
  X,
  PhoneCall,
} from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);

  // Derive user state on mount, location change, and session update
  const user = useMemo(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, sessionKey]);

  // Check if guest has a car draft saved
  const navDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem("current_draft_booking");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, sessionKey]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setSessionKey((k) => k + 1);
    navigate("/home");
  };

  const navLinks = [
    { label: "Fleet & Rates", to: "/cars" },
    { label: "How It Works", to: "/home#how-it-works" },
    { label: "About & Support", to: "/about" },
    { label: "My Bookings", to: "/my-orders" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to="/home"
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                Rydex
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  HYD
                </span>
              </span>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block tracking-wide">
                Self-Drive & Chauffeur
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                  location.pathname === link.to.split("#")[0]
                    ? "text-blue-400 font-semibold"
                    : "text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick 24/7 Helpline */}
            <a
              href="tel:+917981033649"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 transition"
              title="24/7 Roadside & Booking Support"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>+91 79810 33649</span>
            </a>

            {/* Saved Car Draft Reminder Button if present */}
            {navDraft && !user && (
              <Link
                to="/payment"
                state={{ booking: navDraft, restoredFromDraft: true }}
                className="hidden lg:flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 transition hover:bg-amber-500/20"
                title="Continue your draft booking"
              >
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[120px] font-medium">
                  Draft: {typeof navDraft.car === "object" ? navDraft.car.model : (navDraft.carModel || navDraft.car)}
                </span>
              </Link>
            )}

            {/* User Session */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow ${
                    user.role === "admin" ? "bg-amber-600" : "bg-blue-600"
                  }`}>
                    {user.username ? user.username.charAt(0) : "U"}
                  </div>
                  <span className="font-medium max-w-[100px] truncate">
                    {user.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <Link
                  to="/login"
                  state={navDraft ? { booking: navDraft } : undefined}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  state={navDraft ? { booking: navDraft } : undefined}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-200 hover:text-white hover:bg-slate-800"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <a
              href="tel:+917981033649"
              className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-400 bg-slate-800/60 rounded-lg"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Helpline: +91 79810 33649</span>
            </a>

            {user ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold">{user.username}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-400 hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold bg-slate-800 text-white rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
