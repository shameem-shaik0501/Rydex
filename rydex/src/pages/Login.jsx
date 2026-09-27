import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import mongoApi from "../services/mongoApi";
import {
  User,
  ShieldCheck,
  Lock,
  Phone,
  ArrowRight,
  Car,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve saved car draft from navigation state OR persistent localStorage
  const [draftBooking] = useState(() => {
    if (location.state?.booking) return location.state.booking;
    try {
      const raw = localStorage.getItem("current_draft_booking");
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const redirectMessage = location.state?.message || "";

  // Check URL param ?role=admin or navigation state
  const searchParams = new URLSearchParams(location.search);
  const initialRole =
    location.state?.role === "admin" || searchParams.get("role") === "admin"
      ? "admin"
      : "customer";

  // 2 Types: "customer" and "admin"
  const [loginType, setLoginType] = useState(initialRole);

  // Customer Form State
  const [customerUsername, setCustomerUsername] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");

  // Admin Form State
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCustomerLogin = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const userClean = customerUsername.trim();
    const passClean = customerPassword.trim();

    if (!userClean) {
      setError("Please enter your Customer Username or Mobile Number");
      return;
    }

    if (!passClean || passClean.length < 4) {
      setError("Password must be at least 4 characters long");
      return;
    }

    setIsLoading(true);

    setTimeout(async () => {
      setIsLoading(false);

      // Verify registered customers if existing
      let existingUsers = [];
      try {
        const rawUsers = localStorage.getItem("registered_customers");
        if (rawUsers) existingUsers = JSON.parse(rawUsers);
      } catch (err) {
        console.error(err);
      }

      let match = existingUsers.find(
        (u) =>
          u.username?.toLowerCase() === userClean.toLowerCase() ||
          u.mobileNumber === userClean ||
          u.email?.toLowerCase() === userClean.toLowerCase()
      );

      // If not in local storage, check MongoDB
      if (!match) {
        const remoteUser = await mongoApi.loginUser(userClean, passClean);
        if (remoteUser && remoteUser.username) {
          match = remoteUser;
          existingUsers.push(remoteUser);
          localStorage.setItem("registered_customers", JSON.stringify(existingUsers));
        }
      }

      if (match && match.password && match.password !== passClean) {
        setError("Invalid password for this customer account. Default demo: customer123");
        return;
      }

      const userData = match || {
        username: userClean,
        name: userClean,
        mobileNumber: userClean.match(/^[6-9]\d{9}$/) ? userClean : "9878998789",
        email: `${userClean.toLowerCase().replace(/\s+/g, "")}@example.com`,
        role: "customer",
        verified: true,
        loginTime: new Date().toISOString(),
      };

      localStorage.setItem("user", JSON.stringify(userData));
      window.dispatchEvent(new Event("storage"));

      // Check for saved car draft to restore
      let activeDraft = draftBooking;
      if (!activeDraft) {
        try {
          const raw = localStorage.getItem("current_draft_booking");
          if (raw) activeDraft = JSON.parse(raw);
        } catch (err) {
          console.error(err);
        }
      }

      // Link newly logged-in customer details to saved car draft
      if (activeDraft) {
        if (!activeDraft.customer) activeDraft.customer = {};
        activeDraft.customer.name = userData.name || userData.username;
        if (!activeDraft.customer.phone || activeDraft.customer.phone === "") {
          activeDraft.customer.phone = userData.mobileNumber || "9878998789";
        }
        if (!activeDraft.customer.email || activeDraft.customer.email === "") {
          activeDraft.customer.email = userData.email || "";
        }
        try {
          localStorage.setItem("current_draft_booking", JSON.stringify(activeDraft));
        } catch (err) {
          console.error(err);
        }

        const carName =
          typeof activeDraft.car === "object"
            ? `${activeDraft.car.brand} ${activeDraft.car.model}`
            : activeDraft.car || "Car";

        setSuccess(`Welcome back, ${userData.name || userData.username}! Your ${carName} draft has been restored. Redirecting to payment...`);

        setTimeout(() => {
          navigate("/payment", {
            state: {
              booking: activeDraft,
              restoredFromDraft: true,
            },
          });
        }, 700);
      } else {
        setSuccess(`Welcome back, ${userData.name || userData.username}! Login successful.`);
        setTimeout(() => {
          if (location.state?.redirectTo) {
            navigate(location.state.redirectTo);
          } else {
            navigate("/my-orders");
          }
        }, 700);
      }
    }, 400);
  };

  const handleQuickCustomer = () => {
    setCustomerUsername("shameem");
    setCustomerPassword("customer123");
    setError("");
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const userClean = adminUsername.trim();
    const passClean = adminPassword.trim();

    if (!userClean || !passClean) {
      setError("Please enter both Admin username and password");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Strict credentials check as requested: nazeer / nazeer
      if (userClean === "nazeer" && passClean === "nazeer") {
        setSuccess("Admin Authentication Verified! Opening Operations Desk...");

        sessionStorage.setItem("rydex_admin_auth", "true");
        localStorage.setItem("rydex_admin_auth", "true");

        const adminUser = {
          username: "nazeer",
          name: "Nazeer (Fleet Admin)",
          role: "admin",
          verified: true,
          authenticatedAt: new Date().toISOString(),
        };

        localStorage.setItem("user", JSON.stringify(adminUser));
        window.dispatchEvent(new Event("storage"));

        setTimeout(() => {
          navigate("/admin");
        }, 800);
      } else {
        setError("Invalid Admin Credentials. Default credentials are username: nazeer, password: nazeer");
      }
    }, 500);
  };

  const handleFillDefaultAdmin = () => {
    setAdminUsername("nazeer");
    setAdminPassword("nazeer");
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        {/* Brand Header */}
        <Link to="/home" className="inline-flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Car className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black text-white tracking-tight">
            Rydex<span className="text-blue-500 text-sm ml-1 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30">HYD</span>
          </span>
        </Link>

        <h1 className="text-2xl font-black text-white tracking-tight">
          Sign In to Your Account
        </h1>
        <p className="text-xs text-slate-400">
          Choose your account type below to access customer bookings or admin operations
        </p>

        {/* 2-Type Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 shadow-inner mt-4">
          <button
            type="button"
            onClick={() => {
              setLoginType("customer");
              setError("");
              setSuccess("");
            }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              loginType === "customer"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Customer Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType("admin");
              setError("");
              setSuccess("");
            }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              loginType === "admin"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Dashboard</span>
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-700/80 space-y-6">
          {/* Notifications */}
          {redirectMessage && !error && !success && (
            <div className="p-3.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-xs text-blue-200 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {/* Persistent Saved Car Draft Banner */}
          {draftBooking && loginType === "customer" && (
            <div className="p-4 bg-gradient-to-r from-blue-950/90 to-slate-900 border border-blue-500/40 rounded-2xl flex items-center gap-3.5 shadow-lg">
              {draftBooking.carImage ? (
                <img
                  src={draftBooking.carImage}
                  alt={typeof draftBooking.car === "object" ? `${draftBooking.car.brand} ${draftBooking.car.model}` : draftBooking.car}
                  className="w-16 h-12 rounded-xl object-cover border border-blue-400/30 shrink-0 bg-slate-900"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                  <Car className="w-6 h-6 text-blue-400" />
                </div>
              )}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Saved Car Draft
                  </span>
                  <span className="text-xs text-blue-200 font-bold">
                    ₹{draftBooking.total}
                  </span>
                </div>
                <p className="text-xs font-black text-white truncate mt-1">
                  {typeof draftBooking.car === "object"
                    ? `${draftBooking.car.brand} ${draftBooking.car.model}`
                    : draftBooking.car || "Selected Vehicle"}
                </p>
                <p className="text-[11px] text-blue-300/80 mt-0.5">
                  Sign in below to restore this car draft & continue to payment.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* TYPE 1: CUSTOMER LOGIN */}
          {loginType === "customer" && (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div className="border-b border-slate-700/60 pb-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                  Customer Access
                </span>
                <p className="text-[11px] text-slate-400">
                  Track car deliveries, check verification state, and download invoices
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Username or Mobile Number
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={customerUsername}
                    onChange={(e) => setCustomerUsername(e.target.value)}
                    placeholder="e.g. shameem or 9878998789"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={customerPassword}
                    onChange={(e) => setCustomerPassword(e.target.value)}
                    placeholder="Enter customer password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleQuickCustomer}
                  className="text-blue-400 hover:text-blue-300 underline font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Quick Fill Customer
                </button>
                <span className="text-slate-500">Self-drive & Chauffeur</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:bg-slate-700"
              >
                <span>{isLoading ? "Signing in..." : "Sign In as Customer"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-700/60">
                New customer?{" "}
                <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-bold underline">
                  Create new customer account
                </Link>
              </div>
            </form>
          )}

          {/* TYPE 2: ADMIN LOGIN */}
          {loginType === "admin" && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Admin Operations Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Manual UPI transaction verification desk & Hyderabad fleet management
                </p>
              </div>

              {/* Default Credentials Callout */}
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 text-xs text-amber-200/90 space-y-1">
                <div className="font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Default Credentials:
                  </span>
                  <button
                    type="button"
                    onClick={handleFillDefaultAdmin}
                    className="px-2 py-0.5 bg-amber-500 text-slate-900 rounded font-extrabold text-[11px] hover:bg-amber-400 transition"
                  >
                    Quick Fill
                  </button>
                </div>
                <p className="text-[11px] font-mono text-slate-300">
                  Username: <strong className="text-amber-300">nazeer</strong> | Password:{" "}
                  <strong className="text-amber-300">nazeer</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Enter admin username"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 hover:bg-amber-500 active:scale-[0.99] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2 disabled:bg-slate-700"
              >
                <span>{isLoading ? "Authenticating..." : "Authorize Admin Desk"}</span>
                <ShieldCheck className="w-4 h-4" />
              </button>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 text-center">
                Unauthorized access attempts are logged with IP & timestamp.
              </div>
            </form>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <Link to="/home" className="hover:text-slate-300 transition">
            ← Return to Fleet & Rates
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
