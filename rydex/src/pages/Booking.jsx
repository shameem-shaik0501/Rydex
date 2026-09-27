import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import cars from "../data/cars";
import locations from "../data/locations";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Car,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Lock,
  Sparkles,
  LogIn,
} from "lucide-react";

function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const locationState = useLocation().state;

  const car = cars.find((c) => c.id === Number(id));

  // Retrieve logged in user if any
  const storedUser = useMemo(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  // Retrieve saved car draft if matches current car
  const existingDraft = useMemo(() => {
    try {
      const raw = localStorage.getItem("current_draft_booking");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.carId === Number(id)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  }, [id]);

  // Form states initialized with prefill OR saved draft
  const [bookingType, setBookingType] = useState(
    locationState?.prefill?.bookingType || existingDraft?.bookingType || "day"
  );
  const [days, setDays] = useState(
    locationState?.prefill?.duration || existingDraft?.days || 2
  );
  const [hours, setHours] = useState(existingDraft?.hours || 6);

  const [pickupDate, setPickupDate] = useState(() => {
    if (existingDraft?.pickupDate) return existingDraft.pickupDate;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [pickupTime, setPickupTime] = useState(
    existingDraft?.pickupTime || "09:00"
  );

  const [pickupType, setPickupType] = useState(
    existingDraft?.pickupType || "Self pickup"
  );
  const [selectedHub, setSelectedHub] = useState(
    existingDraft?.hub || "HYD-MDP"
  );
  const [deliveryLocation, setDeliveryLocation] = useState(
    existingDraft?.deliveryLocation || "HYD-MDP"
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    existingDraft?.deliveryAddress || ""
  );

  const [withDriver] = useState(
    locationState?.prefill?.withDriver || existingDraft?.withDriver || false
  );
  const [zeroDepInsurance] = useState(
    existingDraft?.zeroDepInsurance || false
  );
  const [childSeat] = useState(existingDraft?.childSeat || false);

  // Customer Contact Info (auto-filled from logged in user or saved draft)
  const [customerName, setCustomerName] = useState(
    storedUser?.name || storedUser?.username || existingDraft?.customer?.name || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    storedUser?.mobileNumber || existingDraft?.customer?.phone || ""
  );
  const [customerEmail, setCustomerEmail] = useState(
    storedUser?.email || existingDraft?.customer?.email || ""
  );
  const [drivingLicense, setDrivingLicense] = useState(
    existingDraft?.customer?.dl || ""
  );
  const [errors, setErrors] = useState({});

  // 14. User Location state
  const [userLocation, setUserLocation] = useState(
    existingDraft?.userLocation || null
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locMsg, setLocMsg] = useState("");

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocMsg("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const addr = `Current Location (${lat}, ${lng})`;
        setUserLocation({ latitude: lat, longitude: lng, address: addr });
        if (pickupType === "Home delivery" && !deliveryAddress) {
          setDeliveryAddress(addr);
        }
        setIsLocating(false);
        setLocMsg("📍 Device location detected successfully!");
      },
      (err) => {
        setIsLocating(false);
        setLocMsg("Location permission denied or unavailable. Please enter address manually.");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const currentDeliveryCharge = useMemo(() => {
    if (pickupType === "Self pickup") return 0;
    const loc = locations.find((l) => l.id === deliveryLocation);
    return loc ? loc.deliveryCharge : 300;
  }, [pickupType, deliveryLocation]);

  if (!car) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Car Not Found</h2>
        <p className="text-slate-500 mt-2">
          The requested vehicle is not available for reservation.
        </p>
        <Link
          to="/cars"
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
        >
          Browse Fleet
        </Link>
      </div>
    );
  }

  // Price Calculations
  const durationCount = bookingType === "day" ? days : hours;
  const basePrice =
    bookingType === "day"
      ? car.price * days
      : (car.hourlyPrice || Math.round(car.price / 10)) * hours;

  const driverCharge = withDriver
    ? bookingType === "day"
      ? 800 * days
      : 150 * hours
    : 0;

  const insuranceCharge = zeroDepInsurance
    ? bookingType === "day"
      ? 299 * days
      : 100
    : 0;

  const childSeatCharge = childSeat ? 199 : 0;

  const subtotal =
    basePrice +
    currentDeliveryCharge +
    driverCharge +
    insuranceCharge +
    childSeatCharge;

  const gstAmount = Math.round(subtotal * 0.18); // 18% GST on car rental in India
  const totalAmount = subtotal + gstAmount;

  const advanceImmediate = Math.ceil(totalAmount * 0.2); // 20%

  const validateForm = () => {
    const errs = {};
    if (!customerName.trim()) errs.name = "Full name is required";
    if (!customerPhone.trim()) {
      errs.phone = "Mobile phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(customerPhone.trim())) {
      errs.phone = "Enter a valid 10-digit Indian phone number";
    }
    if (!customerEmail.trim()) {
      errs.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      errs.email = "Enter a valid email address";
    }
    if (!withDriver && !drivingLicense.trim()) {
      errs.dl = "Driving license number is required for self-drive";
    }
    if (pickupType === "Home delivery" && !deliveryAddress.trim()) {
      errs.address = "Please enter your street address for delivery";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildBookingPayload = () => {
    const chosenHubObj = locations.find((l) => l.id === selectedHub);
    const chosenDelivObj = locations.find((l) => l.id === deliveryLocation);

    return {
      carId: car.id,
      car: `${car.brand} ${car.model}`,
      carBrand: car.brand,
      carModel: car.model,
      carImage: car.image,
      bookingType,
      duration: durationCount,
      days: bookingType === "day" ? days : null,
      hours: bookingType === "hour" ? hours : null,
      pickupDate,
      pickupTime,
      pickupType,
      hub: pickupType === "Self pickup" ? chosenHubObj?.name : null,
      hubAddress: pickupType === "Self pickup" ? chosenHubObj?.address : null,
      deliveryLocation:
        pickupType === "Home delivery" ? chosenDelivObj?.name : null,
      deliveryAddress:
        pickupType === "Home delivery" ? deliveryAddress : null,
      deliveryFee: currentDeliveryCharge,
      withDriver,
      driverFee: driverCharge,
      zeroDepInsurance,
      insuranceFee: insuranceCharge,
      childSeat,
      basePrice,
      gst: gstAmount,
      total: totalAmount,
      advanceAmount: advanceImmediate,
      userLocation: userLocation,
      pickupStatus: "Pickup Requested",
      carRegistrationNumber: car.registrationNumber || "TS 09 EZ 4082",
      customer: {
        name: customerName.trim() || storedUser?.name || storedUser?.username || "Guest Customer",
        phone: customerPhone.trim() || storedUser?.mobileNumber || "",
        email: customerEmail.trim() || storedUser?.email || "",
        dl: drivingLicense.trim(),
      },
    };
  };

  const handleProceedToPayment = () => {
    const bookingPayload = buildBookingPayload();

    // Persist draft car in localStorage so it is never lost
    try {
      localStorage.setItem("current_draft_booking", JSON.stringify(bookingPayload));
    } catch (e) {
      console.error(e);
    }

    // If user is not logged in, redirect them to login with car draft preserved!
    if (!storedUser) {
      navigate("/login", {
        state: {
          booking: bookingPayload,
          redirectTo: "/payment",
          message: `Please log in to confirm your booking for ${car.brand} ${car.model}. Your car draft is safely saved!`,
        },
      });
      return;
    }

    if (!validateForm()) return;

    navigate("/payment", { state: { booking: bookingPayload } });
  };

  const handleSaveDraftAndLogin = () => {
    const bookingPayload = buildBookingPayload();
    try {
      localStorage.setItem("current_draft_booking", JSON.stringify(bookingPayload));
    } catch (e) {
      console.error(e);
    }
    navigate("/login", {
      state: {
        booking: bookingPayload,
        redirectTo: `/book/${car.id}`,
        message: `Sign in to auto-fill your details. Your draft for ${car.brand} ${car.model} is saved!`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200 py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            to={`/cars/${car.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Car Details
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-blue-600 font-bold">Step 1: Reservation</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Step 2: UPI Advance</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Step 3: Confirmed Voucher</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
          Reserve Your {car.brand} {car.model}
        </h1>

        {/* Guest User Draft Notice & Quick Sign In */}
        {!storedUser && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-inner">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="font-extrabold text-amber-950 text-sm">
                  Booking as Guest • Your Car Selection ({car.brand} {car.model}) is Saved as Draft
                </p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  When you proceed, we will safely save your chosen dates & duration, then take you to sign in. After login, your car draft is automatically restored!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveDraftAndLogin}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-xl shrink-0 transition text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In & Auto-fill Profile</span>
            </button>
          </div>
        )}

        {/* Existing Draft Restored Notice */}
        {existingDraft && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-950 mb-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Saved Car Draft Loaded:</strong> Your previously selected configuration for this {car.brand} {car.model} has been restored.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Rental Duration & Schedule */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Rental Duration & Schedule</span>
              </h2>

              <div className="space-y-4">
                {/* Type buttons */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Rental Format
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <button
                      type="button"
                      onClick={() => setBookingType("day")}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                        bookingType === "day"
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Per Day (₹{car.price}/day)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType("hour")}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                        bookingType === "hour"
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Hourly (₹{car.hourlyPrice || 150}/hr)
                    </button>
                  </div>
                </div>

                {/* Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {bookingType === "day" ? (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Number of Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={days}
                        onChange={(e) =>
                          setDays(Math.max(1, Number(e.target.value)))
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Number of Hours (Min 4 hrs)
                      </label>
                      <input
                        type="number"
                        min="4"
                        max="48"
                        value={hours}
                        onChange={(e) =>
                          setHours(Math.max(4, Number(e.target.value)))
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Trip Start Date
                    </label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Pickup Time
                    </label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup & Delivery Location */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Pickup & Handover Options</span>
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setPickupType("Self pickup")}
                    className={`p-3 text-left rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                      pickupType === "Self pickup"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>Self Pickup at Station</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">
                      FREE
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPickupType("Home delivery")}
                    className={`p-3 text-left rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                      pickupType === "Home delivery"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span>Doorstep Delivery</span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      From ₹200
                    </span>
                  </button>
                </div>

                {pickupType === "Self pickup" ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Choose Pickup Station
                    </label>
                    <select
                      value={selectedHub}
                      onChange={(e) => setSelectedHub(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 mb-2"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      📍 <strong>Address:</strong>{" "}
                      {locations.find((l) => l.id === selectedHub)?.address}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* 14. User Location - Request browser/device location permission */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                      <div>
                        <span className="text-xs font-bold text-blue-950 block">
                          Use Device GPS Location
                        </span>
                        <span className="text-[11px] text-blue-700">
                          {userLocation
                            ? `Detected: ${userLocation.latitude}, ${userLocation.longitude}`
                            : "Provide your current coordinates for precise car delivery"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isLocating}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isLocating ? "Detecting..." : "Detect Current Location"}</span>
                      </button>
                    </div>

                    {locMsg && (
                      <p className={`text-xs font-semibold ${locMsg.includes("📍") ? "text-emerald-700" : "text-amber-700"}`}>
                        {locMsg}
                      </p>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Delivery Zone Area
                      </label>
                      <select
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} (+₹{loc.deliveryCharge} delivery)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Exact Delivery Street Address & Apartment / Landmark
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Flat 402, Sunshine Heights, Madhapur Main Road"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      {errors.address && (
                        <p className="text-xs text-red-600 mt-1">
                          {errors.address}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Driver / Customer Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Primary Driver & Contact Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter name as on Driving License"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="To receive booking voucher & invoice"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                {!withDriver && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Driving License Number *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TS09 20200012345"
                      value={drivingLicense}
                      onChange={(e) => setDrivingLicense(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                    />
                    {errors.dl && (
                      <p className="text-xs text-red-600 mt-1">{errors.dl}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Rail: Booking Summary & Total (1 col) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-6">
              {/* Car Card Preview */}
              <div className="flex gap-4 items-center border-b border-slate-100 pb-4">
                <img
                  src={car.image}
                  alt={car.model}
                  className="w-20 h-16 object-cover rounded-xl border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {car.brand} {car.model}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {car.seats} Seats (incl. driver) · {car.ac !== false ? "AC" : "Non-AC"} · {car.fuel}
                  </p>
                  <p className="text-xs font-semibold text-blue-600 mt-0.5">
                    ₹{car.price} / day
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>
                    Base Rental ({durationCount}{" "}
                    {bookingType === "day" ? "days" : "hours"})
                  </span>
                  <span className="font-semibold text-slate-800">
                    ₹{basePrice}
                  </span>
                </div>

                {currentDeliveryCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Doorstep Delivery Charge</span>
                    <span className="font-semibold text-slate-800">
                      ₹{currentDeliveryCharge}
                    </span>
                  </div>
                )}

                {driverCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Chauffeur Service</span>
                    <span className="font-semibold text-slate-800">
                      ₹{driverCharge}
                    </span>
                  </div>
                )}

                {insuranceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Zero-Dep Damage Protection</span>
                    <span className="font-semibold text-slate-800">
                      ₹{insuranceCharge}
                    </span>
                  </div>
                )}

                {childSeatCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Child Safety Seat</span>
                    <span className="font-semibold text-slate-800">
                      ₹{childSeatCharge}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>GST & Road Safety Cess (18%)</span>
                  <span className="font-semibold text-slate-800">
                    ₹{gstAmount}
                  </span>
                </div>

                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Refundable Security Deposit</span>
                  <span>₹0 (Waived)</span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-blue-600">₹{totalAmount}</span>
                </div>
              </div>

              {/* Token Advance Callout */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs">
                <div className="flex items-center justify-between font-bold text-blue-900 mb-1">
                  <span>Advance Payment (20%)</span>
                  <span className="text-sm">₹{advanceImmediate}</span>
                </div>
                <p className="text-[11px] text-blue-700">
                  Pay ₹{advanceImmediate} via instant UPI on next screen to
                  confirm booking. Remaining ₹{totalAmount - advanceImmediate}{" "}
                  payable at vehicle handover.
                </p>
              </div>

              {/* Action Button */}
              {!storedUser ? (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 text-sm transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Save Car Draft & Log In to Book</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 text-sm transition flex items-center justify-center gap-2"
                >
                  <span>Continue to Instant UPI Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant automated booking voucher generation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Booking;
