import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import mongoApi from "../services/mongoApi";
import { PICKUP_STATUS_STEPS } from "../config/rentalConfig";
import {
  Clock,
  Car,
  ArrowRight,
  FileText,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Zap,
  CalendarCheck,
  ShieldCheck,
  MapPin,
  Calendar,
  ExternalLink,
  Navigation,
  PhoneCall,
  User,
} from "lucide-react";
import { downloadBookingReport } from "../utils/pdfGenerator";

function MyOrders() {
  // Safe helper to extract vehicle name string from string or object
  const getCarTitle = (item) => {
    if (!item) return "Rydex Vehicle";
    const car = item.booking?.car || item.car;
    if (!car) return "Rydex Vehicle";
    if (typeof car === "string") return car;
    if (typeof car === "object") {
      return `${car.brand || ""} ${car.model || ""}`.trim() || car.name || "Rydex Vehicle";
    }
    return "Rydex Vehicle";
  };

  // Load orders list with real-time synchronization
  const [orders, setOrders] = useState(() => {
    try {
      const all = localStorage.getItem("all_orders");
      if (all) {
        const parsed = JSON.parse(all);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const single = localStorage.getItem("paymentData");
      if (single) return [JSON.parse(single)];
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Hold booking state with live countdown
  const [holdBooking, setHoldBooking] = useState(() => {
    try {
      const hold = localStorage.getItem("holdBooking");
      return hold ? JSON.parse(hold) : null;
    } catch {
      return null;
    }
  });

  const [timeLeft, setTimeLeft] = useState(0);
  const [activeTab, setActiveTab] = useState("all"); // "all", "confirmed", "pending", "on_hold", "past"
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const handleCustomerPickupDone = async (paymentId) => {
    const nextStatus = "Picked Up";
    setOrders((prev) =>
      prev.map((o) =>
        o.paymentId === paymentId ? { ...o, pickupStatus: nextStatus } : o
      )
    );
    await mongoApi.updatePickupStatus(paymentId, nextStatus);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));
  };

  // Quick upgrade to 25% confirmed for on-hold bookings
  const [holdUtrInput, setHoldUtrInput] = useState("");
  const [holdSuccessMsg, setHoldSuccessMsg] = useState("");

  // Customer re-submitting rejected UTR
  const [reSubmitUtr, setReSubmitUtr] = useState({});
  const [resubmitSuccess, setResubmitSuccess] = useState("");

  // Sync orders with localStorage changes (e.g. when Admin verifies in another tab/window)
  useEffect(() => {
    const syncFromStorage = async () => {
      try {
        // Also sync from MongoDB
        const remoteOrders = await mongoApi.getOrders();
        if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
          setOrders(remoteOrders);
        } else {
          const all = localStorage.getItem("all_orders");
          if (all) {
            const parsed = JSON.parse(all);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setOrders(parsed);
            } else {
              const single = localStorage.getItem("paymentData");
              if (single) setOrders([JSON.parse(single)]);
              else setOrders([]);
            }
          } else {
            const single = localStorage.getItem("paymentData");
            if (single) setOrders([JSON.parse(single)]);
          }
        }
        const hold = localStorage.getItem("holdBooking");
        if (hold) {
          setHoldBooking(JSON.parse(hold));
        } else {
          setHoldBooking(null);
        }
      } catch (e) {
        console.error(e);
      }
    };

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("rydex_order_update", syncFromStorage);
    const interval = setInterval(syncFromStorage, 4000);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("rydex_order_update", syncFromStorage);
      clearInterval(interval);
    };
  }, []);

  // Countdown timer for on-hold booking
  useEffect(() => {
    if (holdBooking && holdBooking.expiresAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const diff = holdBooking.expiresAt - now;
        if (diff <= 0) {
          setTimeLeft(0);
          localStorage.removeItem("holdBooking");
          setHoldBooking(null);
          clearInterval(interval);
        } else {
          setTimeLeft(diff);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [holdBooking]);

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, "0")}h ${minutes
      .toString()
      .padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  };

  const handleCancelOrder = (paymentId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    const updated = orders.map((ord) => {
      if (ord.paymentId === paymentId) {
        return { ...ord, status: "cancelled", tripStatus: "Cancelled" };
      }
      return ord;
    });
    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));

    if (holdBooking && holdBooking.paymentId === paymentId) {
      localStorage.removeItem("holdBooking");
      setHoldBooking(null);
    }

    // Persist cancel to MongoDB
    mongoApi.updateOrder(paymentId, { status: "cancelled", tripStatus: "Cancelled" });
  };

  // Submit 25% Advance payment for on-hold booking
  const handleUpgradeHoldTo25 = () => {
    if (!holdUtrInput.trim()) {
      alert("Please enter your 12-digit UPI UTR");
      return;
    }

    const advance25 = Math.ceil((holdBooking.booking?.total || 3000) * 0.25);
    const confirmedOrder = {
      paymentId: "RYD-PAY-" + Date.now().toString().slice(-6),
      bookingWay: "confirm_25",
      bookingWayLabel: "Confirm Booking - 25% Payment",
      amount: advance25,
      totalBookingAmount: holdBooking.booking?.total || holdBooking.totalBookingAmount,
      remainingAtPickup: (holdBooking.booking?.total || 3000) - advance25,
      method: "upi",
      status: "pending_admin",
      verified: false,
      adminReviewState: "Pending Manual Review",
      timestamp: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      booking: holdBooking.booking,
      utrId: holdUtrInput.trim(),
      bookingNote: "Upgraded from 24h Hold to 25% Confirm Payment",
    };

    const updated = orders.map((o) =>
      o.paymentId === holdBooking.paymentId ? confirmedOrder : o
    );
    if (!updated.some((o) => o.paymentId === confirmedOrder.paymentId)) {
      updated.unshift(confirmedOrder);
    }
    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));
    localStorage.setItem("paymentData", JSON.stringify(confirmedOrder));
    localStorage.removeItem("holdBooking");
    setHoldBooking(null);
    setHoldUtrInput("");

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));

    // Persist to MongoDB
    mongoApi.saveOrder(confirmedOrder);

    setHoldSuccessMsg("Done! 25% Advance UTR submitted and forwarded to Admin for verification.");
    setTimeout(() => setHoldSuccessMsg(""), 4000);
  };

  // Customer re-submits corrected UTR after rejection
  const handleCustomerResubmitUtr = (paymentId) => {
    const utr = reSubmitUtr[paymentId]?.trim();
    if (!utr) {
      alert("Please enter the 12-digit transaction UTR number");
      return;
    }

    const updated = orders.map((o) => {
      if (o.paymentId === paymentId) {
        return {
          ...o,
          utrId: utr,
          status: "pending_admin",
          adminReviewState: "Pending Manual Review (Resubmitted)",
          rejectionReason: null,
          resubmittedAt: new Date().toISOString(),
        };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));

    try {
      const current = localStorage.getItem("paymentData");
      if (current) {
        const parsed = JSON.parse(current);
        if (parsed.paymentId === paymentId) {
          parsed.utrId = utr;
          parsed.status = "pending_admin";
          parsed.adminReviewState = "Pending Manual Review (Resubmitted)";
          parsed.rejectionReason = null;
          parsed.resubmittedAt = new Date().toISOString();
          localStorage.setItem("paymentData", JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.error(e);
    }

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));

    // Persist to MongoDB
    mongoApi.updateOrder(paymentId, {
      utrId: utr,
      status: "pending_admin",
      adminReviewState: "Pending Manual Review (Resubmitted)",
      rejectionReason: null,
      resubmittedAt: new Date().toISOString(),
    });

    setResubmitSuccess("Transaction reference re-submitted! Rydex Operations will reverify it shortly.");
    setReSubmitUtr((prev) => ({ ...prev, [paymentId]: "" }));
    setTimeout(() => setResubmitSuccess(""), 4000);
  };

  const filteredOrders = orders.filter((ord) => {
    if (activeTab === "confirmed") return ord.status === "success" || ord.verified;
    if (activeTab === "pending")
      return ord.status === "pending_admin" || ord.status === "pending" || (!ord.verified && ord.status !== "rejected" && ord.status !== "cancelled");
    if (activeTab === "on_hold")
      return ord.bookingWay === "hold_24h" || ord.status === "on_hold";
    if (activeTab === "past")
      return ord.status === "completed" || ord.status === "cancelled" || ord.status === "rejected";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                My Rental Bookings & Vouchers
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                Self-Service
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              View your booking status, UTR transaction records, and booking verification status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/cars"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <span>Book Another Car</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {holdSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{holdSuccessMsg}</span>
          </div>
        )}

        {resubmitSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resubmitSuccess}</span>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg transition font-bold ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Bookings ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-3.5 py-1.5 rounded-lg transition font-bold flex items-center gap-1 ${
              activeTab === "pending"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-amber-800 hover:bg-amber-50"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>
              Pending Admin Review (
              {orders.filter((o) => o.status === "pending_admin" || (!o.verified && o.status !== "rejected" && o.status !== "cancelled")).length}
              )
            </span>
          </button>
          <button
            onClick={() => setActiveTab("confirmed")}
            className={`px-3.5 py-1.5 rounded-lg transition font-bold flex items-center gap-1 ${
              activeTab === "confirmed"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>
              Verified & Confirmed (
              {orders.filter((o) => o.status === "success" || o.verified).length}
              )
            </span>
          </button>
          <button
            onClick={() => setActiveTab("on_hold")}
            className={`px-3.5 py-1.5 rounded-lg transition font-bold ${
              activeTab === "on_hold"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            24-Hour Holds ({orders.filter((o) => o.bookingWay === "hold_24h").length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-3.5 py-1.5 rounded-lg transition font-bold ${
              activeTab === "past"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Cancelled / Rejected (
            {orders.filter((o) => o.status === "cancelled" || o.status === "rejected").length}
            )
          </button>
        </div>

        {/* 24-Hour Hold Banner (if active) */}
        {holdBooking && (activeTab === "all" || activeTab === "on_hold") && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-amber-200">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                  <Clock className="w-3.5 h-3.5 animate-pulse" /> 24 HOURS HOLD ACTIVE
                </span>
                <h3 className="text-xl font-black text-amber-950 mt-1.5">
                  {getCarTitle(holdBooking)}
                </h3>
                <p className="text-xs text-amber-800">
                  Pickup: {holdBooking.booking?.pickupDate} at {holdBooking.booking?.pickupTime}
                </p>
              </div>

              <div className="bg-white/90 p-3 rounded-xl border border-amber-200 text-right">
                <span className="text-[11px] text-amber-700 font-bold block">
                  Time Left on 24h Lock
                </span>
                <p className="font-mono text-base font-black text-amber-900">
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <p className="text-xs text-amber-950 font-medium mb-2">
                  Upgrade to <strong>Confirm Booking with 25% Advance</strong> (₹
                  {Math.ceil((holdBooking.booking?.total || 3000) * 0.25)}) to guarantee priority vehicle dispatch.
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter 12-digit UPI UTR"
                      value={holdUtrInput}
                      onChange={(e) => setHoldUtrInput(e.target.value)}
                      className="bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-semibold uppercase flex-1 focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setHoldUtrInput("UTR" + Date.now().toString().slice(-9))}
                      className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-1 rounded-lg border border-amber-300"
                    >
                      Fill Demo
                    </button>
                  </div>
                  <button
                    onClick={handleUpgradeHoldTo25}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Done & Submit 25% Payment to Admin</span>
                  </button>
                </div>
              </div>

              {holdBooking.qrCodeUrl && (
                <div className="text-center bg-white p-3 rounded-xl border border-amber-200 max-w-[200px] mx-auto shadow-sm">
                  <img
                    src={holdBooking.qrCodeUrl}
                    alt="Scan UPI"
                    className="w-32 h-32 mx-auto rounded-lg"
                  />
                  <p className="text-[11px] font-mono font-bold text-slate-800 mt-1">
                    7981033649-2@ibl
                  </p>
                  <p className="text-[10px] text-blue-700 font-bold">
                    25%: ₹{Math.ceil((holdBooking.booking?.total || 3000) * 0.25)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <Car className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Bookings Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't placed any car rental reservations yet. Choose from our certified fleet across Hyderabad.
            </p>
            <Link
              to="/cars"
              className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-blue-700 transition"
            >
              Browse Available Fleet
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((ord, idx) => {
              const isVerified = ord.verified || ord.status === "success";
              const isRejected = ord.status === "rejected";
              const isCancelled = ord.status === "cancelled";
              const way = ord.bookingWay || "confirm_25";

              return (
                <div
                  key={ord.paymentId || idx}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:border-slate-300 transition space-y-4"
                >
                  {/* Card Top Strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {getCarTitle(ord)}
                        </h3>

                        {/* Booking Way Badge */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                            way === "confirm_25"
                              ? "bg-blue-100 text-blue-800"
                              : way === "hold_24h"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {way === "confirm_25" && <Zap className="w-3 h-3" />}
                          {way === "hold_24h" && <Clock className="w-3 h-3" />}
                          {way === "standard_booking" && <CalendarCheck className="w-3 h-3" />}
                          <span>{ord.bookingWayLabel || "Reservation"}</span>
                        </span>

                        {/* Verification Status */}
                        {isVerified ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified & Confirmed</span>
                          </span>
                        ) : isRejected ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Rejected</span>
                          </span>
                        ) : isCancelled ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Cancelled
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Under Admin Verification</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1">
                        Ref: #{ord.paymentId} · Booked on{" "}
                        {new Date(ord.timestamp || ord.submittedAt || "2026-09-22").toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-base font-black text-blue-600">
                        ₹{ord.totalBookingAmount || ord.booking?.total || ord.amount}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Advance: <strong>₹{ord.amount || 0}</strong> · Balance at pickup:{" "}
                        <strong>₹{ord.remainingAtPickup || 0}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Trip Schedule</span>
                      <p className="font-semibold text-slate-800">
                        {ord.booking?.pickupDate} at {ord.booking?.pickupTime}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ord.booking?.days || ord.booking?.hours || 1}{" "}
                        {ord.booking?.bookingType === "day" ? "Days" : "Hours"}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Handover Location</span>
                      <p className="font-semibold text-slate-800">
                        {ord.booking?.pickupType === "Self pickup"
                          ? `Station: ${ord.booking?.hub || ord.hub || "Designated Location"}`
                          : `Delivery: ${ord.booking?.deliveryAddress || ord.booking?.deliveryLocation || "Doorstep"}`}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {ord.booking?.withDriver ? "With Chauffeur" : "Self-Drive Vehicle"}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Transaction ID / UTR</span>
                      <p className="font-mono font-bold text-slate-900">
                        {ord.utrId || "STD-DIRECT"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {isVerified ? "Verified by Admin" : "Forwarded to Admin"}
                      </p>
                    </div>
                  </div>

                  {/* 13. Car Pickup Workflow Stepper */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Pickup Lifecycle:</span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {ord.pickupStatus || "Pickup Requested"}
                        </span>
                      </div>
                      {ord.pickupStatus === "Ready for Pickup" && (
                        <button
                          type="button"
                          onClick={() => handleCustomerPickupDone(ord.paymentId)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition"
                        >
                          Confirm Vehicle Picked Up
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-1 text-center pt-1">
                      {PICKUP_STATUS_STEPS.map((step, sIdx) => {
                        const curIdx = PICKUP_STATUS_STEPS.indexOf(ord.pickupStatus || "Pickup Requested");
                        const isPast = sIdx < curIdx;
                        const isCur = sIdx === curIdx;
                        return (
                          <div key={step} className="flex flex-col items-center">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isPast
                                  ? "bg-emerald-600 text-white"
                                  : isCur
                                  ? "bg-blue-600 text-white ring-2 ring-blue-200"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {isPast ? "✓" : sIdx + 1}
                            </div>
                            <span className="text-[9px] mt-1 text-slate-600 line-clamp-1">{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assigned Vehicle & Chauffeur Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                        🚗
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {ord.registrationNumber || ord.carRegistrationNumber || "TS 09 EZ 4082"}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                            Active
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px] block">
                          Chauffeur: {ord.driver?.name || "Ramesh Kumar"} ({ord.driver?.phone || "+91 98765 43210"})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Notice & Re-submit UTR action for customer */}
                  {isRejected && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs text-red-900 block">
                            Booking Flagged / Verification Rejected:
                          </span>
                          <p className="text-xs text-red-700 mt-0.5">
                            {ord.rejectionReason || "UTR number could not be verified in Rydex bank records."}
                          </p>
                          <p className="text-[11px] text-red-600 mt-1">
                            Please check your UPI app (Google Pay, PhonePe, Paytm, CRED) for the exact 12-digit UTR reference and re-submit it below for immediate reverification by our Hyderabad desk.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-red-200/60">
                        <input
                          type="text"
                          placeholder="Enter Correct 12-digit UPI UTR"
                          value={reSubmitUtr[ord.paymentId] || ""}
                          onChange={(e) =>
                            setReSubmitUtr({ ...reSubmitUtr, [ord.paymentId]: e.target.value })
                          }
                          className="w-full sm:w-auto flex-1 bg-white border border-red-300 rounded-xl px-3 py-2 text-xs font-semibold uppercase text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleCustomerResubmitUtr(ord.paymentId)}
                          className="w-full sm:w-auto px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition shadow-sm whitespace-nowrap"
                        >
                          Re-Submit for Reverification
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Card Bottom Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-[11px] text-slate-500">
                      Trip Status:{" "}
                      <span className="font-bold text-slate-800">
                        {ord.tripStatus || "Confirmed"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadBookingReport(ord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition"
                        title="Download official PDF booking report"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Report</span>
                      </button>

                      <button
                        onClick={() => setSelectedVoucher(ord)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Voucher</span>
                      </button>

                      {!isCancelled && ord.status !== "completed" && (
                        <button
                          onClick={() => handleCancelOrder(ord.paymentId)}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Voucher Modal */}
        {selectedVoucher && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Official Rental Voucher</h3>
                  <p className="text-xs text-slate-500">Ref: #{selectedVoucher.paymentId}</p>
                </div>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50 rounded-xl space-y-1">
                  <span className="font-bold text-blue-900 text-sm">
                    {getCarTitle(selectedVoucher)}
                  </span>
                  <p className="text-blue-800">
                    Booking Option: {selectedVoucher.bookingWayLabel || "Standard"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Customer</span>
                    <p className="font-bold">{selectedVoucher.booking?.customer?.name}</p>
                    <p>{selectedVoucher.booking?.customer?.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Schedule</span>
                    <p className="font-bold">
                      {selectedVoucher.booking?.pickupDate} at {selectedVoucher.booking?.pickupTime}
                    </p>
                    <p>{selectedVoucher.booking?.pickupType}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-bold text-slate-900">
                      ₹{selectedVoucher.totalBookingAmount || selectedVoucher.booking?.total}
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-bold">
                    <span>Advance Submitted:</span>
                    <span>₹{selectedVoucher.amount || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-bold border-t border-slate-200 pt-1">
                    <span>Balance at Handover:</span>
                    <span>₹{selectedVoucher.remainingAtPickup || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1">
                    <span>UTR / Transaction ID:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedVoucher.utrId || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Admin Verification:</span>
                    <span
                      className={`font-bold ${
                        selectedVoucher.verified || selectedVoucher.status === "success"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {selectedVoucher.verified || selectedVoucher.status === "success"
                        ? "Verified by Operations Admin"
                        : "Pending Manual Review"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  onClick={() => downloadBookingReport(selectedVoucher)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Download Report (PDF)
                </button>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
