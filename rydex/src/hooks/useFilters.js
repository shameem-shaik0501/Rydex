import { useMemo, useState } from "react";
import { PRICE_TIERS } from "../config/rentalConfig";

export function defaultFilterState() {
  return {
    query: "",
    priceTier: "all", // "all", "budget", "economy", "standard", "premium"
    priceRange: { min: 0, max: 99999 },
    seats: [], // [5], [7], or [5, 7]
    ac: "all", // "all", "AC", "Non-AC"
    fuelTypes: [], // ["Petrol", "Diesel", "EV", "Hybrid"]
    brands: [],
    rating: 0,
    sortBy: "relevance", // "relevance", "price-asc", "price-desc", "mileage-asc", "mileage-desc"
  };
}

export default function useFilters(cars, initialState = {}) {
  const [filters, setFilters] = useState(() => ({
    ...defaultFilterState(),
    ...initialState,
  }));

  const filtered = useMemo(() => {
    if (!cars) return [];

    const result = cars
      .filter((car) => {
        // Search query (name/brand/model)
        if (filters.query) {
          const q = filters.query.toLowerCase().trim();
          const brandMatch = car.brand?.toLowerCase().includes(q);
          const modelMatch = car.model?.toLowerCase().includes(q);
          if (!brandMatch && !modelMatch) return false;
        }

        // Seating Capacity (5-seater or 7-seater, includes driver)
        if (filters.seats.length > 0) {
          const carSeats = Number(car.seats);
          if (!filters.seats.includes(carSeats)) return false;
        }

        // AC / Non-AC filter
        if (filters.ac !== "all") {
          if (filters.ac === "AC" && car.ac === false) return false;
          if (filters.ac === "Non-AC" && car.ac !== false) return false;
        }

        // Price Tier (Configurable Price Range Names)
        if (filters.priceTier && filters.priceTier !== "all") {
          const tier = PRICE_TIERS.find((t) => t.id === filters.priceTier);
          if (tier) {
            if (car.price < tier.min || car.price > tier.max) return false;
          }
        } else if (filters.priceRange) {
          if (
            car.price < filters.priceRange.min ||
            car.price > filters.priceRange.max
          ) {
            return false;
          }
        }

        // Fuel Type
        if (filters.fuelTypes.length > 0) {
          const carFuel = (car.fuel || "").toLowerCase();
          const matchesFuel = filters.fuelTypes.some(
            (f) => f.toLowerCase() === carFuel || (f === "Electric" && carFuel === "ev")
          );
          if (!matchesFuel) return false;
        }

        // Brands
        if (filters.brands.length > 0) {
          if (!filters.brands.includes(car.brand)) return false;
        }

        // Rating
        if (filters.rating > 0) {
          if ((car.rating || 0) < filters.rating) return false;
        }

        return true;
      })
      .slice();

    // Sorting (inside Filters)
    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "mileage-asc":
        result.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
        break;
      case "mileage-desc":
        result.sort((a, b) => (b.mileage || 0) - (a.mileage || 0));
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "relevance":
      default:
        result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
    }

    return result;
  }, [cars, filters]);

  const set = (patch) => setFilters((s) => ({ ...s, ...patch }));
  const reset = () => setFilters(defaultFilterState());

  return { filters, setFilters: set, resetFilters: reset, filtered };
}
