import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import cars, { getStoredCars } from "../data/cars";
import locations from "../data/locations";
import CarCard from "../components/CarCard";
import CinematicMountainRoad from "../components/CinematicMountainRoad";
import { formatMileage, formatSeating } from "../config/rentalConfig";
import {
  Search,
  Calendar,
  CalendarCheck,
  Clock,
  MapPin,
  Shield,
  Zap,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Users,
  Fuel,
  SlidersHorizontal,
  HelpCircle,
  ChevronDown,
  Star,
  Car,
  Gauge,
  Luggage,
  Settings,
  RotateCcw,
  LayoutGrid,
  ListFilter,
  Layers,
  Info,
  ExternalLink,
  Wind,
} from "lucide-react";

function Home() {
  const navigate = useNavigate();

  // Search Widget State
  const [tripType, setTripType] = useState("round"); // "round" or "hourly"
  const [selectedLocation, setSelectedLocation] = useState("HYD-MDP");
  const [pickupDate, setPickupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [pickupTime, setPickupTime] = useState("09:00");
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [returnTime, setReturnTime] = useState("18:00");

  // Dynamic Fleet state loaded from storage/default
  const [fleetCars, setFleetCars] = useState(() => getStoredCars());

  // Listen to storage events so when admin changes car prices/availability, Home updates dynamically
  useEffect(() => {
    const syncFleet = () => {
      setFleetCars(getStoredCars());
    };
    window.addEventListener("storage", syncFleet);
    return () => window.removeEventListener("storage", syncFleet);
  }, []);

  // DYNAMIC CAR SHOWCASE & CALCULATOR STATE
  const [spotlightCarId, setSpotlightCarId] = useState(1);
  const [calcDays, setCalcDays] = useState(3);
  const [withDriver, setWithDriver] = useState(false);
  const [deliveryType, setDeliveryType] = useState("hub"); // "hub" or "airport"
  const [spotlightTab, setSpotlightTab] = useState("specs"); // "specs", "comfort", "safety"

  // DYNAMIC FILTER & BROWSE STATE
  const [seatingFilter, setSeatingFilter] = useState("All"); // "All", 5, 7
  const [acFilter, setAcFilter] = useState("All"); // "All", "AC", "Non-AC"
  const [fuelFilter, setFuelFilter] = useState("All"); // "All", "Petrol", "Diesel", "EV", "Hybrid"
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular"); // "popular", "price_asc", "price_desc", "rating"
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "matrix"

  // LIVE HYDERABAD BOOKING ACTIVITY TICKER STATE
  const [tickerIndex, setTickerIndex] = useState(0);

  const liveBookings = [
    { car: "Toyota Innova Crysta", hub: "Madhapur Hub", time: "4 mins ago", trip: "3-Day Outstation to Srisailam", status: "25% Advance Confirmed" },
    { car: "Hyundai Creta SX(O)", hub: "RGIA Airport Hub", time: "16 mins ago", trip: "Contactless Airport Delivery", status: "24h Hold Active" },
    { car: "Tata Nexon EV Empowered", hub: "Gachibowli Hub", time: "28 mins ago", trip: "Local City Commute", status: "Verified & Dispatched" },
    { car: "Toyota Camry Hybrid", hub: "Jubilee Hills", time: "45 mins ago", trip: "VIP Corporate Delegation", status: "25% Advance Confirmed" },
    { car: "Tata Nexon Turbo", hub: "Hitec City Hub", time: "1 hour ago", trip: "Weekend Getaway", status: "Standard Booking" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % liveBookings.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [liveBookings.length]);

  // Current spotlight vehicle
  const currentSpotlightCar =
    fleetCars.find((c) => c.id === spotlightCarId) || fleetCars[0] || cars[0];

  // Dynamic cost calculation for current spotlight car
  const dailyRate = currentSpotlightCar?.price || 2500;
  const baseRental = dailyRate * calcDays;
  const driverCharge = withDriver ? 800 * calcDays : 0;
  const deliveryCharge = deliveryType === "airport" ? 300 : 0;
  const durationDiscount = calcDays >= 7 ? Math.round(baseRental * 0.1) : 0; // 10% discount for week+
  const totalCalculated = Math.max(0, baseRental + driverCharge + deliveryCharge - durationDiscount);
  const tokenHold10Pct = Math.ceil(totalCalculated * 0.1);

  // Filtered Fleet logic (No transmission, No car type categories)
  const filteredCars = fleetCars.filter((car) => {
    // 1. Seating Capacity (5 or 7 seater, includes driver)
    if (seatingFilter !== "All" && Number(car.seats) !== Number(seatingFilter)) {
      return false;
    }
    // 7. AC / Non-AC filter
    if (acFilter !== "All") {
      if (acFilter === "AC" && car.ac === false) return false;
      if (acFilter === "Non-AC" && car.ac !== false) return false;
    }
    // Fuel filter
    if (fuelFilter !== "All" && car.fuel !== fuelFilter) {
      return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchBrand = car.brand?.toLowerCase().includes(q);
      const matchModel = car.model?.toLowerCase().includes(q);
      const matchFuel = car.fuel?.toLowerCase().includes(q);
      if (!matchBrand && !matchModel && !matchFuel) return false;
    }
    return true;
  });

  // Sorting logic
  const sortedCars = [...filteredCars].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return (b.popularity || 0) - (a.popularity || 0);
  });

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/cars?location=${selectedLocation}`);
  };

  const filterChips = [
    { id: "all", label: "All Vehicles", count: fleetCars.length, icon: SlidersHorizontal, active: seatingFilter === "All" && acFilter === "All" && fuelFilter === "All", onClick: () => { setSeatingFilter("All"); setAcFilter("All"); setFuelFilter("All"); } },
    { id: "5seats", label: "5-Seater Fleet", desc: "incl. driver", count: fleetCars.filter((c) => Number(c.seats) === 5).length, icon: Users, active: seatingFilter === 5, onClick: () => setSeatingFilter(seatingFilter === 5 ? "All" : 5) },
    { id: "7seats", label: "7-Seater Family", desc: "incl. driver", count: fleetCars.filter((c) => Number(c.seats) === 7).length, icon: Users, active: seatingFilter === 7, onClick: () => setSeatingFilter(seatingFilter === 7 ? "All" : 7) },
    { id: "ac", label: "❄️ AC Equipped", count: fleetCars.filter((c) => c.ac !== false).length, icon: Wind, active: acFilter === "AC", onClick: () => setAcFilter(acFilter === "AC" ? "All" : "AC") },
    { id: "nonac", label: "🌡️ Non-AC Cars", count: fleetCars.filter((c) => c.ac === false).length, icon: Sparkles, active: acFilter === "Non-AC", onClick: () => setAcFilter(acFilter === "Non-AC" ? "All" : "Non-AC") },
    { id: "ev", label: "Electric / Hybrid", count: fleetCars.filter((c) => c.fuel === "EV" || c.fuel === "Hybrid").length, icon: Fuel, active: fuelFilter === "EV", onClick: () => setFuelFilter(fuelFilter === "EV" ? "All" : "EV") },
  ];

  // Action to pick a car from grid and spotlight it smoothly
  const handleSpotlightSelect = (carId) => {
    setSpotlightCarId(carId);
    const el = document.getElementById("vehicle-spotlight");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const faqs = [
    {
      q: "What documents are required to rent a car with Rydex?",
      a: "You only need a valid Indian Driving License (minimum 1 year old) and a Government ID proof (Aadhaar Card, Passport, or Voter ID). Upload or present them at pickup.",
    },
    {
      q: "Is there a security deposit required?",
      a: "No! Most of our self-drive fleet in Hyderabad is available with zero refundable security deposit after quick KYC verification.",
    },
    {
      q: "How does the advance payment and UPI verification work?",
      a: "To reserve your car, pay a 20% advance token via instant UPI QR code. Enter your transaction UTR ID, and our automated verification confirms your booking instantly in real-time. You can also choose the 'Hold for 24h' option with a 10% token.",
    },
    {
      q: "Can I get the car delivered to Rajiv Gandhi International Airport (RGIA) or my home?",
      a: "Yes! We provide contactless doorstep delivery across all Hyderabad locations including Shamshabad Airport, Madhapur, Gachibowli, Jubilee Hills, and Secunderabad.",
    },
    {
      q: "What is your fuel policy?",
      a: "We operate on a transparent Full-to-Full policy. The vehicle will be handed over to you with a full tank of fuel, and you simply return it with the same level.",
    },
  ];

  return (
    <div className="min-h-screen text-slate-900">
      {/* HERO SECTION */}
      <section className="relative text-white pt-10 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[640px]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Hyderabad's Top Rated Car Rental
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Drive Your Dream. <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                Rent With Absolute Confidence.
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
              Premium self-drive SUVs, comfortable 7-seaters, and electric vehicles across Hyderabad. 
              Zero security deposit, instant UPI verification, and free doorstep delivery.
            </p>
          </div>

          {/* BOOKING SEARCH WIDGET */}
          <div className="max-w-5xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 sm:p-7 border border-slate-200 text-slate-800">
            {/* Trip Type Selector */}
            <div className="flex items-center gap-3 mb-5 border-b border-slate-200 pb-4">
              <button
                type="button"
                onClick={() => setTripType("round")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  tripType === "round"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Daily / Outstation Rental
              </button>
              <button
                type="button"
                onClick={() => setTripType("hourly")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  tripType === "hourly"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Hourly Quick Trip
              </button>
              <span className="ml-auto text-xs text-slate-600 hidden sm:block">
                ⚡ FASTag & All-India Permit Included
              </span>
            </div>

            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Select */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Pickup Hub / Delivery
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.deliveryCharge === 0 ? "(Free Hub)" : `(+₹${loc.deliveryCharge})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pickup Date & Time */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Pickup Date & Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="col-span-2 bg-slate-50 border border-slate-300 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="time"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-1.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Return Date & Time */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> Return Date & Time
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="col-span-2 bg-slate-50 border border-slate-300 rounded-xl px-2 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="time"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-1.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition"
                >
                  <Search className="w-4 h-4" />
                  <span>Find Available Cars</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* LIVE HYDERABAD BOOKING ACTIVITY TICKER */}
      <section className="bg-slate-900 border-y border-slate-800 py-2.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold tracking-wider uppercase animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Live Activity
            </span>
            <span className="text-slate-400 text-[11px] hidden md:inline">
              Real-time Hyderabad rentals & holds:
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
            <div className="flex items-center gap-2 truncate">
              <Car className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-bold text-white truncate">
                {liveBookings[tickerIndex].car}
              </span>
              <span className="text-slate-400 text-[11px] truncate">
                · {liveBookings[tickerIndex].hub} ({liveBookings[tickerIndex].trip})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold shrink-0">
                {liveBookings[tickerIndex].status}
              </span>
              <span className="text-[10px] text-slate-500 shrink-0">
                {liveBookings[tickerIndex].time}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() =>
                  setTickerIndex(
                    (prev) => (prev - 1 + liveBookings.length) % liveBookings.length
                  )
                }
                className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
                title="Previous update"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setTickerIndex((prev) => (prev + 1) % liveBookings.length)
                }
                className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
                title="Next update"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC VEHICLE SPOTLIGHT & REAL-TIME RENTAL CALCULATOR */}
      <section id="vehicle-spotlight" className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 mb-2">
                <Sparkles className="w-3 h-3 text-blue-600" /> Interactive Dynamic Vehicle Showcase
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Inspect Specs & Calculate Exact Rental in Real-Time
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Click any vehicle below to dynamically update specs, test duration pricing, and review the 3 booking methods.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Fast Handover Available Today in Hyderabad</span>
            </div>
          </div>

          {/* Interactive Car Picker Thumbnails Slider */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300">
            {fleetCars.map((car) => {
              const isSelected = car.id === currentSpotlightCar.id;
              return (
                <button
                  key={car.id}
                  onClick={() => setSpotlightCarId(car.id)}
                  className={`shrink-0 flex items-center gap-3 p-2.5 pr-4 rounded-2xl border transition-all text-left ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/30 scale-[1.02]"
                      : "border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <img
                    src={car.image}
                    alt={car.model}
                    className="w-14 h-10 object-cover rounded-xl border border-slate-200 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900">
                        {car.brand} {car.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-bold text-blue-700">₹{car.price}/day</span>
                      <span>·</span>
                      <span>{car.fuel}</span>
                      <span>·</span>
                      <span>{formatSeating(car)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Featured Spotlight Card: Specs Inspector on Left, Dynamic Calculator on Right */}
          <div className="mt-6 bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12">
            {/* Left Col: Vehicle Media & Dynamic Specs */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
              <div>
                {/* Vehicle Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {currentSpotlightCar.type}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                        {currentSpotlightCar.year || 2024} Model
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {currentSpotlightCar.rating || 4.8} ({currentSpotlightCar.reviewsCount || 120})
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                      {currentSpotlightCar.brand} {currentSpotlightCar.model}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Starting From</span>
                    <span className="text-2xl font-black text-blue-400">
                      ₹{currentSpotlightCar.price}
                    </span>
                    <span className="text-xs text-slate-400">/day</span>
                  </div>
                </div>

                {/* Car Showcase Image with Dynamic Floating Badges */}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-t from-slate-950 to-slate-800 border border-slate-700/60 my-4 h-56 sm:h-72 group">
                  <img
                    src={currentSpotlightCar.image}
                    alt={currentSpotlightCar.model}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-70"></div>
                  
                  {/* Floating Availability Badges */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs font-semibold text-slate-200 shadow-md">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ready at Cyber Towers Hub & Airport</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 text-xs font-semibold text-emerald-300 shadow-md">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zero Deposit · Digital KYC</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Dynamic Tabs (Specs vs Comfort vs Safety) */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSpotlightTab("specs")}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      spotlightTab === "specs"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Performance & Engine
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpotlightTab("comfort")}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      spotlightTab === "comfort"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Cabin & Seating
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpotlightTab("safety")}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      spotlightTab === "safety"
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Safety & Equipment
                  </button>
                </div>

                {/* Tab 1: Performance */}
                {spotlightTab === "specs" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-blue-400" /> Engine
                      </span>
                      <p className="text-xs font-bold text-white mt-1 truncate">
                        {currentSpotlightCar.engine || "2.0L Dynamic"}
                      </p>
                    </div>

                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" /> Power
                      </span>
                      <p className="text-xs font-bold text-white mt-1">
                        {currentSpotlightCar.power || "148 bhp"}
                      </p>
                    </div>

                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Fuel className="w-3 h-3 text-emerald-400" /> Fuel & Climate
                      </span>
                      <p className="text-xs font-bold text-white mt-1">
                        {currentSpotlightCar.fuel} · {currentSpotlightCar.ac !== false ? "❄️ AC" : "🌡️ Non-AC"}
                      </p>
                    </div>

                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-purple-400" /> Fuel Economy
                      </span>
                      <p className="text-xs font-bold text-white mt-1">
                        {currentSpotlightCar.fuel === "EV"
                          ? `${currentSpotlightCar.mileage || 450} km range`
                          : `${currentSpotlightCar.mileage || 15} km/l`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Comfort */}
                {spotlightTab === "comfort" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-400" /> Seating Capacity
                      </span>
                      <p className="text-xs font-bold text-white mt-1">
                        {currentSpotlightCar.seats} Passengers
                      </p>
                    </div>

                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Luggage className="w-3 h-3 text-amber-400" /> Luggage Boot
                      </span>
                      <p className="text-xs font-bold text-white mt-1 truncate">
                        {currentSpotlightCar.bootSpace || "430 Litres"}
                      </p>
                    </div>

                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Climate Control
                      </span>
                      <p className="text-xs font-bold text-white mt-1">
                        {currentSpotlightCar.ac ? "Dual-zone Auto AC" : "Standard AC"}
                      </p>
                    </div>

                    <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-400" /> Fuel Policy
                      </span>
                      <p className="text-xs font-bold text-white mt-1">
                        {currentSpotlightCar.fuelPolicy || "Full-to-Full"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 3: Safety */}
                {spotlightTab === "safety" && (
                  <div className="flex flex-wrap gap-2">
                    {(currentSpotlightCar.features || [
                      "Airbags",
                      "ABS with EBD",
                      "Rear View Camera",
                      "GPS Navigation",
                      "Touchscreen Audio",
                      "Speed Sensing Door Locks",
                    ]).map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>{feat}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Description: {currentSpotlightCar.description?.slice(0, 95)}...</span>
                <Link
                  to={`/cars/${currentSpotlightCar.id}`}
                  className="text-blue-400 hover:text-blue-300 font-bold inline-flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Full Vehicle Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Col: Dynamic Interactive Rental Calculator */}
            <div className="lg:col-span-5 p-6 sm:p-8 bg-slate-950 flex flex-col justify-between space-y-5">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                    <span>Dynamic Rental Calculator</span>
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Live Rates
                  </span>
                </div>

                {/* Rental Duration Slider */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Rental Duration:</span>
                    <span className="font-extrabold text-blue-400 text-sm">
                      {calcDays} Day{calcDays > 1 ? "s" : ""}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="14"
                    value={calcDays}
                    onChange={(e) => setCalcDays(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {[
                      { days: 1, label: "1D" },
                      { days: 2, label: "2D" },
                      { days: 3, label: "3D (Weekend)" },
                      { days: 7, label: "7D (-10%)" },
                      { days: 10, label: "10D" },
                      { days: 14, label: "14D" },
                    ].map((preset) => (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => setCalcDays(preset.days)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex-1 text-center ${
                          calcDays === preset.days
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chauffeur Option */}
                <div className="mt-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-white">Professional Chauffeur</p>
                    <p className="text-[11px] text-slate-400">Verified driver (+₹800/day)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWithDriver(!withDriver)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      withDriver
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {withDriver ? "Driver Added (+₹800/d)" : "Self-Drive (₹0)"}
                  </button>
                </div>

                {/* Delivery Hub / Airport */}
                <div className="mt-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="font-bold text-white">Handover Location</p>
                    <p className="text-[11px] text-slate-400">
                      {deliveryType === "hub" ? "Madhapur / Cyber Towers Hub" : "RGIA Airport / Doorstep (+₹300)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("hub")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        deliveryType === "hub"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Hub (Free)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("airport")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        deliveryType === "airport"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      Airport / Doorstep
                    </button>
                  </div>
                </div>

                {/* Real-time Calculation Breakdown Box */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Rental ({calcDays} days × ₹{dailyRate}):</span>
                    <span className="font-medium text-white">₹{baseRental}</span>
                  </div>

                  {withDriver && (
                    <div className="flex justify-between text-slate-300">
                      <span>Chauffeur Fee ({calcDays} days × ₹800):</span>
                      <span className="font-medium text-white">+₹{driverCharge}</span>
                    </div>
                  )}

                  {deliveryCharge > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Doorstep / Airport Delivery:</span>
                      <span className="font-medium text-white">+₹{deliveryCharge}</span>
                    </div>
                  )}

                  {durationDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Weekly Extended Trip Discount:</span>
                      <span>-₹{durationDiscount}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">Total Trip Price:</span>
                    <span className="text-2xl font-black text-blue-400">
                      ₹{totalCalculated}
                    </span>
                  </div>
                </div>

                {/* BOOKING SPLIT PREVIEW */}
                <div className="mt-3 p-3 rounded-2xl bg-blue-950/40 border border-blue-500/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-300 flex items-center gap-1">
                      <CalendarCheck className="w-3.5 h-3.5 text-blue-400" />
                      Standard Booking (20% Instant Payment):
                    </span>
                    <span className="font-black text-white text-sm">₹{Math.ceil(totalCalculated * 0.20)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      24h Hold Lock Token (10%):
                    </span>
                    <span className="font-bold text-white">₹{tokenHold10Pct}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-blue-900/60">
                    <span>Remaining balance (80%):</span>
                    <span className="font-bold text-slate-300">₹{totalCalculated - Math.ceil(totalCalculated * 0.20)} at vehicle handover</span>
                  </div>
                </div>
              </div>

              {/* Direct Booking CTA */}
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/book/${currentSpotlightCar.id}?days=${calcDays}&withDriver=${
                      withDriver ? "1" : "0"
                    }&delivery=${deliveryType}`
                  )
                }
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition cursor-pointer text-sm"
              >
                <span>Reserve {currentSpotlightCar.brand} {currentSpotlightCar.model} (₹{totalCalculated})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC FLEET EXPLORER & LIVE FILTER BAR */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header & View Mode Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              Interactive Fleet
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Browse Available Cars in Hyderabad
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Filter by seating capacity (5 & 7-seater incl. driver), AC status, or fuel type. Click any card to book or spotlight in the calculator.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("matrix")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  viewMode === "matrix"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Specs Matrix</span>
              </button>
            </div>

            <Link
              to="/cars"
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <span>Full Catalog ({fleetCars.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Dynamic Seating & AC Filter Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mb-6">
          {filterChips.map((chip) => {
            const Icon = chip.icon;
            const isSelected = chip.active;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={chip.onClick}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/80 shadow-sm ring-1 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`p-2 rounded-xl ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-blue-200 text-blue-900 font-black"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {chip.count}
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{chip.label}</h3>
                  <p className="text-[10px] text-slate-500">
                    {chip.desc || (isSelected ? "Active Filter" : "Filter fleet →")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Secondary Filters Bar (Search, AC, Fuel, Sort) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Real-time Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search car model or brand (e.g. Creta, Innova, EV)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* 7. AC / Non-AC Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <span className="text-slate-500 font-bold px-2 text-[11px]">Climate:</span>
              {["All", "AC", "Non-AC"].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAcFilter(a)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    acFilter === a
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            {/* Fuel */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <span className="text-slate-500 font-bold px-2 text-[11px]">Fuel:</span>
              {["All", "Petrol", "Diesel", "EV"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFuelFilter(f)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    fuelFilter === f
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-slate-500 font-bold text-[11px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Reset Filters if any active */}
            {(seatingFilter !== "All" ||
              acFilter !== "All" ||
              fuelFilter !== "All" ||
              searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSeatingFilter("All");
                  setAcFilter("All");
                  setFuelFilter("All");
                  setSearchQuery("");
                }}
                className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Result Counter Strip */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
          <span>
            Showing <strong className="text-slate-900">{sortedCars.length}</strong> cars matching your criteria
          </span>
          {sortedCars.length > 0 && (
            <span className="hidden sm:inline">
              Tip: Click <strong>"Spotlight & Calculate"</strong> on any car to inspect full specs
            </span>
          )}
        </div>

        {/* VIEW MODE 1: VISUAL CARDS GRID */}
        {viewMode === "cards" && (
          <>
            {sortedCars.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <Car className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  No Cars Found with Selected Filters
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try clearing some filters or searching for a different car model.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSeatingFilter("All");
                    setAcFilter("All");
                    setFuelFilter("All");
                    setSearchQuery("");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCars.map((car) => (
                  <div key={car.id} className="relative group flex flex-col">
                    <CarCard car={car} />
                    {/* Quick Spotlight & Calculate Button */}
                    <button
                      type="button"
                      onClick={() => handleSpotlightSelect(car.id)}
                      className="mt-2 w-full py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                      <span>Spotlight & Calculate Rent ({car.brand} {car.model})</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* VIEW MODE 2: SPECS COMPARISON MATRIX */}
        {viewMode === "matrix" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-900 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Fuel & Climate</th>
                  <th className="py-3.5 px-4">Seating (incl. driver)</th>
                  <th className="py-3.5 px-4">Efficiency</th>
                  <th className="py-3.5 px-4">Boot Space</th>
                  <th className="py-3.5 px-4">Daily Rate</th>
                  <th className="py-3.5 px-4">25% Advance Token</th>
                  <th className="py-3.5 px-4 text-right">Instant Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sortedCars.map((car) => (
                  <tr key={car.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={car.image}
                          alt={car.model}
                          className="w-12 h-9 object-cover rounded-lg border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900">
                            {car.brand} {car.model}
                          </p>
                          <span className="text-[11px] text-slate-500">
                            ⭐ {car.rating || 4.8}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800">{car.fuel}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 font-bold">{car.ac !== false ? "❄️ AC" : "🌡️ Non-AC"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{formatSeating(car)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-700">{formatMileage(car)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-600">{car.bootSpace || "400 L"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-blue-600 text-sm">₹{car.price}</span>
                      <span className="text-slate-400 text-[10px] block">/day</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ₹{Math.ceil(car.price * 0.25)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSpotlightSelect(car.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition text-[11px]"
                          title="Inspect in calculator"
                        >
                          Calculate
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/book/${car.id}`)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition text-[11px] shadow-xs"
                        >
                          Book Now
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* WHY CHOOSE RYDEX */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              The Rydex Advantage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Why Hyderabad Chooses Rydex
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              We eliminated the pain points of traditional car rentals: no hidden costs, zero paperwork, and instant automated approvals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Zero Security Deposit</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enjoy your journey without locking up your hard-earned cash. Simple digital KYC verification.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Real-time UPI Payments</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pay using GPay, PhonePe, or Paytm with instant UTR verification. Flexible 20% advance or 24-hr hold.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Doorstep & RGIA Airport</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive the vehicle at your doorstep, office in Hitec City, or directly at Shamshabad Airport arrival.
              </p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">24/7 Roadside Assistance</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Flat tyre, battery jumpstart, or mechanical support anywhere on Hyderabad highways. Help is one call away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            How Rydex Car Rental Works
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            From car selection to the open road in under 3 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="relative text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              1
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Choose Vehicle</h3>
            <p className="text-xs text-slate-600">
              Browse our diverse fleet of hatchbacks, SUVs, EVs, and luxury sedans with live prices.
            </p>
          </div>

          <div className="relative text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              2
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Pickup or Delivery</h3>
            <p className="text-xs text-slate-600">
              Pick up at your preferred station or get it delivered straight to your home or airport terminal.
            </p>
          </div>

          <div className="relative text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              3
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Pay Advance Token</h3>
            <p className="text-xs text-slate-600">
              Scan UPI QR and enter UTR. Automated real-time verification instantly confirms booking.
            </p>
          </div>

          <div className="relative text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
              4
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Hit The Road</h3>
            <p className="text-xs text-slate-600">
              Inspect vehicle, unlock keys, and enjoy an unforgettable drive with unlimited memories.
            </p>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS */}
      <section className="py-16 bg-slate-100 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Customer Love
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Rated 4.8/5 by Hyderabad Drivers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                "Rented the Innova Crysta for a family weekend trip to Srisailam. The car arrived at our Gachibowli flat clean and on time with a full tank. Very smooth booking process!"
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Vikram Rao</span>
                <span className="text-slate-600">Software Architect, Hitec City</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                "The UPI instant verification is awesome. I booked a Nexon EV, scanned the QR with Google Pay, entered the UTR and boom - confirmed in seconds! The car was immaculate."
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Ananya Reddy</span>
                <span className="text-slate-600">Product Designer, Madhapur</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed mb-4">
                "Booked the Camry Hybrid for my clients visiting from Mumbai. Rydex provided a chauffeur-driven experience that was top tier. Highly recommend for corporate travel."
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Srikanth Verma</span>
                <span className="text-slate-600">Managing Director, Banjara Hills</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden transition shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-slate-800 hover:text-blue-600 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180 text-blue-600" : "text-slate-400"
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold">Ready to Start Your Journey?</h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Select from over 10+ certified premium cars available in Hyderabad today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/cars"
              className="px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 shadow-md transition"
            >
              Explore All Cars
            </Link>
            <a
              href="tel:+917981033649"
              className="px-4 py-3 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 border border-blue-500 transition"
            >
              Call Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
