import { PRICE_TIERS, SORT_OPTIONS, SEATING_OPTIONS } from "../config/rentalConfig";
import { X, ArrowUpDown, Users, Wind, DollarSign, Fuel, Building2 } from "lucide-react";

export default function MobileFilters({
  open,
  onClose,
  filters,
  setFilters,
  resetFilters,
  brands = [],
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Filters & Sorting</h3>
            <p className="text-xs text-slate-500">Refine available cars</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-red-600 font-bold hover:underline px-2 py-1"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3. SORTING OPTIONS */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" /> Sort Vehicles
          </h4>
          <div className="space-y-1.5">
            {SORT_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border ${
                  filters.sortBy === opt.value
                    ? "bg-blue-50 border-blue-500 text-blue-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <span>{opt.label}</span>
                <input
                  type="radio"
                  name="m_sortBy"
                  checked={filters.sortBy === opt.value}
                  onChange={() => setFilters({ sortBy: opt.value })}
                  className="accent-blue-600"
                />
              </label>
            ))}
          </div>
        </div>

        {/* 1. SEATING CAPACITY (5-seater & 7-seater cars, includes driver) */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" /> Seating Capacity (incl. driver)
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {SEATING_OPTIONS.map((opt) => {
              const isChecked = filters.seats.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (isChecked) {
                      setFilters({ seats: filters.seats.filter((s) => s !== opt.value) });
                    } else {
                      setFilters({ seats: [...filters.seats, opt.value] });
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl border text-center transition ${
                    isChecked
                      ? "bg-blue-600 border-blue-600 text-white font-bold"
                      : "bg-white border-slate-200 text-slate-700 font-medium"
                  }`}
                >
                  <p className="text-sm font-extrabold">{opt.label}</p>
                  <p className={`text-[10px] ${isChecked ? "text-blue-100" : "text-slate-400"}`}>
                    Includes driver
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 7. AC / NON-AC FILTER */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-blue-600" /> Air Conditioning (AC)
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "all", label: "All" },
              { id: "AC", label: "❄️ AC" },
              { id: "Non-AC", label: "🌡️ Non-AC" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilters({ ac: item.id })}
                className={`py-2 rounded-xl text-xs font-bold border text-center ${
                  filters.ac === item.id
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. PRICE RANGE NAMES */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" /> Price Tier
          </h4>
          <div className="space-y-1.5">
            {PRICE_TIERS.map((tier) => (
              <label
                key={tier.id}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs border ${
                  filters.priceTier === tier.id
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <div>
                  <span className="font-semibold block">{tier.label}</span>
                  <span className="text-[10px] text-slate-400">{tier.description}</span>
                </div>
                <input
                  type="radio"
                  name="m_priceTier"
                  checked={filters.priceTier === tier.id}
                  onChange={() => setFilters({ priceTier: tier.id })}
                  className="accent-emerald-600"
                />
              </label>
            ))}
          </div>
        </div>

        {/* FUEL */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-blue-600" /> Fuel
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {["Petrol", "Diesel", "EV", "Hybrid"].map((fuel) => {
              const isChecked = filters.fuelTypes.includes(fuel);
              return (
                <label
                  key={fuel}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs ${
                    isChecked
                      ? "bg-blue-50 border-blue-500 text-blue-900 font-bold"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFilters({ fuelTypes: [...filters.fuelTypes, fuel] });
                      } else {
                        setFilters({ fuelTypes: filters.fuelTypes.filter((f) => f !== fuel) });
                      }
                    }}
                    className="accent-blue-600"
                  />
                  <span>{fuel}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* BRAND */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" /> Brands
          </h4>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {brands.map((brand) => {
              const isChecked = filters.brands.includes(brand);
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => {
                    if (isChecked) {
                      setFilters({ brands: filters.brands.filter((b) => b !== brand) });
                    } else {
                      setFilters({ brands: [...filters.brands, brand] });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium ${
                    isChecked
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md"
        >
          View Filtered Cars
        </button>
      </div>
    </div>
  );
}
