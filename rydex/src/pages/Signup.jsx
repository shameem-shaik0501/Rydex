import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { User, ShieldCheck, Sparkles, ArrowRight, Upload, Phone, CheckCircle2, AlertCircle } from "lucide-react";
import mongoApi from "../services/mongoApi";

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  const [draftBooking] = useState(() => {
    if (location.state?.booking) return location.state.booking;
    try {
      const raw = localStorage.getItem("current_draft_booking");
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [role, setRole] = useState("customer"); // "customer" or "driver"
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    password: "",
    confirmPassword: "",
    address: "",
    aadhaarNumber: "",
    drivingLicenseNumber: "",
  });

  const [profilePhoto, setProfilePhoto] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setError("Profile image must be smaller than 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.username.trim()) {
      setError("Please enter your desired username.");
      return;
    }

    if (!formData.email.trim() || !validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!formData.mobileNumber.trim() || !validateMobile(formData.mobileNumber)) {
      setError("Please enter a valid 10-digit primary mobile number.");
      return;
    }

    // Alternate number validation
    if (formData.alternateMobileNumber.trim()) {
      if (!validateMobile(formData.alternateMobileNumber.trim())) {
        setError("Alternate mobile number must be a valid 10-digit number.");
        return;
      }
      if (formData.alternateMobileNumber.trim() === formData.mobileNumber.trim()) {
        setError("Alternate mobile number must be different from primary number.");
        return;
      }
    }

    // Role specific validation for Drivers (Requirement 10)
    if (role === "driver") {
      if (!formData.address.trim()) {
        setError("Driver registration requires a residential address.");
        return;
      }

      const cleanAadhaar = formData.aadhaarNumber.replace(/\s|-/g, "");
      if (cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
        setError("Please enter a valid 12-digit Aadhaar number.");
        return;
      }

      if (!formData.drivingLicenseNumber.trim() || formData.drivingLicenseNumber.trim().length < 8) {
        setError("Please enter a valid Driving License number.");
        return;
      }

      if (!profilePhoto) {
        setError("Driver registration requires a profile photo for verification.");
        return;
      }
    }

    if (!formData.password.trim() || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const newUser = {
        username: formData.username.trim(),
        name: formData.name.trim() || formData.username.trim(),
        email: formData.email.trim(),
        mobileNumber: formData.mobileNumber.trim(),
        alternateMobileNumber: formData.alternateMobileNumber.trim() || "",
        profilePhoto: profilePhoto || "",
        password: formData.password.trim(),
        role: role, // "customer" or "driver"
        address: formData.address.trim() || "",
        aadhaarNumber: formData.aadhaarNumber.trim() || "",
        drivingLicenseNumber: formData.drivingLicenseNumber.trim() || "",
        verified: true,
        status: role === "driver" ? "Pending Approval" : "Active",
        createdAt: new Date().toISOString(),
      };

      // Save user session
      localStorage.setItem("user", JSON.stringify(newUser));

      // Append to registered_customers list
      try {
        const raw = localStorage.getItem("registered_customers");
        const list = raw ? JSON.parse(raw) : [];
        const filtered = list.filter((u) => u.username !== newUser.username);
        filtered.push(newUser);
        localStorage.setItem("registered_customers", JSON.stringify(filtered));
      } catch (err) {
        console.error(err);
      }

      // Persist to MongoDB
      mongoApi.registerUser(newUser);

      window.dispatchEvent(new Event("storage"));

      // Check for saved car draft
      let activeDraft = draftBooking;
      if (!activeDraft) {
        try {
          const rawDraft = localStorage.getItem("current_draft_booking");
          if (rawDraft) activeDraft = JSON.parse(rawDraft);
        } catch (err) {
          console.error(err);
        }
      }

      if (activeDraft && role === "customer") {
        const updatedDraft = {
          ...activeDraft,
          customer: {
            ...(activeDraft.customer || {}),
            name: newUser.name,
            phone: newUser.mobileNumber,
            email: newUser.email,
          },
        };
        try {
          localStorage.setItem("current_draft_booking", JSON.stringify(updatedDraft));
        } catch (err) {
          console.error(err);
        }
        navigate("/payment", { state: { booking: updatedDraft } });
        return;
      }

      setSuccess("Registration completed successfully! Redirecting...");
      setTimeout(() => {
        if (role === "driver") {
          navigate("/my-orders");
        } else {
          navigate("/cars");
        }
      }, 1000);
    } catch (err) {
      setError("Registration error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <User className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Rydex Account
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-600">
          Fast registration for self-drive car rentals
        </p>

        {/* Role Toggle (Customer vs Driver) */}
        <div className="mt-6 flex p-1 bg-slate-200/80 rounded-2xl">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              role === "customer"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Customer Registration
          </button>
          <button
            type="button"
            onClick={() => setRole("driver")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
              role === "driver"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Driver Registration
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignup}>
            {/* 5. Profile Photo Upload */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-800 block">
                  Profile Photo {role === "driver" && <span className="text-red-500">*</span>}
                </label>
                <span className="text-[11px] text-slate-500 block mb-1.5">
                  Upload a clear avatar or document photo
                </span>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Username & Full Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                  placeholder="e.g. rahul_kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                  placeholder="As per Government ID"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                placeholder="name@example.com"
              />
            </div>

            {/* 1. Primary Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Primary Mobile Number *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  name="mobileNumber"
                  required
                  maxLength={10}
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>

            {/* 4. Alternate Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Alternate Mobile Number (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  name="alternateMobileNumber"
                  maxLength={10}
                  value={formData.alternateMobileNumber}
                  onChange={handleChange}
                  className="w-full pl-11 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:bg-white outline-none"
                  placeholder="Emergency / family mobile"
                />
              </div>
            </div>

            {/* 10. DRIVER REGISTRATION SPECIFIC FIELDS */}
            {role === "driver" && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 pt-3">
                <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider block">
                  Driver Credential Details
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Current Residential Address *
                  </label>
                  <textarea
                    rows={2}
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="House/Flat No, Landmark, City, Pincode"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Aadhaar Number *
                    </label>
                    <input
                      type="text"
                      name="aadhaarNumber"
                      required
                      maxLength={14}
                      value={formData.aadhaarNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="12-digit Aadhaar"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Driving License (DL) *
                    </label>
                    <input
                      type="text"
                      name="drivingLicenseNumber"
                      required
                      value={formData.drivingLicenseNumber}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs uppercase font-mono outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="e.g. TS09 20210084321"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  placeholder="Min 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              <span>{role === "driver" ? "Submit Driver Application" : "Complete Registration"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
