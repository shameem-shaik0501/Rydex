import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Splash from "./pages/Splash";
import Home from "./pages/Home";
import Cars from "./pages/Cars";
import CarDetails from "./pages/CarDetails";
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import BookingSuccess from "./pages/BookingSuccess";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MyOrders from "./pages/MyOrders";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CinematicMountainRoad from "./components/CinematicMountainRoad";
import mongoApi from "./services/mongoApi";
import { getStoredCars } from "./data/cars";
import { getStoredLocations } from "./data/locations";

function App() {
  const location = useLocation();
  const isSplash = location.pathname === "/";
  const isMyBookings = location.pathname === "/my-orders";
  const isHome = location.pathname === "/home";

  // Background MongoDB initial synchronization
  useEffect(() => {
    async function syncMongo() {
      try {
        const status = await mongoApi.checkStatus();
        if (status && status.status === "connected") {
          // If cars or locations in MongoDB are empty, seed initial data
          if (status.counts?.cars === 0) {
            const initialCarsList = getStoredCars();
            await mongoApi.syncCars(initialCarsList);
          } else {
            await mongoApi.getCars();
          }

          if (status.counts?.locations === 0) {
            const initialLocs = getStoredLocations();
            await mongoApi.syncLocations(initialLocs);
          } else {
            await mongoApi.getLocations();
          }

          // Initial orders pull
          await mongoApi.getOrders();
        }
      } catch (err) {
        console.warn("MongoDB initial sync error:", err);
      }
    }
    syncMongo();
  }, []);

  return (
    <div className="flex flex-col min-h-screen text-slate-100 font-sans antialiased relative selection:bg-blue-500 selection:text-white bg-slate-950">
      {/* Global Dynamic Cinematic Video Background running across ALL pages EXCEPT My Bookings */}
      {!isMyBookings && (
        <CinematicMountainRoad
          className="fixed inset-0 w-full h-full z-0 pointer-events-none"
          showControls={isHome}
          overlayOpacity={isSplash ? 0.28 : isHome ? 0.2 : 0.42}
        />
      )}

      {/* Show Navbar on all views except Splash screen */}
      {!isSplash && <Navbar />}

      <main className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/home" element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route path="/book/:id" element={<Booking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/support" element={<About />} />
        </Routes>
      </main>

      {/* Show Footer on all views except Splash screen */}
      {!isSplash && <Footer />}
    </div>
  );
}

export default App;
