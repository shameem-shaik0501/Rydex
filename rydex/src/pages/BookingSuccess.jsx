import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Download,
  ShieldCheck,
  PhoneCall,
  ArrowRight,
  Clock,
  User,
  Users,
  Fuel,
  Share2,
  Sparkles,
} from "lucide-react";
import { downloadBookingReport } from "../utils/pdfGenerator";
import { PICKUP_STATUS_STEPS, formatSeating } from "../config/rentalConfig";
import mongoApi from "../services/mongoApi";

function BookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentBooking, setCurrentBooking] = useState(() => {
    if (location.state) return location.state;
    try {
      const p = localStorage.getItem("paymentData");
      if (p) return JSON.parse(p);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [pickupConfirmedByCustomer, setPickupConfirmedByCustomer] = useState(false);

  useEffect(() => {
    const checkUpdates = () => {
      try {
        const rawOrders = localStorage.getItem("all_orders");
        if (rawOrders && currentBooking) {
          const orders = JSON.parse(rawOrders);
          const found = orders.find(
            (o) =>
              o.paymentId === currentBooking.paymentId ||
              (o.utrId && o.utrId === currentBooking.utrId)
          );
          if (found) {
            setCurrentBooking((prev) => ({
              ...prev,
              ...found,
            }));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener("storage", checkUpdates);
    window.addEventListener("rydex_order_update", checkUpdates);
    const interval = setInterval(checkUpdates, 2500);

    return () => {
      window.removeEventListener("storage", checkUpdates);
      window.removeEventListener("rydex_order_update", checkUpdates);
      clearInterval(interval);
    };
  }, [currentBooking?.paymentId, currentBooking?.utrId]);

  if (!currentBooking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800">No Booking Data Found</h2>
        <p className="text-slate-500 mt-2">Could not retrieve booking confirmation.</p>
        <Link
          to="/cars"
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
        >
          Return to Fleet
        </Link>
      </div>
    );
  }

  const handleDownload = () => {
    downloadBookingReport(currentBooking);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const bookingId =
    currentBooking.bookingId ||
    currentBooking.paymentId?.replace("RYD-PAY-", "RYD-BK-") ||
    "RYD-BK-HYD-500081";

  // 13. Pickup Workflow current state
  const currentPickupStatus = currentBooking.pickupStatus || "Pickup Requested";
  const currentPickupStepIdx = PICKUP_STATUS_STEPS.indexOf(currentPickupStatus);

  const handleConfirmPickup = async () => {
    const nextStatus = "Picked Up";
    setPickupConfirmedByCustomer(true);
    setCurrentBooking((prev) => ({ ...prev, pickupStatus: nextStatus }));

    await mongoApi.updatePickupStatus(currentBooking.paymentId, nextStatus);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));
  };

  // Car Details & Driver Details
  const assignedDriver = currentBooking.driver || {
    name: "Ramesh Kumar",
    phone: "+91 98765 43210",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    licenseNumber: "TS09 20210084321",
  };

  const carRegNumber =
    currentBooking.registrationNumber ||
    currentBooking.carRegistrationNumber ||
    "TS 09 EZ 4082";

  const pickupLocationName =
    currentBooking.pickupType === "Self pickup"
      ? currentBooking.hub || currentBooking.booking?.hub || "Designated Station"
      : currentBooking.deliveryAddress ||
        currentBooking.deliveryLocation ||
        currentBooking.booking?.deliveryAddress ||
        "Doorstep Handover";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Booking Confirmed & Details Dispatched!
          </h1>

          <p className="text-xs sm:text-sm font-medium text-slate-600">
            Booking ID: <strong className="text-slate-900 font-mono">{bookingId}</strong> · Your vehicle and driver details are confirmed below.
          </p>
        </div>

        {/* 16. Confirmation Notification Card */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h3 className="font-extrabold text-emerald-950 text-sm">
              Car & Driver Details Dispatched to Customer
            </h3>
            <p className="text-emerald-800 leading-relaxed">
              We have dispatched this confirmation with car registration number and assigned driver details to your registered phone{" "}
              <strong>(+91 {currentBooking.customer?.phone || "Phone on file"})</strong> and email.
            </p>
          </div>
        </div>

        {/* 13. CAR PICKUP WORKFLOW STEPPER */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Car Pickup Status
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Current Status: <span className="text-blue-600">{currentPickupStatus}</span>
              </h2>
            </div>
            {currentPickupStatus === "Ready for Pickup" && !pickupConfirmedByCustomer && (
              <button
                type="button"
                onClick={handleConfirmPickup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Confirm Car Picked Up
              </button>
            )}
          </div>

          {/* Stepper Dots & Labels */}
          <div className="grid grid-cols-5 gap-1.5 text-center">
            {PICKUP_STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentPickupStepIdx;
              const isCurrent = idx === currentPickupStepIdx;
              return (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      isPast
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isPast ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-semibold leading-tight line-clamp-2 ${
                      isCurrent ? "text-blue-700 font-extrabold" : "text-slate-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 16. CONFIRMATION DETAILS: CAR & DRIVER DETAILS CARD */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Assigned Vehicle & Chauffeur Information</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CAR DETAILS */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Car Details
              </span>
              <div className="flex items-center gap-3">
                {currentBooking.carImage && (
                  <img
                    src={currentBooking.carImage}
                    alt="Vehicle"
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white"
                  />
                )}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {typeof currentBooking.car === "object"
                      ? `${currentBooking.car.brand || ""} ${currentBooking.car.model || ""}`.trim()
                      : currentBooking.car || "Rydex Vehicle"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-white">
                      {carRegNumber}
                    </span>
                    <span className="text-xs text-slate-600 font-semibold">
                      {formatSeating(currentBooking.car)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-[10px] block">Pickup Type:</span>
                  <span className="font-semibold text-slate-800">
                    {currentBooking.pickupType || "Self Pickup"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Handover Location:</span>
                  <span className="font-semibold text-slate-800">{pickupLocationName}</span>
                </div>
              </div>
            </div>

            {/* DRIVER DETAILS */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Driver & Coordinator
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={assignedDriver.photo}
                  alt={assignedDriver.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {assignedDriver.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    DL: {assignedDriver.licenseNumber}
                  </p>
                  <a
                    href={`tel:${assignedDriver.phone}`}
                    className="inline-flex items-center gap-1.5 mt-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{assignedDriver.phone}</span>
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600">
                <p>
                  Driver will verify your original Driving License and handover car keys upon verification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule & Financial Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Schedule & Financial Summary
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Pickup Date & Time</span>
              <p className="font-bold text-slate-800">
                {currentBooking.pickupDate} at {currentBooking.pickupTime}
              </p>
              <p className="text-slate-500">
                Duration: {currentBooking.days || currentBooking.duration || 1} Days
              </p>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Handover Mode</span>
              <p className="font-bold text-slate-800">
                {currentBooking.pickupType === "Self pickup" ? "Station Pickup (FREE)" : "Doorstep Delivery"}
              </p>
              <p className="text-slate-500">{pickupLocationName}</p>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Transaction Ref (UTR)</span>
              <p className="font-mono font-bold text-slate-900">
                {currentBooking.utrId || "STD-REQ-AUTO"}
              </p>
              <p className="text-emerald-700 font-semibold">Advance Paid: ₹{currentBooking.advanceAmount || 0}</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs">
            <span className="text-slate-600">Remaining Balance due at pickup handover:</span>
            <span className="font-black text-slate-900 text-sm">
              ₹{currentBooking.remainingAtPickup || currentBooking.total - (currentBooking.advanceAmount || 0)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{downloadSuccess ? "Report Downloaded!" : "Download Official PDF"}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/my-orders")}
            className="w-full sm:flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2"
          >
            <span>Go to My Bookings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingSuccess;
