import { useState } from "react";
import {
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Clock,
  Sparkles,
  CheckCircle2,
  Car,
  Award,
  Users,
} from "lucide-react";

function About() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Booking Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Booking Inquiry",
        message: "",
      });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950/40 text-slate-100 pb-20">
      {/* Hero Banner */}
      <section className="bg-transparent text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Hyderabad's Premier Mobility Platform
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Redefining Self-Drive & Chauffeur Travel
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Founded with a passion for driving freedom, Rydex provides high quality, 
            sanitized, and fully insured vehicles across Hyderabad with zero security deposit.
          </p>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="bg-slate-900/85 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/60 p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-blue-400">10,000+</p>
            <p className="text-xs text-slate-400 mt-1 font-semibold">Completed Trips</p>
          </div>
          <div>
            <p className="text-3xl font-black text-emerald-600">4.8 / 5</p>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Average Driver Rating</p>
          </div>
          <div>
            <p className="text-3xl font-black text-purple-600">5 & 7-Seater</p>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Premium Fleet Options</p>
          </div>
          <div>
            <p className="text-3xl font-black text-amber-600">100%</p>
            <p className="text-xs text-slate-500 mt-1 font-semibold">Verified Instant Confirm</p>
          </div>
        </div>
      </section>

      {/* Contact & Support Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden grid grid-cols-1 lg:grid-cols-5 text-white">
          {/* Contact Details (2 cols) */}
          <div className="lg:col-span-2 bg-slate-950/80 text-white p-8 flex flex-col justify-between space-y-8 border-b lg:border-b-0 lg:border-r border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Get in Touch
              </span>
              <h3 className="text-2xl font-extrabold mt-1">We're Here 24/7</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Have questions regarding wedding fleets, outstation trips to Goa/Tirupati/Vijayawada, or corporate long-term rentals? Contact our Hyderabad operations team.
              </p>

              <div className="mt-8 space-y-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Toll-Free & WhatsApp</span>
                    <span className="font-semibold text-slate-200">+91 79810 33649</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Official Support Email</span>
                    <span className="font-semibold text-slate-200">rydexcargo@gmail.com</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Operating Hours</span>
                    <span className="font-semibold text-slate-200">24 Hours / 7 Days a Week</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-xs text-slate-300">
              <span className="font-bold text-white block mb-0.5">Corporate Headquarters:</span>
              Cyber Towers, Hitec City Phase 2, Madhapur, Hyderabad, Telangana 500081
            </div>
          </div>

          {/* Contact Message Form (3 cols) */}
          <div className="lg:col-span-3 p-8 bg-slate-900/60 text-slate-100">
            <h3 className="text-xl font-bold text-white mb-2">Send Us a Message</h3>
            <p className="text-xs text-slate-400 mb-6">
              Fill out the form below and an operations manager will respond within 15 minutes.
            </p>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base">Message Sent Successfully!</h4>
                <p className="text-xs">
                  Thank you for reaching out. A Rydex representative will get in touch shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Your Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Varma"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="yourname@gmail.com"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="Booking Inquiry">Booking Inquiry</option>
                      <option value="Long Term / Monthly Rental">Long Term / Monthly Rental</option>
                      <option value="Corporate Fleet Tie-up">Corporate Fleet Tie-up</option>
                      <option value="Payment / Refund Support">Payment / Refund Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Message *</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your requirements, dates, or questions..."
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 text-xs"
                >
                  Send Inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
