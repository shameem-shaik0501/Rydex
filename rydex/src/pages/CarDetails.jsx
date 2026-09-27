import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getStoredCars } from "../data/cars";
import { formatMileage, formatSeating } from "../config/rentalConfig";
import {
  Fuel,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Star,
  MapPin,
  Sparkles,
  Wind,
} from "lucide-react";

function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const fleetCars = getStoredCars();
  const car = fleetCars.find((c) => c.id === Number(id));

  // Quick configurator inside details
  const [bookingType, setBookingType] = useState("day");
  const [duration, setDuration] = useState(2);
  const [withDriver, setWithDriver] = useState(false);

  if (!car) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Car Not Found</h2>
        <p className="text-slate-500 mt-2">The requested vehicle could not be found in our fleet.</p>
        <Link
          to="/cars"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Back to Fleet
        </Link>
      </div>
    );
  }

  const baseTotal =
    bookingType === "day"
      ? car.price * duration
      : (car.hourlyPrice || Math.round(car.price / 10)) * duration;
  const driverFee = withDriver ? (bookingType === "day" ? 800 * duration : 150 * duration) : 0;
  const estimatedTotal = baseTotal + driverFee;

  const handleProceedToBooking = () => {
    navigate(`/book/${car.id}`, {
      state: {
        prefill: {
          bookingType,
          duration,
          withDriver,
        },
      },
    });
  };

  const mileageDisplay = formatMileage(car);
  const seatingDisplay = formatSeating(car);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            to="/cars"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Fleet Catalog
          </Link>
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <span>Rydex Fleet</span>
            <span>/</span>
            <span className="font-semibold text-slate-800">
              {car.brand} {car.model}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image Showcase */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
              <div className="relative h-72 sm:h-96 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                <img
                  src={car.image}
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-full object-cover"
                />

                {/* Top Badges (Fuel, AC, Plate) */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow">
                    {car.fuel}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow ${
                      car.ac !== false
                        ? "bg-emerald-600 text-white"
                        : "bg-amber-600 text-white"
                    }`}
                  >
                    {car.ac !== false ? "❄️ AC Vehicle" : "🌡️ Non-AC Vehicle"}
                  </span>
                  {car.registrationNumber && (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900/90 text-slate-200 border border-slate-700 shadow">
                      {car.registrationNumber}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{car.rating || 4.8}</span>
                  <span className="text-slate-400 font-normal">
                    ({car.reviewsCount || 120} trips)
                  </span>
                </div>
              </div>

              {/* Title & Overview */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {car.brand} {car.model}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Model Year {car.year || 2024} · Color: {car.color} · Reg: {car.registrationNumber || "Commercial Fleet"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-2xl font-black text-blue-600">₹{car.price}</span>
                    <span className="text-xs text-slate-500"> / 24 hours</span>
                    {car.hourlyPrice && (
                      <p className="text-xs text-slate-500">or ₹{car.hourlyPrice}/hr (min 4 hrs)</p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {car.description ||
                    `Experience exceptional driving dynamics and superior passenger comfort with the ${car.brand} ${car.model}. Maintained to the highest standards, fully sanitized before each booking, and equipped with valid Fastag.`}
                </p>

                {/* Location indicator */}
                {car.currentLocation && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-700">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Current Car Station / Location
                      </span>
                      <span className="font-semibold text-slate-800">
                        {car.currentLocation.address}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Specifications (NO transmission, NO car type) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Vehicle Specifications
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {/* 1. SEATING CAPACITY (incl. driver) */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Seating Capacity</span>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" /> {seatingDisplay}
                  </p>
                </div>

                {/* 7. AC / NON-AC */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Air Conditioning</span>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-blue-600" />
                    {car.ac !== false ? "AC Equipped" : "Non-AC"}
                  </p>
                </div>

                {/* FUEL TYPE */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Fuel / Powertrain</span>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Fuel className="w-4 h-4 text-blue-600" /> {car.fuel}
                  </p>
                </div>

                {/* 8. MILEAGE ACCORDING TO FUEL TYPE */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-1">Efficiency / Range</span>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    {mileageDisplay}
                  </p>
                </div>

                {car.engine && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">Engine</span>
                    <p className="font-semibold text-slate-800">{car.engine}</p>
                  </div>
                )}

                {car.power && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">Max Power</span>
                    <p className="font-semibold text-slate-800">{car.power}</p>
                  </div>
                )}

                {car.bootSpace && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">Boot / Luggage</span>
                    <p className="font-semibold text-slate-800">{car.bootSpace}</p>
                  </div>
                )}

                {car.fuelTank && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-1">Tank / Battery</span>
                    <p className="font-semibold text-slate-800">{car.fuelTank}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Features & In-Car Amenities */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" /> Features & In-Car Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {(car.features || []).map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{car.ac !== false ? "Air Conditioning Fitted" : "Ventilated Air Flow"}</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>FASTag Auto-Toll Installed</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>GPS Tracking Device Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary Sticky Card (1 col) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-2xl shadow-md border border-slate-200 p-6 space-y-6">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Reserve Vehicle
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Instant Rental Quote
                </h3>
              </div>

              {/* Day / Hourly Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBookingType("day")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    bookingType === "day"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Daily Rental (₹{car.price}/day)
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType("hour")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    bookingType === "hour"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Hourly Rental (₹{car.hourlyPrice || 150}/hr)
                </button>
              </div>

              {/* Duration Counter */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Rental Duration ({bookingType === "day" ? "Days" : "Hours"}):
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDuration(Math.max(1, duration - 1))}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-base font-bold text-slate-700"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-slate-900 text-sm py-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {duration} {bookingType === "day" ? "Day(s)" : "Hour(s)"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDuration(duration + 1)}
                    className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-base font-bold text-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Driver Option Toggle (clean text option, no driver icons) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Include Professional Chauffeur
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {bookingType === "day" ? "+₹800/day" : "+₹150/hr"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={withDriver}
                    onChange={(e) => setWithDriver(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Pricing breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Vehicle Rent:</span>
                  <span>₹{baseTotal}</span>
                </div>
                {withDriver && (
                  <div className="flex justify-between text-slate-600">
                    <span>Chauffeur Allowance:</span>
                    <span>₹{driverFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Security Deposit:</span>
                  <span className="text-emerald-600 font-bold">₹0 (Waived)</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Estimated Total:</span>
                  <span className="text-blue-600">₹{estimatedTotal}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToBooking}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-blue-500/20"
              >
                Proceed to Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarDetails;
