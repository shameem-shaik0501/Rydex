import { Link } from "react-router-dom";
import {
  Car,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Clock,
  CreditCard,
  Sparkles,
  Lock,
} from "lucide-react";

function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      {/* Trust Badges Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-xs sm:text-sm">Zero Security Deposit</h4>
              <p className="text-[11px] text-slate-400">Drive with peace of mind</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-xs sm:text-sm">100% Sanitized Fleet</h4>
              <p className="text-[11px] text-slate-400">Deep cleaned before every trip</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-xs sm:text-sm">24/7 Roadside Assist</h4>
              <p className="text-[11px] text-slate-400">Helpline across Telangana & AP</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-xs sm:text-sm">Instant UPI & FASTag</h4>
              <p className="text-[11px] text-slate-400">Pre-fitted automated toll pass</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Rydex</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hyderabad's premier self-drive and chauffeur-driven car rental platform. 
              Modern fleet, transparent pricing, verified UPI payments, and contactless doorstep delivery.
            </p>
            <div className="text-xs text-slate-400 space-y-1">
              <p className="flex items-center gap-2 text-slate-300">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>+91 79810 33649</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>rydexcargo@gmail.com</span>
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Cyber Towers, Hitec City, Hyderabad - 500081</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/home" className="hover:text-white transition">Home</Link>
              </li>
              <li>
                <Link to="/cars" className="hover:text-white transition">Explore All Cars</Link>
              </li>
              <li>
                <Link to="/my-orders" className="hover:text-white transition">My Bookings</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">About Us & Locations</Link>
              </li>
              <li>
                <Link to="/about#faq" className="hover:text-white transition">Customer Support & FAQs</Link>
              </li>
            </ul>
          </div>

          {/* Vehicle Services */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Vehicle Services</h4>
            <ul className="space-y-2 text-xs">
              <li>• Self-Drive Car Rentals</li>
              <li>• Professional Chauffeur Option</li>
              <li>• 5-Seater & 7-Seater Vehicles</li>
              <li>• AC Equipped Fleet</li>
              <li>• Contactless Doorstep Pickup</li>
              <li>• 24/7 Roadside Assistance</li>
            </ul>
          </div>

          {/* Policies & Verification */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Rental Policies</h4>
            <ul className="space-y-2 text-xs">
              <li>• Driving License (Valid 1+ yrs required)</li>
              <li>• Fuel Policy: Full-to-Full guarantee</li>
              <li>• Flexible Booking Confirmation</li>
              <li>• Unlimited Kilometers available on select cars</li>
              <li>• GST Invoice available for business rentals</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <p>© {new Date().getFullYear()} Rydex Car Rentals Hyderabad. All rights reserved.</p>
            <span className="hidden sm:inline text-slate-700">·</span>
            <Link
              to="/login?role=admin"
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 transition text-[11px] font-medium"
              title="Hyderabad Fleet Admin Login"
            >
              <Lock className="w-3 h-3 text-slate-500" /> Admin Login
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by UPI & Instant Verification</span>
            <span>·</span>
            <span>Telangana RTO Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
