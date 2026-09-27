import { useState } from "react";
import { PRICE_TIERS, SORT_OPTIONS, SEATING_OPTIONS } from "../config/rentalConfig";
import { ArrowUpDown, Users, Wind, DollarSign, Fuel, Building2, Star } from "lucide-react";

const FilterSidebar = ({ filters, setFilters, resetFilters, brands = [] }) => {
  const [expanded, setExpanded] = useState({
    sort: true,
    seats: true,
    ac: true,
    price: true,
    fuel: true,
    brand: false,
    rating: false,
  });

  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const FilterSection = ({ title, icon, section, children }) => (
    <div className="mb-4 pb-3 border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full flex items-center justify-between py-2 text-left hover:opacity-80 transition"
      >
        <h4 className="font-semibold text-gray-800 text-xs sm:text-sm flex items-center gap-2">
          <span className="text-blue-600">{icon}</span> {title}
        </h4>
        <span className="text-gray-400 font-bold text-sm">
          {expanded[section] ? "−" : "+"}
        </span>
      </button>
      {expanded[section] && <div className="mt-2.5 ml-1">{children}</div>}
    </div>
  );

  const activeFilters = [];
  if (filters.query) {
    activeFilters.push({
      key: "query",
      label: `Search: "${filters.query}"`,
      clear: () => setFilters({ query: "" }),
    });
  }
  if (filters.sortBy && filters.sortBy !== "relevance") {
    const sOption = SORT_OPTIONS.find((s) => s.value === filters.sortBy);
    activeFilters.push({
      key: "sortBy",
      label: `Sort: ${sOption?.label || filters.sortBy}`,
      clear: () => setFilters({ sortBy: "relevance" }),
    });
  }
  if (filters.seats.length > 0) {
    filters.seats.forEach((seat) => {
      activeFilters.push({
        key: "seats",
        label: `${seat} Seats (incl. driver)`,
        clear: () => setFilters({ seats: filters.seats.filter((s) => s !== seat) }),
      });
    });
  }
  if (filters.ac !== "all") {
    activeFilters.push({
      key: "ac",
      label: filters.ac,
      clear: () => setFilters({ ac: "all" }),
    });
  }
  if (filters.priceTier && filters.priceTier !== "all") {
    const pTier = PRICE_TIERS.find((p) => p.id === filters.priceTier);
    activeFilters.push({
      key: "priceTier",
      label: pTier?.label || filters.priceTier,
      clear: () => setFilters({ priceTier: "all" }),
    });
  }
  if (filters.fuelTypes.length > 0) {
    filters.fuelTypes.forEach((f) => {
      activeFilters.push({
        key: "fuelTypes",
        label: f,
        clear: () =>
          setFilters({
            fuelTypes: filters.fuelTypes.filter((x) => x !== f),
          }),
      });
    });
  }
  if (filters.brands.length > 0) {
    filters.brands.forEach((b) => {
      activeFilters.push({
        key: "brands",
        label: b,
        clear: () =>
          setFilters({
            brands: filters.brands.filter((x) => x !== b),
          }),
      });
    });
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 max-h-[calc(100vh-90px)] overflow-y-auto">
      {/* Search Filter */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by brand or model..."
          value={filters.query}
          onChange={(e) => setFilters({ query: e.target.value })}
          className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
        />
      </div>

      {/* Active Badges */}
      {activeFilters.length > 0 && (
        <div className="mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Active Filters ({activeFilters.length})
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-red-600 font-semibold hover:underline"
            >
              Reset All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((af, i) => (
              <button
                key={i}
                type="button"
                onClick={af.clear}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition"
              >
                <span>{af.label}</span>
                <span className="font-bold text-xs">×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. SORTING OPTIONS (Moved inside Filters section) */}
      <FilterSection title="Sort Cars" icon={<ArrowUpDown className="w-4 h-4" />} section="sort">
        <div className="space-y-1.5">
          {SORT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition border ${
                filters.sortBy === opt.value
                  ? "bg-blue-50 border-blue-500 text-blue-800 font-bold"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="sortBy"
                  checked={filters.sortBy === opt.value}
                  onChange={() => setFilters({ sortBy: opt.value })}
                  className="accent-blue-600 cursor-pointer"
                />
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* 1. SEATING CAPACITY (5-seater & 7-seater cars, includes driver) */}
      <FilterSection
        title="Seating Capacity (incl. driver)"
        icon={<Users className="w-4 h-4" />}
        section="seats"
      >
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
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  isChecked
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-slate-50"
                }`}
              >
                <span className="font-extrabold text-sm">{opt.label}</span>
                <span className={`text-[10px] mt-0.5 ${isChecked ? "text-blue-100" : "text-slate-400"}`}>
                  Includes driver
                </span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* 7. AC / NON-AC FILTER */}
      <FilterSection title="Air Conditioning (AC / Non-AC)" icon={<Wind className="w-4 h-4" />} section="ac">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: "all", label: "All" },
            { id: "AC", label: "❄️ AC" },
            { id: "Non-AC", label: "🌡️ Non-AC" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilters({ ac: item.id })}
              className={`py-2 px-2 rounded-xl text-xs font-semibold transition border text-center ${
                filters.ac === item.id
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* 4. PRICE RANGE NAMES (Budget, Economy, Standard, Premium) */}
      <FilterSection title="Price Category" icon={<DollarSign className="w-4 h-4" />} section="price">
        <div className="space-y-1.5">
          {PRICE_TIERS.map((tier) => (
            <label
              key={tier.id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer border transition ${
                filters.priceTier === tier.id
                  ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priceTier"
                  checked={filters.priceTier === tier.id}
                  onChange={() => setFilters({ priceTier: tier.id })}
                  className="accent-emerald-600 cursor-pointer"
                />
                <span className="font-semibold">{tier.label}</span>
              </div>
              <span className="text-[10px] text-slate-400">{tier.description}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* FUEL TYPE */}
      <FilterSection title="Fuel / Powertrain" icon={<Fuel className="w-4 h-4" />} section="fuel">
        <div className="grid grid-cols-2 gap-2">
          {["Petrol", "Diesel", "EV", "Hybrid"].map((fuel) => {
            const isChecked = filters.fuelTypes.includes(fuel);
            return (
              <label
                key={fuel}
                className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                  isChecked
                    ? "bg-blue-50 border-blue-500 text-blue-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
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
                  className="accent-blue-600 cursor-pointer"
                />
                <span>{fuel}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* BRAND */}
      <FilterSection title="Manufacturer / Brand" icon={<Building2 className="w-4 h-4" />} section="brand">
        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
          {brands.map((brand) => {
            const isChecked = filters.brands.includes(brand);
            return (
              <label
                key={brand}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                  isChecked
                    ? "bg-blue-50 border-blue-400 text-blue-900 font-bold"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters({ brands: [...filters.brands, brand] });
                    } else {
                      setFilters({ brands: filters.brands.filter((b) => b !== brand) });
                    }
                  }}
                  className="accent-blue-600 cursor-pointer"
                />
                <span>{brand}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* RATING */}
      <FilterSection title="Minimum Rating" icon={<Star className="w-4 h-4" />} section="rating">
        <div className="flex gap-2">
          {[0, 4.5, 4.8].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilters({ rating: r })}
              className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold transition ${
                filters.rating === r
                  ? "bg-amber-50 border-amber-400 text-amber-900 font-bold"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {r === 0 ? "Any" : `⭐ ${r}+`}
            </button>
          ))}
        </div>
      </FilterSection>
    </div>
  );
};

export default FilterSidebar;
