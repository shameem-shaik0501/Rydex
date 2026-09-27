export function calculateBookingPrice({
  pricePerDay,
  days,
  withDriver,
  driverChargePerDay = 500,
  deliveryCharge,
}) {
  const basePrice = pricePerDay * days;
  const driverPrice = withDriver ? driverChargePerDay * days : 0;

  return {
    basePrice,
    driverPrice,
    deliveryCharge,
    total: basePrice + driverPrice + deliveryCharge,
  };
}
