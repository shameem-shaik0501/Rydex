import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getStoredCars } from "../data/cars";
import CarCard from "../components/CarCard";
import FilterSidebar from "../components/FilterSidebar";
import MobileFilters from "../components/MobileFilters";
import useFilters from "../hooks/useFilters";
import { Search, SlidersHorizontal, X, RotateCcw } from "lucide-react";

function Cars() {
  const [searchParams] = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(true);

  // Read current fleet
  const [fleetCars] = useState(() => getStoredCars());

  const { filtered, filters, setFilters, resetFilters } = useFilters(fleetCars);

  // Read URL query params on initial mount
  useEffect(() => {
    const queryParam = searchParams.get("q");
    const seatParam = searchParams.get("seats");
    const acParam = searchParams.get("ac");

    const patch = {};
    if (queryParam) patch.query = queryParam;
    if (seatParam && (seatParam === "5" || seatParam === "7")) {
      patch.seats = [Number(seatParam)];
    }
    if (acParam && (acParam === "AC" || acParam === "Non-AC")) {
      patch.ac = acParam;
    }

    if (Object.keys(patch).length > 0) {
      setFilters(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const brands = useMemo(() => {
    const set = new Set(fleetCars.map((c) => c.brand));
    return Array.from(set).sort();
  }, [fleetCars]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.seats.length) count += filters.seats.length;
    if (filters.ac !== "all") count++;
    if (filters.priceTier !== "all") count++;
    if (filters.fuelTypes.length) count += filters.fuelTypes.length;
    if (filters.brands.length) count += filters.brands.length;
    if (filters.rating > 0) count++;
    if (filters.sortBy !== "relevance") count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-950/50 backdrop-blur-xs text-slate-100 pb-20">
      {/* Top Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Fleet Catalog
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight mt-1">
              Available Cars & Live Rates
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              5-seater and 7-seater vehicles (seating includes driver). Doorstep delivery across all locations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              Showing <strong className="text-white">{filtered.length}</strong> of{" "}
              {fleetCars.length} vehicles
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Search & Filter Trigger Bar (No separate sorting dropdown - sorting is now inside Filters!) */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
                placeholder="Search by brand or model (e.g. Innova, Creta, Fortuner, Thar)..."
                value={filters.query}
                onChange={(e) => setFilters({ query: e.target.value })}
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => setFilters({ query: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Seating Shortcuts */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const has5 = filters.seats.includes(5);
                  setFilters({ seats: has5 ? [] : [5] });
                }}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition border ${
                  filters.seats.includes(5)
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                5-Seater
              </button>

              <button
                type="button"
                onClick={() => {
                  const has7 = filters.seats.includes(7);
                  setFilters({ seats: has7 ? [] : [7] });
                }}
                className={`flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition border ${
                  filters.seats.includes(7)
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                7-Seater
              </button>

              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className={`lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  activeFiltersCount > 0
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              {/* Desktop Toggle Sidebar */}
              <button
                type="button"
                onClick={() => setDesktopFiltersOpen(!desktopFiltersOpen)}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                <span>{desktopFiltersOpen ? "Hide Filters" : "Show Filters & Sort"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Filter Sidebar (includes sorting, seating, AC, price tiers) */}
          {desktopFiltersOpen && (
            <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-20">
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  resetFilters={resetFilters}
                  brands={brands}
                />
              </div>
            </div>
          )}

          {/* Cars Grid */}
          <div className={desktopFiltersOpen ? "lg:col-span-3" : "lg:col-span-4"}>
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                  🚗
                </div>
                <h3 className="text-lg font-bold text-slate-800">No Vehicles Match Your Filters</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing some filter criteria, selecting a different seating capacity, or changing the price tier.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 ${
                  desktopFiltersOpen ? "xl:grid-cols-3" : "xl:grid-cols-4"
                } gap-5`}
              >
                {filtered.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <MobileFilters
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        brands={brands}
      />
    </div>
  );
}

export default Cars;
