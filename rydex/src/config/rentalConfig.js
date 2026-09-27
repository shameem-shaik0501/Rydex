// Rydex Global Configuration & Constants

export const PRICE_TIERS = [
  { id: "all", label: "All Prices", min: 0, max: 99999, description: "All fleet rates" },
  { id: "budget", label: "Budget", min: 0, max: 2000, description: "Under ₹2,000 / day" },
  { id: "economy", label: "Economy", min: 2000, max: 3500, description: "₹2,000 – ₹3,500 / day" },
  { id: "standard", label: "Standard", min: 3500, max: 5000, description: "₹3,500 – ₹5,000 / day" },
  { id: "premium", label: "Premium", min: 5000, max: 99999, description: "₹5,000+ / day" },
];

export const SEATING_OPTIONS = [
  { value: 5, label: "5-Seater", description: "5 Seats (incl. driver)" },
  { value: 7, label: "7-Seater", description: "7 Seats (incl. driver)" },
];

export const SORT_OPTIONS = [
  { value: "relevance", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "mileage-asc", label: "Mileage: Low to High" },
  { value: "mileage-desc", label: "Mileage: High to Low" },
];

export const PICKUP_STATUS_STEPS = [
  "Pickup Requested",
  "Pickup Confirmed",
  "Ready for Pickup",
  "Picked Up",
  "Completed",
];

export function formatMileage(car) {
  if (!car) return "";
  const fuel = (car.fuel || "").toLowerCase();
  if (fuel === "ev" || fuel === "electric") {
    return `${car.mileage || 465} km range`;
  }
  return `${car.mileage || 16} km/l`;
}

export function formatSeating(car) {
  const seats = Number(car?.seats) || 5;
  return `${seats} Seats (incl. driver)`;
}
