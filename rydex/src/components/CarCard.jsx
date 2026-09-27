import { useNavigate } from "react-router-dom";
import { formatMileage, formatSeating } from "../config/rentalConfig";
import { Users, Fuel, Sparkles, Wind, Check } from "lucide-react";

function CarCard({ car }) {
  const navigate = useNavigate();

  const fuelBadge = {
    Petrol: "bg-amber-100 text-amber-800 border-amber-200",
    Diesel: "bg-slate-100 text-slate-800 border-slate-200",
    EV: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Hybrid: "bg-cyan-100 text-cyan-800 border-cyan-200",
    CNG: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const mileageFormatted = formatMileage(car);
  const seatsFormatted = formatSeating(car);

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 overflow-hidden flex flex-col group">
      {/* IMAGE CONTAINER */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img
          src={car.image}
          alt={`${car.brand} ${car.model}`}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* FUEL BADGE & AC BADGE */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border shadow-sm ${
              fuelBadge[car.fuel] || "bg-slate-100 text-slate-800"
            }`}
          >
            {car.fuel}
          </span>

          {/* AC STATUS CLEARLY DISPLAYED */}
          <span
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border shadow-sm ${
              car.ac !== false
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {car.ac !== false ? "❄️ AC" : "🌡️ Non-AC"}
          </span>
        </div>

        {/* RATING */}
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm border border-slate-200/60">
          <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
            <span>⭐</span> {car.rating || 4.8}
          </p>
        </div>

        {/* REGISTRATION / PLATE BADGE */}
        {car.registrationNumber && (
          <div className="absolute bottom-2.5 left-3">
            <span className="bg-slate-900/85 backdrop-blur-sm text-[10px] font-mono font-bold text-slate-200 px-2 py-0.5 rounded border border-slate-700">
              {car.registrationNumber}
            </span>
          </div>
        )}
      </div>

      {/* CONTENT BODY */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* VEHICLE TITLE */}
          <div className="mb-3">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              {car.brand} {car.model}
            </h3>
            <p className="text-[11px] text-slate-400">
              Model {car.year || 2024} · Cleaned & Sanitized
            </p>
          </div>

          {/* KEY SPECS GRID (Seating, Mileage, AC) */}
          <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-slate-100 my-2 text-xs">
            {/* 1. SEATING CAPACITY (incl. driver) */}
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <Users className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block -mb-0.5">Capacity</span>
                <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                  {seatsFormatted}
                </span>
              </div>
            </div>

            {/* 8. MILEAGE ACCORDING TO CAR / FUEL TYPE */}
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block -mb-0.5">Efficiency</span>
                <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                  {mileageFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* FEATURES CHIPS */}
          <div className="flex flex-wrap gap-1 my-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Fastag Fitted
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Zero Deposit
            </span>
            {car.driverOptions?.includes("With driver") && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                Chauffeur Option
              </span>
            )}
          </div>
        </div>

        {/* PRICING & CALL TO ACTION */}
        <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-blue-600">₹{car.price}</span>
              <span className="text-[11px] text-slate-400">/ 24 hrs</span>
            </div>
            {car.hourlyPrice && (
              <p className="text-[10px] text-slate-400">or ₹{car.hourlyPrice}/hr</p>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(`/cars/${car.id}`)}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => navigate(`/book/${car.id}`)}
              className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarCard;
