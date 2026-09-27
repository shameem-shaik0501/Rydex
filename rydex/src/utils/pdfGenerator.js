import { jsPDF } from "jspdf";

/**
 * Generates and triggers direct file download of an official Rydex Booking Report / Voucher
 * without launching browser print dialog.
 */
export function downloadBookingReport(orderOrBooking) {
  if (!orderOrBooking) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const b = orderOrBooking.booking || orderOrBooking;
  const customer = b.customer || {};
  const refId = orderOrBooking.paymentId || b.paymentId || "RYD-PAY-" + Date.now();
  const utrId = orderOrBooking.utrId || b.utrId || "N/A";
  const carName =
    typeof b.car === "object" && b.car
      ? `${b.car.brand || ""} ${b.car.model || ""}`.trim() || b.car.name || "Self-Drive Vehicle"
      : typeof b.car === "string" && b.car
      ? b.car
      : "Self-Drive Vehicle";
  const pickupDate = b.pickupDate || "2026-09-24";
  const pickupTime = b.pickupTime || "09:00";
  const returnDate = b.returnDate || "2026-09-26";
  const returnTime = b.returnTime || "18:00";
  const duration = b.duration || "2 Days";
  const pickupType = b.pickupType || "Self pickup";
  const hub = b.hub || "Madhapur Hub (Hitec City)";
  const deliveryAddress = b.deliveryAddress || b.deliveryLocation || hub;

  const total = Number(orderOrBooking.totalBookingAmount || b.total || 0);
  const advance = Number(orderOrBooking.amount || orderOrBooking.advanceAmount || 0);
  const balance = total > advance ? total - advance : 0;

  const way = orderOrBooking.bookingWay || b.bookingWay || "confirm_25";
  let optionName = "Confirm Booking (25% Advance)";
  if (way === "hold_24h") {
    optionName = "24 Hours Hold (10% Token)";
  } else if (way === "standard_booking") {
    optionName = "Standard Booking (20% Instant Payment)";
  }

  const isVerified = orderOrBooking.verified || orderOrBooking.status === "success";
  const statusText = isVerified
    ? "VERIFIED & CONFIRMED BY OPERATIONS DESK"
    : "SUBMITTED · PENDING MANUAL ADMIN VERIFICATION";

  // --- BRAND HEADER (Blue Header Banner) ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, "F");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("RYDEX", 14, 18);

  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(48, 11, 14, 8, 2, 2, "F");
  doc.setFontSize(9);
  doc.text("HYD", 51, 16.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Self-Drive & Chauffeur Car Rental · Hyderabad, Telangana", 14, 25);
  doc.text("Helpline: +91 79810 33649 | Email: rydexcargo@gmail.com", 14, 30);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL BOOKING REPORT", 135, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Report Date: ${new Date().toLocaleDateString("en-IN")}`, 135, 22);
  doc.text(`Ref ID: ${refId}`, 135, 27);

  // --- STATUS BADGE BANNER ---
  if (isVerified) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(52, 211, 153); // emerald-400
    doc.setTextColor(6, 95, 70); // emerald-800
  } else {
    doc.setFillColor(254, 243, 199); // amber-50
    doc.setDrawColor(245, 158, 11); // amber-500
    doc.setTextColor(146, 64, 14); // amber-800
  }
  doc.roundedRect(14, 42, 182, 10, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`STATUS: ${statusText}`, 20, 48.5);

  // --- SECTION: VEHICLE & CUSTOMER DETAILS ---
  let y = 60;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50

  // Left Box: Vehicle & Schedule
  doc.roundedRect(14, y, 88, 56, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("VEHICLE & SCHEDULE", 20, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(carName, 20, y + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Trip Type: ${pickupType}`, 20, y + 21);
  doc.text(`Pickup Date: ${pickupDate} at ${pickupTime}`, 20, y + 26);
  doc.text(`Return Date: ${returnDate} at ${returnTime}`, 20, y + 31);
  doc.text(`Trip Duration: ${duration}`, 20, y + 36);

  doc.setFont("helvetica", "bold");
  doc.text("Handover Location:", 20, y + 42);
  doc.setFont("helvetica", "normal");
  const splitLoc = doc.splitTextToSize(deliveryAddress, 76);
  doc.text(splitLoc, 20, y + 47);

  // Right Box: Customer & Driver Information
  doc.roundedRect(108, y, 88, 56, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("CUSTOMER & DRIVER DETAILS", 114, y + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(customer.name || customer.username || "Registered Customer", 114, y + 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Contact Phone: ${customer.phone || "+91 98789 98789"}`, 114, y + 21);
  doc.text(`Email Address: ${customer.email || "customer@rydex.in"}`, 114, y + 26);
  doc.text(`Driving License: ${customer.license || customer.dlNumber || "Verified at Pickup"}`, 114, y + 31);
  doc.text(`Govt Identity: Aadhaar / Passport Checked`, 114, y + 36);
  doc.text(`Security Deposit: Rs. 0 (Zero Security Deposit)`, 114, y + 42);
  doc.text(`Fuel Policy: Full-to-Full Mandatory`, 114, y + 47);

  // --- SECTION: FINANCIAL BREAKDOWN & PAYMENT LEDGER ---
  y = 124;
  doc.roundedRect(14, y, 182, 60, 3, 3, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("FINANCIAL BREAKDOWN & PAYMENT LEDGER", 20, y + 8);

  // Horizontal line
  doc.setDrawColor(203, 213, 225);
  doc.line(20, y + 12, 190, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text("Booking Method Selected:", 20, y + 19);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(optionName, 100, y + 19);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Total Rental Package (Incl. GST & Insurance):", 20, y + 25);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${total.toLocaleString("en-IN")}`, 165, y + 25, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Advance Token Paid via Instant UPI:", 20, y + 31);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`Rs. ${advance.toLocaleString("en-IN")}`, 165, y + 31, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Remaining Balance Due at Handover:", 20, y + 37);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(`Rs. ${balance.toLocaleString("en-IN")}`, 165, y + 37, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(20, y + 42, 190, y + 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Transaction / UTR Reference ID:`, 20, y + 48);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(utrId, 85, y + 48);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Booking Reference Number:`, 20, y + 54);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(refId, 85, y + 54);

  // --- SECTION: VEHICLE HANDOVER GUIDELINES ---
  y = 192;
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(14, y, 182, 42, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(30, 64, 175); // blue-800
  doc.text("MANDATORY VEHICLE HANDOVER GUIDELINES", 20, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138); // blue-900

  const guidelines = [
    "1. Present original Driving License (min. 1 year old) & Govt ID (Aadhaar/Passport) at vehicle pickup.",
    "2. Joint 360-degree vehicle walkaround inspection and odometer reading will be conducted.",
    "3. Fuel policy is strictly Full-to-Full. Vehicle will be handed over 100% full.",
    "4. FASTag toll pass is pre-installed; automated toll charges can be cleared at trip completion.",
    "5. Rydex Hyderabad Fleet Operations executive will contact you on WhatsApp prior to dispatch.",
  ];

  let gy = y + 13;
  guidelines.forEach((g) => {
    doc.text(g, 20, gy);
    gy += 4.5;
  });

  // --- FOOTER & SIGNATURE ---
  y = 242;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Rydex Fleet OperationsDesk (Hyderabad)", 14, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Cyber Towers, Hitec City, Hyderabad - 500081, Telangana, India", 14, y + 10);
  doc.text("24x7 Emergency Helpline: +91 79810 33649 | GSTIN: 36AAECR9981K1ZT", 14, y + 14);

  doc.setFont("helvetica", "bold");
  doc.text("System Authorized Document", 150, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text("No physical signature required.", 150, y + 10);
  doc.text("Valid across all Telangana Hubs.", 150, y + 14);

  // Trigger file download
  const sanitizedRef = refId.replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`Rydex_Booking_Report_${sanitizedRef}.pdf`);
}
