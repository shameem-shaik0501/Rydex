import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import QRCode from "qrcode";
import mongoApi from "../services/mongoApi";
import {
  ShieldCheck,
  Clock,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  FileCheck2,
  CheckCircle2,
  Sparkles,
  Lock,
  User,
  KeyRound,
  LogIn,
  Zap,
  ArrowRight,
} from "lucide-react";

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();

  // Robustly resolve booking payload (location.state or draft in localStorage)
  const [booking] = useState(() => {
    if (location.state?.booking) return location.state.booking;
    try {
      const draft = localStorage.getItem("current_draft_booking");
      if (draft) return JSON.parse(draft);
    } catch {
      // ignore
    }
    return null;
  });

  // Safe car name, brand, model and image getters
  const carDisplayName =
    typeof booking?.car === "object"
      ? `${booking.car.brand || ""} ${booking.car.model || ""}`.trim()
      : (booking?.car || "Rydex Vehicle");

  const carBrand =
    booking?.carBrand ||
    (typeof booking?.car === "object" ? booking.car.brand : carDisplayName.split(" ")[0]);

  const carModel =
    booking?.carModel ||
    (typeof booking?.car === "object" ? booking.car.model : carDisplayName.split(" ").slice(1).join(" "));

  const carImage =
    booking?.carImage ||
    (typeof booking?.car === "object" ? booking.car.image : null) ||
    "/cars/innova.jpg";

  // Check customer authentication strictly from localStorage (user must log in)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed?.username) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Customer in-page login form states
  const [showSwitchLogin, setShowSwitchLogin] = useState(false);
  const [authUsername, setAuthUsername] = useState(
    booking?.customer?.name || booking?.customer?.phone || ""
  );
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Booking options:
  // "confirm_25" (Confirm Booking - 25% Advance Payment, Guaranteed Slot)
  // "standard_booking" (Standard Booking - 20% Instant Payment)
  // "hold_24h" (24 Hours Hold - 10% Token)
  const [bookingWay, setBookingWay] = useState("confirm_25");
  const [confirm25UtrId, setConfirm25UtrId] = useState("");
  const [stdUtrId, setStdUtrId] = useState("");
  const [holdUtrId, setHoldUtrId] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState("");
  const [confirm25QrCodeUrl, setConfirm25QrCodeUrl] = useState("");
  const [stdQrCodeUrl, setStdQrCodeUrl] = useState("");
  const [holdQrCodeUrl, setHoldQrCodeUrl] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const upiId = "7981033649-2@ibl";

  // Financial calculations
  const totalAmount = booking ? booking.total : 0;
  const advance25 = Math.ceil(totalAmount * 0.25); // 25% Confirm booking advance payment
  const advance20 = Math.ceil(totalAmount * 0.20); // 20% Standard booking instant payment
  const advance10 = Math.ceil(totalAmount * 0.10); // 10% 24 Hours Hold token

  // Current advance based on selected option
  const currentAdvance =
    bookingWay === "confirm_25"
      ? advance25
      : bookingWay === "standard_booking"
      ? advance20
      : advance10;

  // Generate QR codes for instant payments
  useEffect(() => {
    if (!booking) return;

    const upiUrl25 = `upi://pay?pa=${upiId}&pn=Rydex%20Car%20Rental&am=${advance25}&cu=INR&tn=Rydex%2025pct%20Confirm%20Booking`;
    QRCode.toDataURL(upiUrl25, { width: 260, margin: 1 })
      .then((url) => setConfirm25QrCodeUrl(url))
      .catch((err) => console.error("Confirm 25% QR Code Error:", err));

    const upiUrl20 = `upi://pay?pa=${upiId}&pn=Rydex%20Car%20Rental&am=${advance20}&cu=INR&tn=Rydex%2020pct%20Standard%20Booking`;
    QRCode.toDataURL(upiUrl20, { width: 260, margin: 1 })
      .then((url) => setStdQrCodeUrl(url))
      .catch((err) => console.error("Standard QR Code Error:", err));

    const upiUrl10 = `upi://pay?pa=${upiId}&pn=Rydex%20Car%20Rental&am=${advance10}&cu=INR&tn=Rydex%2024h%20Hold%20Token`;
    QRCode.toDataURL(upiUrl10, { width: 260, margin: 1 })
      .then((url) => setHoldQrCodeUrl(url))
      .catch((err) => console.error("Hold QR Code Error:", err));
  }, [booking, advance25, advance20, advance10]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
        <h2 className="text-2xl font-bold text-slate-800">No Booking Data Found</h2>
        <p className="text-slate-500 mt-2">Please select a car to initiate reservation.</p>
        <Link
          to="/cars"
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
        >
          View Fleet
        </Link>
      </div>
    );
  }

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFillDemoUtr = () => {
    const sampleUtr = "UTR" + Math.floor(100000000 + Math.random() * 900000000);
    if (bookingWay === "confirm_25") {
      setConfirm25UtrId(sampleUtr);
    } else if (bookingWay === "standard_booking") {
      setStdUtrId(sampleUtr);
    } else if (bookingWay === "hold_24h") {
      setHoldUtrId(sampleUtr);
    }
  };

  // Handle Customer In-Page Authentication
  const handleCustomerSignIn = (e) => {
    e?.preventDefault();
    setAuthError("");

    const username = authUsername.trim();
    const password = authPassword.trim();

    if (!username) {
      setAuthError("Please enter your customer name, email, or mobile number.");
      return;
    }
    if (!password) {
      setAuthError("Please enter your account password.");
      return;
    }

    setAuthLoading(true);

    setTimeout(() => {
      let existingUsers = [];
      try {
        const raw = localStorage.getItem("registered_customers");
        if (raw) existingUsers = JSON.parse(raw);
      } catch (err) {
        console.error(err);
      }

      const match = existingUsers.find(
        (u) =>
          u.username?.toLowerCase() === username.toLowerCase() ||
          u.mobileNumber === username ||
          u.email?.toLowerCase() === username.toLowerCase()
      );

      let loggedInUser;
      if (match) {
        if (match.password !== password) {
          setAuthError("Incorrect password. Please try again or use demo login.");
          setAuthLoading(false);
          return;
        }
        loggedInUser = {
          username: match.username,
          mobileNumber: match.mobileNumber,
          email: match.email || "",
          role: "customer",
          verified: true,
        };
      } else {
        loggedInUser = {
          username: username,
          mobileNumber: booking?.customer?.phone || username,
          email: booking?.customer?.email || `${username.toLowerCase().replace(/\s+/g, "")}@example.com`,
          role: "customer",
          verified: true,
        };
      }

      localStorage.setItem("user", JSON.stringify(loggedInUser));
      window.dispatchEvent(new Event("storage"));
      setCurrentUser(loggedInUser);
      setShowSwitchLogin(false);
      setAuthLoading(false);
      setAuthSuccess("Authentication successful! You can now complete your payment.");
      setTimeout(() => setAuthSuccess(""), 4000);
    }, 300);
  };

  const handleQuickFillCustomer = () => {
    setAuthUsername("shameem");
    setAuthPassword("customer123");
    setAuthError("");
  };

  // Submit handler: NO automated gateway verification delay/failure
  // Transaction is recorded immediately and forwarded to Rydex Admin for manual verification
  const handleSubmitBooking = (way) => {
    if (!currentUser) {
      alert("Customer authentication required! Please log in above to unlock payment options and confirm your booking.");
      return;
    }
    const errors = {};

    if (way === "confirm_25") {
      if (!confirm25UtrId.trim()) {
        errors.confirm25UtrId = "Please enter your 12-digit UPI UTR / Transaction ID for the 25% payment";
      }
    } else if (way === "standard_booking") {
      if (!stdUtrId.trim()) {
        errors.stdUtrId = "Please enter your 12-digit UPI UTR / Transaction ID for the 20% payment";
      }
    } else if (way === "hold_24h") {
      if (!holdUtrId.trim()) {
        errors.holdUtrId = "Please enter your 12-digit UPI UTR / Transaction ID for the 10% hold token";
      }
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setSubmissionFeedback("Transaction ID recorded! Forwarding details to Rydex Admin for manual verification...");

    const generatedPaymentId =
      "RYD-PAY-" + Math.floor(Date.now() / 1000) + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    const activeUtr =
      way === "confirm_25"
        ? (confirm25UtrId.trim() || ("CONF25-" + Math.floor(100000 + Math.random() * 900000)))
        : way === "standard_booking"
        ? (stdUtrId.trim() || ("STD-" + Math.floor(100000 + Math.random() * 900000)))
        : (holdUtrId.trim() || ("HOLD-" + Math.floor(100000 + Math.random() * 900000)));

    const wayLabel =
      way === "confirm_25"
        ? "Confirm Booking - 25% Payment"
        : way === "standard_booking"
        ? "Standard Booking - 20% Payment"
        : "24 Hours Hold";

    const advancePaid =
      way === "confirm_25"
        ? advance25
        : way === "standard_booking"
        ? advance20
        : advance10;

    const remainingAtPickup = totalAmount - advancePaid;

    const newOrder = {
      paymentId: generatedPaymentId,
      bookingWay: way,
      bookingWayLabel: wayLabel,
      amount: advancePaid,
      advanceAmount: advancePaid,
      totalBookingAmount: totalAmount,
      total: totalAmount,
      remainingAtPickup: remainingAtPickup,
      method: "upi",
      status: "pending_admin", // Forwarded to admin, awaiting manual verification & permission
      verified: false,
      adminReviewState: "Pending Manual Review",
      timestamp: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      booking: {
        ...booking,
        car: carDisplayName,
        carBrand: carBrand,
        carModel: carModel,
        carImage: carImage,
      },
      car: carDisplayName,
      carImage: carImage,
      registrationNumber: booking.carRegistrationNumber || "TS 09 EZ 4082",
      pickupStatus: "Pickup Requested",
      userLocation: booking.userLocation || null,
      driver: {
        id: "DRV-101",
        name: "Ramesh Kumar",
        phone: "+91 98765 43210",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        licenseNumber: "TS09 20210084321",
      },
      carDetails: {
        brand: carBrand,
        model: carModel,
        registrationNumber: booking.carRegistrationNumber || "TS 09 EZ 4082",
        image: carImage,
        seats: booking.seats || 5,
        fuel: booking.fuel || "Diesel",
      },
      carTracking: {
        latitude: 17.4485,
        longitude: 78.3756,
        address: "Hitec City / Cyber Towers, Hyderabad",
        status: "Stationary (Cleaned & Sanitized)",
        speed: 0,
        updatedAt: new Date().toISOString(),
      },
      customerUser: currentUser?.username || booking.customer.name,
      utrId: activeUtr,
      bookingNote:
        bookingNote.trim() ||
        (way === "confirm_25"
          ? "25% Confirm booking advance payment"
          : way === "hold_24h"
          ? "24-hour vehicle hold request"
          : "20% Standard booking payment"),
      qrCodeUrl:
        way === "confirm_25"
          ? confirm25QrCodeUrl
          : way === "standard_booking"
          ? stdQrCodeUrl
          : holdQrCodeUrl,
      expiresAt: way === "hold_24h" ? Date.now() + 24 * 60 * 60 * 1000 : null,
    };

    // Save to all_orders list and current paymentData
    try {
      const existingRaw = localStorage.getItem("all_orders");
      const existingList = existingRaw ? JSON.parse(existingRaw) : [];
      existingList.unshift(newOrder);
      localStorage.setItem("all_orders", JSON.stringify(existingList));
      localStorage.setItem("paymentData", JSON.stringify(newOrder));
      localStorage.setItem("paymentStatus", "submitted_to_admin");

      if (way === "hold_24h") {
        localStorage.setItem("holdBooking", JSON.stringify(newOrder));
      }

      // Notify all tabs
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("rydex_order_update", { detail: newOrder }));

      // Persist directly to MongoDB
      mongoApi.saveOrder(newOrder);
    } catch (e) {
      console.error("Storage error:", e);
    }

    // Immediately conclude with "Done!" and route to Booking Success
    setTimeout(() => {
      setIsSubmitting(false);
      navigate("/booking-success", {
        state: newOrder,
      });
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 py-3.5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            to={`/book/${booking.carId || 1}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Reservation Details
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-800">Reservation Step 2:</span>
            <span className="text-blue-600 font-semibold">Payment & Confirmation</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">

            {/* RESTORED CAR DRAFT NOTIFICATION */}
            {location.state?.restoredFromDraft && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-sm flex items-center justify-between text-xs text-emerald-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-inner">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-black text-emerald-950 text-sm">
                      Saved Car Draft Restored: {carDisplayName}
                    </p>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      {currentUser
                        ? `Welcome, ${currentUser.name || currentUser.username}! Your selected reservation is loaded from draft. Select your advance payment option below to finalize booking.`
                        : "Your car configuration was safely preserved from draft. Sign in below to proceed."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2.1: CUSTOMER LOGIN REQUIREMENT BEFORE PAYMENT */}
            {!currentUser ? (
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-blue-500/30 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-950 uppercase tracking-wide">
                      <Lock className="w-3.5 h-3.5" /> Login Required Before Payment
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
                      Sign In to Proceed with Payment
                    </h2>
                    <p className="text-xs text-blue-200 leading-relaxed">
                      You are reserving <strong className="text-white">{carDisplayName}</strong>. Please log in with your customer account to unlock payment options and link this booking to your account.
                    </p>
                  </div>
                  <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-blue-300" />
                  </div>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-500/20 border border-rose-400/40 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCustomerSignIn} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-blue-200 mb-1">
                        Customer Username / Mobile
                      </label>
                      <input
                        type="text"
                        placeholder="Enter username or mobile"
                        value={authUsername}
                        onChange={(e) => setAuthUsername(e.target.value)}
                        className="w-full bg-slate-800/90 border border-blue-400/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-blue-200 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-slate-800/90 border border-blue-400/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleQuickFillCustomer}
                      className="text-xs text-amber-300 hover:text-amber-200 underline font-semibold"
                    >
                      Fill Demo: shameem / customer123
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      <span>{authLoading ? "Verifying..." : "Login & Unlock Payment"}</span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-blue-800/60 flex items-center justify-between text-xs text-blue-300">
                    <span>Prefer the dedicated sign-in portal?</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/login", {
                          state: {
                            booking,
                            redirectTo: "/payment",
                            message: `Sign in to confirm payment for ${carDisplayName}. Your car draft is preserved!`,
                          },
                        });
                      }}
                      className="text-white hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Go to Full Login Page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Customer Account Verified Strip */
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                    {currentUser?.username ? currentUser.username.charAt(0) : "C"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {currentUser?.username || "Customer"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Logged In & Ready to Pay
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      Phone: +91 {currentUser?.mobileNumber || booking.customer?.phone} · Verified Session
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSwitchLogin((prev) => !prev)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                  >
                    {showSwitchLogin ? "Close" : "Switch Account"}
                  </button>
                </div>
              </div>
            )}

            {/* In-page switch account drop-down if user clicks */}
            {currentUser && showSwitchLogin && (
              <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-800">Sign In to Another Customer Account</h3>
                {authError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                    {authError}
                  </div>
                )}
                <form onSubmit={handleCustomerSignIn} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Username / Phone"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <div className="sm:col-span-2 flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={handleQuickFillCustomer}
                      className="text-[11px] text-slate-500 hover:text-blue-600 underline"
                    >
                      Fill Demo: shameem / customer123
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
                    >
                      {authLoading ? "Logging in..." : "Switch Account"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PAYMENT OPTIONS - ALWAYS VISIBLE */}
            <div className="space-y-6">
                {/* Header announcement */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                      Select Booking Method
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Instant submission · Manual Admin Verification
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    Choose How You Want to Reserve
                  </h1>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Select <strong>Confirm Booking</strong> with a 25% advance payment for guaranteed vehicle allocation, <strong>Standard Booking</strong> (20% advance), or lock the car with a <strong>24-Hour Hold</strong> (10% token). All slots require Rydex Admin manual verification and permission.
                  </p>

                  {/* 3 Options Selector Tabs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                    {/* Option 1: Confirm Booking (25% Advance Payment) */}
                    <button
                      type="button"
                      onClick={() => setBookingWay("confirm_25")}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between relative overflow-hidden ${
                        bookingWay === "confirm_25"
                          ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                        Guaranteed Slot
                      </span>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">Confirm Booking</span>
                          <Zap className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          25% advance payment. Remaining 75% due at handover. Admin permission required.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-800 font-bold">25% Advance:</span>
                        <span className="text-xs font-extrabold text-emerald-700">₹{advance25}</span>
                      </div>
                    </button>

                    {/* Option 2: Standard Booking (20% Instant Payment) */}
                    <button
                      type="button"
                      onClick={() => setBookingWay("standard_booking")}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between relative overflow-hidden ${
                        bookingWay === "standard_booking"
                          ? "border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">Standard Booking</span>
                          <CalendarCheck className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          20% instant advance payment. Remaining 80% due upon vehicle handover.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-blue-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-blue-800 font-bold">20% Advance:</span>
                        <span className="text-xs font-extrabold text-blue-600">₹{advance20}</span>
                      </div>
                    </button>

                    {/* Option 3: 24 Hours Hold (10% Token) */}
                    <button
                      type="button"
                      onClick={() => setBookingWay("hold_24h")}
                      className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        bookingWay === "hold_24h"
                          ? "border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-400"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900">24 Hours Hold</span>
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          Lock car exclusively for 24 hours. Minimal 10% hold token payment.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-amber-800 font-bold">10% Token:</span>
                        <span className="text-xs font-extrabold text-amber-700">₹{advance10}</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* OPTION 1: CONFIRM BOOKING (25% Advance Payment Slot) */}
                {bookingWay === "confirm_25" && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-emerald-600" />
                          Confirm Booking (25% Advance Slot)
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ₹{advance25} Priority Advance (25%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Reserves your confirmed slot with a 25% advance payment. The remaining 75% (₹{totalAmount - advance25}) is payable upon vehicle handover. After submitting your 12-digit UPI UTR, Rydex Admin manually checks your transaction in bank records to grant final permission and dispatch confirmation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Left: QR Code Display for 25% */}
                      <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                        <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                          {confirm25QrCodeUrl ? (
                            <img
                              src={confirm25QrCodeUrl}
                              alt="Confirm Booking 25% UPI QR"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-slate-400">Generating 25% Payment QR...</div>
                          )}
                        </div>
                        <div className="mt-3 space-y-1">
                          <span className="text-xs font-bold text-slate-800 block">
                            Scan with GPay, PhonePe, Paytm or any UPI App
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Exact 25% Amount: <strong className="text-emerald-700 font-extrabold">₹{advance25}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Right: UPI ID & Payment Instructions */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Or Pay via Rydex Official UPI ID:
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 truncate">
                              {upiId}
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyUpi}
                              className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedUpi ? "Copied!" : "Copy"}</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/60 text-xs text-emerald-950 space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 25% Advance Instructions:
                          </p>
                          <ol className="list-decimal list-inside text-[11px] text-emerald-800 space-y-0.5">
                            <li>Send exactly <strong>₹{advance25}</strong> via your UPI application.</li>
                            <li>Copy the 12-digit UPI Reference / UTR Number from payment receipt.</li>
                            <li>Paste your Transaction ID below and submit for Admin permission and verification.</li>
                          </ol>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-800 block">
                              Enter 12-Digit Transaction / UTR ID: *
                            </label>
                            <button
                              type="button"
                              onClick={handleFillDemoUtr}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                            >
                              Quick Fill UTR
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. 423456789012 or UPI Ref"
                            value={confirm25UtrId}
                            onChange={(e) => {
                              setConfirm25UtrId(e.target.value);
                              if (validationErrors.confirm25UtrId) {
                                setValidationErrors((prev) => ({ ...prev, confirm25UtrId: null }));
                              }
                            }}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-medium focus:ring-2 focus:outline-none transition ${
                              validationErrors.confirm25UtrId
                                ? "border-rose-400 bg-rose-50/30 focus:ring-rose-400"
                                : "border-slate-300 focus:ring-emerald-500"
                            }`}
                          />
                          {validationErrors.confirm25UtrId && (
                            <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {validationErrors.confirm25UtrId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <label className="font-bold text-slate-700 text-xs block">
                        Optional Trip Note or Special Request for Admin:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Flight arrival details, airport drop-off time, child seat"
                        value={bookingNote}
                        onChange={(e) => setBookingNote(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Admin Permission Required</span>
                        <span className="text-[11px] text-amber-800">
                          Once submitted, your booking enters <strong>Pending Admin Review</strong>. Rydex Admin verifies the transaction in our bank statement to grant approval and confirm your booking.
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSubmitBooking("confirm_25")}
                      disabled={isSubmitting || !currentUser}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 text-sm transition flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      {!currentUser ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Log In Above to Confirm 25% Booking</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>
                            {isSubmitting
                              ? "Recording 25% Transaction & Forwarding to Admin..."
                              : `Done & Submit 25% Confirm Booking (Advance: ₹${advance25})`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* OPTION 1: STANDARD BOOKING (20% Instant Payment) */}
                {bookingWay === "standard_booking" && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <CalendarCheck className="w-5 h-5 text-blue-600" />
                          Standard Booking (20% Instant Payment)
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800">
                          ₹{advance20} Instant Advance (20%)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Standard booking requires a 20% instant payment. The remaining 80% (₹{totalAmount - advance20}) is payable upon vehicle handover. Your transaction ID is forwarded directly to Rydex Admin for manual verification.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Left: QR Code Display for 20% */}
                      <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
                        <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                          {stdQrCodeUrl ? (
                            <img
                              src={stdQrCodeUrl}
                              alt="Standard Booking 20% UPI QR"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="text-xs text-slate-400">Generating 20% Payment QR...</div>
                          )}
                        </div>
                        <div className="mt-3 space-y-1">
                          <span className="text-xs font-bold text-slate-800 block">
                            Scan with GPay, PhonePe, Paytm or any UPI App
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Exact 20% Amount: <strong className="text-blue-700 font-extrabold">₹{advance20}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Right: UPI ID & Payment Instructions */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 block">
                            Or Pay via Rydex Official UPI ID:
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 truncate">
                              {upiId}
                            </div>
                            <button
                              type="button"
                              onClick={handleCopyUpi}
                              className="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedUpi ? "Copied!" : "Copy"}</span>
                            </button>
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60 text-xs text-blue-900 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Instant Payment Instructions:
                          </p>
                          <ol className="list-decimal list-inside text-[11px] text-blue-800 space-y-0.5">
                            <li>Send exactly <strong>₹{advance20}</strong> via your UPI application.</li>
                            <li>Copy the 12-digit UPI Reference / UTR Number from payment receipt.</li>
                            <li>Paste your Transaction ID below and submit for manual admin check.</li>
                          </ol>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-800 block">
                              Enter 12-Digit Transaction / UTR ID: *
                            </label>
                            <button
                              type="button"
                              onClick={handleFillDemoUtr}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
                            >
                              Quick Fill UTR
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. 423456789012 or UPI Ref"
                            value={stdUtrId}
                            onChange={(e) => {
                              setStdUtrId(e.target.value);
                              if (validationErrors.stdUtrId) {
                                setValidationErrors((prev) => ({ ...prev, stdUtrId: null }));
                              }
                            }}
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-medium focus:ring-2 focus:outline-none transition ${
                              validationErrors.stdUtrId
                                ? "border-rose-400 bg-rose-50/30 focus:ring-rose-400"
                                : "border-slate-300 focus:ring-blue-500"
                            }`}
                          />
                          {validationErrors.stdUtrId && (
                            <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {validationErrors.stdUtrId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                      <label className="font-bold text-slate-700 text-xs block">
                        Optional Trip Note or Special Request for Admin:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Please arrange early handover, child seat requested, outstation trip to Srisailam"
                        value={bookingNote}
                        onChange={(e) => setBookingNote(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {submissionFeedback && (
                      <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{submissionFeedback}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSubmitBooking("standard_booking")}
                      disabled={isSubmitting || !currentUser}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 text-sm transition flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      {!currentUser ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Log In Above to Confirm Standard Booking</span>
                        </>
                      ) : (
                        <>
                          <FileCheck2 className="w-4 h-4" />
                          <span>
                            {isSubmitting
                              ? "Recording 20% Transaction & Forwarding..."
                              : `Done & Submit Standard Booking (20% Paid: ₹${advance20})`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* OPTION 2: 24 HOURS HOLD */}
                {bookingWay === "hold_24h" && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-amber-600" />
                          24 Hours Hold
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          Hold Guarantee
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Lock the vehicle for 24 hours so nobody else can book your dates. You can pay a small 10% hold token (₹{advance10}) or submit a 24-hour time hold request. Forwarded directly to admin for manual reservation lock.
                      </p>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 space-y-1">
                          <p className="font-bold text-sm">24-Hour Exclusivity Guarantee</p>
                          <p>
                            Your car will be reserved in your account with an active countdown timer. You can complete the remaining balance anytime from <strong>My Orders</strong> before the 24 hours expire.
                          </p>
                        </div>
                      </div>

                      {/* UPI QR for 10% hold token */}
                      <div className="bg-white p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center gap-4">
                        {holdQrCodeUrl && (
                          <img
                            src={holdQrCodeUrl}
                            alt="Hold QR"
                            className="w-32 h-32 rounded-lg border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="text-xs space-y-1">
                          <span className="text-amber-800 font-bold">10% Refundable Hold Token:</span>
                          <p className="text-xl font-extrabold text-amber-900">₹{advance10}</p>
                          <p className="text-slate-600 text-[11px]">
                            Scan to pay ₹{advance10} token to <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">{upiId}</code>, or submit hold request directly below.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-amber-950">
                            Optional UTR / Hold Request Note
                          </label>
                          <button
                            type="button"
                            onClick={handleFillDemoUtr}
                            className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300"
                          >
                            Fill Sample Ref
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Optional UPI UTR or Hold Note (e.g. HOLD-REQ-423589)"
                          value={holdUtrId}
                          onChange={(e) => setHoldUtrId(e.target.value)}
                          className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2.5 text-xs font-semibold uppercase focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSubmitBooking("hold_24h")}
                      disabled={isSubmitting || !currentUser}
                      className="w-full bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-600/30 text-sm transition flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      {!currentUser ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Log In Above to Submit Hold Request</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>
                            {isSubmitting
                              ? "Transmitting Hold Request..."
                              : "Done & Submit 24-Hour Hold Request"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
          </div>

          {/* Right Column: Booking Summary & Trust (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                Reservation Summary
              </h3>

              <div className="flex gap-4 items-center">
                <img
                  src={carImage}
                  alt={carDisplayName}
                  className="w-20 h-14 object-cover rounded-xl border border-slate-200"
                />
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {carBrand}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    {carModel}
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {booking.bookingType === "day"
                      ? `${booking.days} Days Rental`
                      : `${booking.hours} Hours Rental`}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Vehicle Rental:</span>
                  <span className="font-semibold text-slate-800">
                    ₹{totalAmount}
                  </span>
                </div>

                <div className="flex justify-between text-blue-700 font-bold bg-blue-50 p-2 rounded-lg">
                  <span>
                    {bookingWay === "confirm_25"
                      ? "25% Confirm Advance:"
                      : bookingWay === "standard_booking"
                      ? "20% Instant Advance:"
                      : "10% Hold Token:"}
                  </span>
                  <span>₹{currentAdvance}</span>
                </div>

                <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-100">
                  <span>Payable at Handover:</span>
                  <span className="font-bold text-slate-800">
                    ₹{totalAmount - currentAdvance}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Forwarded instantly to Hyderabad Operations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Manual Admin Verification & official voucher</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
