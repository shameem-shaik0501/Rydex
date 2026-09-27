import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStoredCars, saveStoredCars } from "../data/cars";
import mongoApi from "../services/mongoApi";
import { PICKUP_STATUS_STEPS, formatMileage, formatSeating } from "../config/rentalConfig";
import { exportAdminHistoryToExcel, exportSingleOrderDossier } from "../utils/excelExporter";
import { downloadBookingReport } from "../utils/pdfGenerator";
import {
  CheckCircle2,
  Clock,
  Car,
  Users,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  PhoneCall,
  MessageSquare,
  Zap,
  CalendarCheck,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
  KeyRound,
  Lock,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
  X,
  Navigation,
  Search,
  Filter,
  FileText,
  UserCheck,
  BadgeCheck,
  Smartphone,
  Truck,
  FileSpreadsheet,
  FileDown,
  Download,
} from "lucide-react";

function makeAuditLogPayload({
  orderId,
  customerName,
  customerPhone,
  carModel,
  carRegistration,
  actionType,
  previousStatus,
  newStatus,
  adminUser = "Admin (Chief Operations)",
  notes,
}) {
  return {
    logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
    orderId: orderId || "GENERAL",
    customerName: customerName || "Customer",
    customerPhone: customerPhone || "N/A",
    carModel: carModel || "Rydex Fleet",
    carRegistration: carRegistration || "TS 09 EZ 4082",
    actionType,
    previousStatus: previousStatus || "Pending",
    newStatus: newStatus || "Updated",
    adminUser,
    notes: notes || "Administrative action executed and recorded in master ledger.",
  };
}

function AdminDashboard() {
  // Authentication gate state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return (
      sessionStorage.getItem("rydex_admin_auth") === "true" ||
      localStorage.getItem("rydex_admin_auth") === "true"
    );
  });
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("submissions"); // "submissions", "all_orders", "history", "customers", "drivers", "fleet"
  const [submissionFilter, setSubmissionFilter] = useState("all"); // "all", "confirm_25", "hold_24h", "standard_booking"
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "pending", "verified", "rejected"
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [copiedUtr, setCopiedUtr] = useState("");

  // Audit Logs & History State (Requirement: Admin Approval Power & History Excel)
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const cached = localStorage.getItem("admin_audit_logs");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("all");

  // Admin Operational Power: Pull Up Operations Command Center Modal
  const [selectedOperationOrder, setSelectedOperationOrder] = useState(null);
  const [operationDriverSelection, setOperationDriverSelection] = useState("");
  const [operationCarSelection, setOperationCarSelection] = useState("");
  const [operationNote, setOperationNote] = useState("");

  // User Accounts State (Requirement 12)
  const [usersList, setUsersList] = useState(() => {
    try {
      const cached = localStorage.getItem("registered_customers");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [selectedCustomerDossier, setSelectedCustomerDossier] = useState(null);
  const [selectedDriverDossier, setSelectedDriverDossier] = useState(null);

  // In-page rejection modal state (avoiding window.prompt)
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectionReasonText, setRejectionReasonText] = useState("");

  // Helper to filter out synthetic demo records
  const cleanRealOrders = (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter(
      (o) =>
        o &&
        o.booking?.customer?.name !== "Suresh Reddy" &&
        !o.isDemo
    );
  };

  // Load orders from localStorage with real-time sync (cleans out mock demo data)
  const [orders, setOrders] = useState(() => {
    try {
      const all = localStorage.getItem("all_orders");
      if (all) {
        const parsed = JSON.parse(all);
        if (Array.isArray(parsed)) return cleanRealOrders(parsed);
      }
      const single = localStorage.getItem("paymentData");
      if (single) {
        const parsed = JSON.parse(single);
        const cleaned = cleanRealOrders([parsed]);
        return cleaned;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Fleet state
  const [fleet, setFleet] = useState(() => getStoredCars());

  // Sync orders and users in real-time across tabs/windows or when user submits a booking
  useEffect(() => {
    const refreshData = async () => {
      try {
        const remote = await mongoApi.getOrders();
        if (Array.isArray(remote) && remote.length > 0) {
          setOrders(cleanRealOrders(remote));
        } else {
          const all = localStorage.getItem("all_orders");
          if (all) {
            const parsed = JSON.parse(all);
            if (Array.isArray(parsed)) {
              setOrders(cleanRealOrders(parsed));
            }
          }
        }

        const remoteUsers = await mongoApi.getAdminUsers();
        if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
          setUsersList(remoteUsers);
        } else {
          const cached = localStorage.getItem("registered_customers");
          if (cached) setUsersList(JSON.parse(cached));
        }

        const remoteLogs = await mongoApi.getAuditLogs();
        if (Array.isArray(remoteLogs) && remoteLogs.length > 0) {
          setAuditLogs(remoteLogs);
          localStorage.setItem("admin_audit_logs", JSON.stringify(remoteLogs));
        } else {
          const cachedLogs = localStorage.getItem("admin_audit_logs");
          if (cachedLogs) setAuditLogs(JSON.parse(cachedLogs));
        }
      } catch (e) {
        console.error(e);
      }
    };

    refreshData();
    window.addEventListener("storage", refreshData);
    window.addEventListener("rydex_order_update", refreshData);
    const interval = setInterval(refreshData, 3000);

    return () => {
      window.removeEventListener("storage", refreshData);
      window.removeEventListener("rydex_order_update", refreshData);
      clearInterval(interval);
    };
  }, []);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setLoginError("");

    const trimmedUser = usernameInput.trim().toLowerCase();
    const trimmedPass = passwordInput.trim();

    // Default required credentials: user name : nazeer | pass : nazeer
    if (trimmedUser === "nazeer" && trimmedPass === "nazeer") {
      sessionStorage.setItem("rydex_admin_auth", "true");
      localStorage.setItem("rydex_admin_auth", "true");
      setIsAuthenticated(true);
      setLoginError("");
      
      // Clean any demo records from localStorage on login
      try {
        const all = localStorage.getItem("all_orders");
        if (all) {
          const parsed = JSON.parse(all);
          const cleaned = cleanRealOrders(parsed);
          localStorage.setItem("all_orders", JSON.stringify(cleaned));
          setOrders(cleaned);
        }
      } catch (err) {
        console.error(err);
      }
      showFeedback("Welcome, Nazeer. Operations desk unlocked.");
    } else {
      setLoginError("Invalid credentials. Please enter authorized username and password.");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("rydex_admin_auth");
    localStorage.removeItem("rydex_admin_auth");
    setIsAuthenticated(false);
    setUsernameInput("");
    setPasswordInput("");
  };

  const handleClearAllOrders = () => {
    if (
      window.confirm(
        "Are you sure you want to purge all test bookings? Real customer bookings will still arrive normally."
      )
    ) {
      orders.forEach((o) => {
        if (o.paymentId) mongoApi.deleteOrder(o.paymentId);
      });
      setOrders([]);
      localStorage.removeItem("all_orders");
      localStorage.removeItem("paymentData");
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("rydex_order_update"));
      showFeedback("Cleared all test booking records.");
    }
  };

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  const handleCopyUtr = (utr) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(""), 2000);
  };

  // AUDIT LOG HELPER (Maintains proper persistent record of all admin operations)
  const recordAuditLog = async (data) => {
    const logEntry = makeAuditLogPayload(data);

    setAuditLogs((prev) => [logEntry, ...prev]);
    try {
      const current = JSON.parse(localStorage.getItem("admin_audit_logs") || "[]");
      localStorage.setItem("admin_audit_logs", JSON.stringify([logEntry, ...current].slice(0, 500)));
    } catch (e) {
      console.error(e);
    }
    await mongoApi.addAuditLog(logEntry);
  };

  // ADMIN APPROVAL POWER: APPROVE APPLICATION
  const handleApproveBooking = async (paymentId, notes = "Application approved & vehicle allocated by admin", driver) => {
    const ord = orders.find((o) => o.paymentId === paymentId);
    if (!ord) return;

    const nowIso = new Date().toISOString();
    const updated = orders.map((o) => {
      if (o.paymentId === paymentId) {
        return {
          ...o,
          status: "success",
          verified: true,
          approvalStatus: "APPROVED",
          pickupStatus: o.pickupStatus === "Pickup Requested" ? "Pickup Confirmed" : o.pickupStatus,
          adminReviewState: "Verified & Confirmed",
          approvedBy: "Admin (Chief Operations)",
          approvedAt: nowIso,
          verifiedAt: nowIso,
          verifiedBy: "Admin (Chief Operations)",
          adminNotes: notes,
          rejectionReason: null,
          rejectedAt: null,
          driver: driver || o.driver,
        };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));

    try {
      const cur = localStorage.getItem("paymentData");
      if (cur) {
        const parsed = JSON.parse(cur);
        if (parsed.paymentId === paymentId) {
          localStorage.setItem(
            "paymentData",
            JSON.stringify({
              ...parsed,
              status: "success",
              verified: true,
              approvalStatus: "APPROVED",
              pickupStatus: parsed.pickupStatus === "Pickup Requested" ? "Pickup Confirmed" : parsed.pickupStatus,
              approvedBy: "Admin (Chief Operations)",
              approvedAt: nowIso,
              driver: driver || parsed.driver,
            })
          );
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (selectedOperationOrder && selectedOperationOrder.paymentId === paymentId) {
      setSelectedOperationOrder((prev) => ({
        ...prev,
        status: "success",
        verified: true,
        approvalStatus: "APPROVED",
        pickupStatus: prev.pickupStatus === "Pickup Requested" ? "Pickup Confirmed" : prev.pickupStatus,
        approvedBy: "Admin (Chief Operations)",
        approvedAt: nowIso,
        adminNotes: notes,
        driver: driver || prev.driver,
      }));
    }

    await recordAuditLog({
      orderId: paymentId,
      customerName: ord.booking?.customer?.name || "Customer",
      customerPhone: ord.booking?.customer?.phone || "",
      carModel: typeof ord.booking?.car === "object" ? `${ord.booking.car.brand} ${ord.booking.car.model}` : ord.booking?.car || "Vehicle",
      carRegistration: ord.carRegistrationNumber || ord.carRegistration || "TS 09 EZ 4082",
      actionType: "APPLICATION_APPROVED",
      previousStatus: ord.approvalStatus || (ord.verified ? "Approved" : "Pending Verification"),
      newStatus: "Pickup Confirmed",
      adminUser: "Admin (Chief Operations)",
      notes,
    });

    await mongoApi.approveOrder(paymentId, { adminUser: "Admin (Chief Operations)", notes, driver });
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));
    showFeedback(`✅ Application #${paymentId.substring(0, 10)}... APPROVED with official authority!`);
  };

  const handleVerifyManually = (paymentId) => {
    handleApproveBooking(paymentId, "Manual UTR verification confirmed in bank records.");
  };

  // ADMIN APPROVAL POWER: REJECT APPLICATION
  const handleRejectBooking = async (paymentId, reason = "UTR verification failed or document mismatch") => {
    const ord = orders.find((o) => o.paymentId === paymentId);
    if (!ord) return;

    const nowIso = new Date().toISOString();
    const cleanReason = reason.trim() || "UTR could not be verified in Rydex bank statement";

    const updated = orders.map((o) => {
      if (o.paymentId === paymentId) {
        return {
          ...o,
          status: "rejected",
          verified: false,
          approvalStatus: "REJECTED",
          adminReviewState: `Rejected: ${cleanReason}`,
          rejectedAt: nowIso,
          rejectionReason: cleanReason,
          adminNotes: cleanReason,
        };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));

    try {
      const cur = localStorage.getItem("paymentData");
      if (cur) {
        const parsed = JSON.parse(cur);
        if (parsed.paymentId === paymentId) {
          localStorage.setItem(
            "paymentData",
            JSON.stringify({
              ...parsed,
              status: "rejected",
              verified: false,
              approvalStatus: "REJECTED",
              rejectionReason: cleanReason,
              rejectedAt: nowIso,
            })
          );
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (selectedOperationOrder && selectedOperationOrder.paymentId === paymentId) {
      setSelectedOperationOrder((prev) => ({
        ...prev,
        status: "rejected",
        verified: false,
        approvalStatus: "REJECTED",
        rejectionReason: cleanReason,
        rejectedAt: nowIso,
      }));
    }

    await recordAuditLog({
      orderId: paymentId,
      customerName: ord.booking?.customer?.name || "Customer",
      customerPhone: ord.booking?.customer?.phone || "",
      carModel: typeof ord.booking?.car === "object" ? `${ord.booking.car.brand} ${ord.booking.car.model}` : ord.booking?.car || "Vehicle",
      carRegistration: ord.carRegistrationNumber || ord.carRegistration || "TS 09 EZ 4082",
      actionType: "APPLICATION_REJECTED",
      previousStatus: ord.approvalStatus || (ord.verified ? "Approved" : "Pending Verification"),
      newStatus: "Rejected",
      adminUser: "Admin (Chief Operations)",
      notes: cleanReason,
    });

    await mongoApi.rejectOrder(paymentId, { adminUser: "Admin (Chief Operations)", reason: cleanReason });
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));
    showFeedback(`⚠️ Application #${paymentId.substring(0, 10)}... marked as REJECTED.`);
  };

  // REJECT TRANSACTION ACTION (Opens modal)
  const handleRejectTransaction = (paymentId) => {
    const found = orders.find((o) => o.paymentId === paymentId);
    if (found) {
      setRejectModalOrder(found);
      setRejectionReasonText(found.rejectionReason || "UTR not reflected in Rydex bank statement");
    }
  };

  const confirmRejection = () => {
    if (!rejectModalOrder) return;
    handleRejectBooking(rejectModalOrder.paymentId, rejectionReasonText);
    setRejectModalOrder(null);
    setRejectionReasonText("");
  };

  // ADMIN APPROVAL POWER: RESET TO REVIEW / REVOKE
  const handleResetOrderToReview = async (paymentId) => {
    const ord = orders.find((o) => o.paymentId === paymentId);
    if (!ord) return;

    const updated = orders.map((o) => {
      if (o.paymentId === paymentId) {
        return {
          ...o,
          status: "pending",
          verified: false,
          approvalStatus: "PENDING_APPROVAL",
          pickupStatus: "Pickup Requested",
          adminReviewState: "Pending Admin Verification",
          approvedBy: null,
          approvedAt: null,
          rejectionReason: null,
        };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));

    if (selectedOperationOrder && selectedOperationOrder.paymentId === paymentId) {
      setSelectedOperationOrder((prev) => ({
        ...prev,
        status: "pending",
        verified: false,
        approvalStatus: "PENDING_APPROVAL",
        pickupStatus: "Pickup Requested",
        adminReviewState: "Pending Admin Verification",
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
      }));
    }

    await recordAuditLog({
      orderId: paymentId,
      customerName: ord.booking?.customer?.name || "Customer",
      customerPhone: ord.booking?.customer?.phone || "",
      carModel: typeof ord.booking?.car === "object" ? `${ord.booking.car.brand} ${ord.booking.car.model}` : ord.booking?.car || "Vehicle",
      carRegistration: ord.carRegistrationNumber || ord.carRegistration || "TS 09 EZ 4082",
      actionType: "APPROVAL_REVOKED",
      previousStatus: ord.approvalStatus || "Approved",
      newStatus: "Pending Review",
      adminUser: "Admin (Chief Operations)",
      notes: "Approval status reset to Pending Review by Operations Administrator.",
    });

    await mongoApi.updateOrder(paymentId, {
      status: "pending",
      verified: false,
      approvalStatus: "PENDING_APPROVAL",
      pickupStatus: "Pickup Requested",
      adminReviewState: "Pending Admin Verification",
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
    });

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));
    showFeedback("Application status reset to Pending Review.");
  };

  const handleSaveAdminNotes = async (paymentId, notes) => {
    const ord = orders.find((o) => o.paymentId === paymentId);
    if (!ord) return;

    const updated = orders.map((o) => {
      if (o.paymentId === paymentId) {
        return { ...o, adminNotes: notes };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));

    if (selectedOperationOrder && selectedOperationOrder.paymentId === paymentId) {
      setSelectedOperationOrder((prev) => ({ ...prev, adminNotes: notes }));
    }

    await recordAuditLog({
      orderId: paymentId,
      customerName: ord.booking?.customer?.name || "Customer",
      customerPhone: ord.booking?.customer?.phone || "",
      carModel: typeof ord.booking?.car === "object" ? `${ord.booking.car.brand} ${ord.booking.car.model}` : ord.booking?.car || "Vehicle",
      actionType: "ADMIN_NOTES_LOGGED",
      newStatus: ord.approvalStatus || "Recorded",
      notes: `Operational remark: ${notes}`,
    });

    await mongoApi.updateOrder(paymentId, { adminNotes: notes });
    window.dispatchEvent(new Event("storage"));
    showFeedback("Operational remarks updated and logged in history.");
  };

  // ASSIGN DRIVER OPERATION
  const handleAssignDriverToBooking = async (paymentId, driverObj) => {
    if (!driverObj || !driverObj.name) return;
    const ord = orders.find((o) => o.paymentId === paymentId);
    if (!ord) return;

    const updated = orders.map((o) => {
      if (o.paymentId === paymentId) {
        return { ...o, driver: driverObj };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));

    if (selectedOperationOrder && selectedOperationOrder.paymentId === paymentId) {
      setSelectedOperationOrder((prev) => ({ ...prev, driver: driverObj }));
    }

    await recordAuditLog({
      orderId: paymentId,
      customerName: ord.booking?.customer?.name || "Customer",
      customerPhone: ord.booking?.customer?.phone || "",
      carModel: typeof ord.booking?.car === "object" ? `${ord.booking.car.brand} ${ord.booking.car.model}` : ord.booking?.car || "Vehicle",
      carRegistration: ord.carRegistrationNumber || ord.carRegistration || "TS 09 EZ 4082",
      actionType: "DRIVER_ASSIGNED",
      previousStatus: ord.driver?.name ? `Driver: ${ord.driver.name}` : "Unassigned",
      newStatus: `Chauffeur: ${driverObj.name}`,
      notes: `Assigned driver ${driverObj.name} (${driverObj.phone}). License: ${driverObj.licenseNumber || "Verified"}`,
    });

    await mongoApi.assignDriver(paymentId, driverObj);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));
    showFeedback(`🚗 Driver ${driverObj.name} assigned to reservation!`);
  };

  // REALLOCATE CAR OPERATION
  const handleReassignCarToBooking = async (paymentId, carRegistration) => {
    if (!carRegistration || !carRegistration.trim()) return;
    const cleanReg = carRegistration.trim().toUpperCase();
    const ord = orders.find((o) => o.paymentId === paymentId);
    if (!ord) return;

    const updated = orders.map((o) => {
      if (o.paymentId === paymentId) {
        return { ...o, carRegistration: cleanReg, carRegistrationNumber: cleanReg };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));

    if (selectedOperationOrder && selectedOperationOrder.paymentId === paymentId) {
      setSelectedOperationOrder((prev) => ({
        ...prev,
        carRegistration: cleanReg,
        carRegistrationNumber: cleanReg,
      }));
    }

    await recordAuditLog({
      orderId: paymentId,
      customerName: ord.booking?.customer?.name || "Customer",
      customerPhone: ord.booking?.customer?.phone || "",
      carModel: typeof ord.booking?.car === "object" ? `${ord.booking.car.brand} ${ord.booking.car.model}` : ord.booking?.car || "Vehicle",
      carRegistration: cleanReg,
      actionType: "CAR_REASSIGNED",
      previousStatus: ord.carRegistration || "TS 09 EZ 4082",
      newStatus: cleanReg,
      notes: `Vehicle allocation plate updated to ${cleanReg}`,
    });

    await mongoApi.updateOrder(paymentId, { carRegistration: cleanReg, carRegistrationNumber: cleanReg });
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));
    showFeedback(`🚘 Vehicle plate reallocated to ${cleanReg}!`);
  };

  // REFUND SECURITY DEPOSIT OPERATION
  const handleRefundDeposit = async (paymentId) => {
    const ord = orders.find((o) => o.paymentId === paymentId);
    if (!ord) return;

    const updated = orders.map((o) => {
      if (o.paymentId === paymentId) {
        return { ...o, depositRefunded: true, tripStatus: "Completed" };
      }
      return o;
    });

    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));

    if (selectedOperationOrder && selectedOperationOrder.paymentId === paymentId) {
      setSelectedOperationOrder((prev) => ({ ...prev, depositRefunded: true, tripStatus: "Completed" }));
    }

    await recordAuditLog({
      orderId: paymentId,
      customerName: ord.booking?.customer?.name || "Customer",
      customerPhone: ord.booking?.customer?.phone || "",
      carModel: typeof ord.booking?.car === "object" ? `${ord.booking.car.brand} ${ord.booking.car.model}` : ord.booking?.car || "Vehicle",
      actionType: "DEPOSIT_REFUNDED",
      previousStatus: "Deposit Held",
      newStatus: "Deposit Cleared / Refunded",
      notes: "Security deposit ₹3,000 cleared and refunded after vehicle handover and inspection.",
    });

    await mongoApi.refundDeposit(paymentId);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));
    showFeedback(`💰 Security deposit marked as refunded & trip completed.`);
  };

  // 13. Car Pickup Status Workflow
  const handleUpdatePickupStatus = async (paymentId, newPickupStatus) => {
    const ord = orders.find((o) => o.paymentId === paymentId);
    const oldStatus = ord?.pickupStatus || "Pickup Requested";

    const updated = orders.map((o) => {
      if (o.paymentId === paymentId) {
        return { ...o, pickupStatus: newPickupStatus, tripStatus: newPickupStatus };
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));

    if (selectedOperationOrder && selectedOperationOrder.paymentId === paymentId) {
      setSelectedOperationOrder((prev) => ({
        ...prev,
        pickupStatus: newPickupStatus,
        tripStatus: newPickupStatus,
      }));
    }

    await recordAuditLog({
      orderId: paymentId,
      customerName: ord?.booking?.customer?.name || "Customer",
      customerPhone: ord?.booking?.customer?.phone || "",
      carModel: typeof ord?.booking?.car === "object" ? `${ord.booking.car.brand} ${ord.booking.car.model}` : ord?.booking?.car || "Vehicle",
      carRegistration: ord?.carRegistration || "TS 09 EZ 4082",
      actionType: "PICKUP_STATUS_UPDATED",
      previousStatus: oldStatus,
      newStatus: newPickupStatus,
      notes: `Car pickup stage progressed from "${oldStatus}" to "${newPickupStatus}".`,
    });

    await mongoApi.updatePickupStatus(paymentId, newPickupStatus);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("rydex_order_update"));
    showFeedback(`Pickup workflow set to: ${newPickupStatus}`);
  };

  // EXCEL EXPORT MASTER HISTORY
  const handleExportExcel = () => {
    try {
      const fileName = exportAdminHistoryToExcel({
        orders,
        auditLogs,
        fleet,
      });
      showFeedback(`📥 Successfully exported Admin Master History: ${fileName}`);
    } catch (err) {
      console.error(err);
      showFeedback(`Excel export failed: ${err.message}`);
    }
  };

  const handleExportSingleDossier = (ord) => {
    try {
      const fileName = exportSingleOrderDossier(ord);
      showFeedback(`📥 Exported Booking Excel Dossier: ${fileName}`);
    } catch (err) {
      console.error(err);
      showFeedback(`Export failed: ${err.message}`);
    }
  };

  const handleDownloadPdfVoucher = (ord) => {
    try {
      downloadBookingReport(ord);
      showFeedback("📄 Generated official PDF booking voucher.");
    } catch (err) {
      console.error(err);
      showFeedback(`PDF generation error: ${err.message}`);
    }
  };

  // Update trip lifecycle
  const handleUpdateTripStatus = (paymentId, newStatus) => {
    const updated = orders.map((ord) => {
      if (ord.paymentId === paymentId) {
        return { ...ord, tripStatus: newStatus };
      }
      return ord;
    });
    setOrders(updated);
    localStorage.setItem("all_orders", JSON.stringify(updated));
    mongoApi.updateOrder(paymentId, { tripStatus: newStatus });
    showFeedback(`Trip lifecycle updated to: ${newStatus}`);
  };

  // Fleet management actions
  const handleToggleCarAvailability = (carId) => {
    const updated = fleet.map((c) => {
      if (c.id === carId) return { ...c, isAvailable: !c.isAvailable };
      return c;
    });
    setFleet(updated);
    saveStoredCars(updated);
    showFeedback("Fleet vehicle availability updated.");
  };

  const handleUpdateCarPrice = (carId, newPrice) => {
    const num = Number(newPrice);
    if (isNaN(num) || num <= 0) return;
    const updated = fleet.map((c) => {
      if (c.id === carId) return { ...c, price: num };
      return c;
    });
    setFleet(updated);
    saveStoredCars(updated);
    showFeedback("Vehicle rate updated successfully.");
  };

  // 12. Driver & Customer Management Actions
  const handleUpdateDriverStatus = async (userKey, newStatus, assignedVehicle) => {
    const updated = usersList.map((u) => {
      if (u._id === userKey || u.username === userKey || u.mobileNumber === userKey) {
        return {
          ...u,
          status: newStatus,
          assignedVehicle: assignedVehicle !== undefined ? assignedVehicle : u.assignedVehicle,
        };
      }
      return u;
    });
    setUsersList(updated);
    localStorage.setItem("registered_customers", JSON.stringify(updated));
    await mongoApi.updateUserStatus(userKey, { status: newStatus, assignedVehicle });
    showFeedback(`Driver updated: status ${newStatus}`);
  };

  const handleUpdateCustomerStatus = async (userKey, newStatus) => {
    const updated = usersList.map((u) => {
      if (u._id === userKey || u.username === userKey || u.mobileNumber === userKey) {
        return { ...u, status: newStatus };
      }
      return u;
    });
    setUsersList(updated);
    localStorage.setItem("registered_customers", JSON.stringify(updated));
    await mongoApi.updateUserStatus(userKey, { status: newStatus });
    showFeedback(`Customer status updated to: ${newStatus}`);
  };

  // Derive Customers and Drivers lists
  const customersList = usersList.filter((u) => (u.role || "customer") === "customer");
  const driversList = usersList.filter((u) => u.role === "driver");

  // Get chronological bookings for any customer
  const getCustomerBookings = (c) => {
    const phone = c.mobileNumber || c.phone;
    const email = c.email;
    return orders.filter(
      (o) =>
        (phone && (o.booking?.customer?.phone === phone || o.customerPhone === phone)) ||
        (email && o.booking?.customer?.email === email) ||
        o.userId === c._id ||
        o.username === c.username
    );
  };

  // Get chronological rides for any driver
  const getDriverBookings = (d) => {
    const phone = d.mobileNumber || d.phone;
    const name = d.name;
    return orders.filter(
      (o) =>
        o.driver?.phone === phone ||
        o.driver?.name === name ||
        (d.assignedVehicle &&
          (o.booking?.car?.brand?.toLowerCase().includes(d.assignedVehicle.toLowerCase()) ||
           o.carRegistration === d.assignedVehicle))
    );
  };

  // Filtered submissions
  const pendingSubmissions = orders.filter(
    (o) => o.status === "pending_admin" || o.status === "pending" || (!o.verified && o.status !== "rejected" && o.status !== "cancelled")
  );

  const verifiedOrders = orders.filter((o) => o.status === "success" || o.verified);
  const rejectedOrders = orders.filter((o) => o.status === "rejected");

  const count25Pct = orders.filter((o) => o.bookingWay === "confirm_25").length;
  const countHold = orders.filter((o) => o.bookingWay === "hold_24h").length;
  const countStandard = orders.filter((o) => o.bookingWay === "standard_booking").length;

  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  // Submissions filtered by user option and verification state
  const displayedSubmissions = orders.filter((ord) => {
    // 3 Ways filter
    if (submissionFilter !== "all" && ord.bookingWay !== submissionFilter) {
      return false;
    }
    // Status filter
    if (statusFilter === "pending") {
      return ord.status === "pending_admin" || ord.status === "pending" || (!ord.verified && ord.status !== "rejected" && ord.status !== "cancelled");
    }
    if (statusFilter === "verified") {
      return ord.status === "success" || ord.verified;
    }
    if (statusFilter === "rejected") {
      return ord.status === "rejected";
    }
    return true;
  });

  // Authentication Gate View: Only allow access with username: nazeer, pass: nazeer
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Admin Operations Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Restricted Access · Enter credentials to verify bookings & manage fleet
            </p>
          </div>

          <div className="bg-slate-800/95 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter admin username (e.g. nazeer)"
                    autoComplete="username"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter admin password (e.g. nazeer)"
                    autoComplete="current-password"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium placeholder-slate-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-extrabold py-3 px-4 rounded-xl text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Unlock Operations Desk</span>
              </button>
            </form>

            {/* Authorized Default Credential Helper */}
            <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span className="text-[11px] block font-semibold text-slate-300">Authorized Credentials:</span>
                <span className="font-mono text-amber-300 text-xs">user: nazeer | pass: nazeer</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUsernameInput("nazeer");
                  setPasswordInput("nazeer");
                }}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer"
              >
                Quick Fill
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/home"
              className="text-xs text-slate-400 hover:text-slate-200 transition"
            >
              ← Back to Rydex Customer App
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Admin Control & Manual Verification Desk
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-700" />
                <span>Admin: nazeer</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Customer booking submissions arrive here in real-time. Inspect transaction IDs & details, then verify manually.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Export Admin History Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-sm"
              title="Download Complete Admin History Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export History (Excel)</span>
            </button>

            {/* Purge Test Data Button */}
            {orders.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllOrders}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition flex items-center gap-1.5 shadow-sm"
                title="Clear all test bookings"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Purge Records</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const all = localStorage.getItem("all_orders");
                if (all) setOrders(cleanRealOrders(JSON.parse(all)));
                showFeedback("Refreshed latest submissions.");
              }}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <Link
              to="/cars"
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <span>Customer Booking App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Lock / Sign Out */}
            <button
              type="button"
              onClick={handleAdminLogout}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center gap-1.5 shadow-sm"
              title="Lock Admin Desk"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Desk</span>
            </button>
          </div>
        </div>

        {/* Incoming Submission Notification Bar */}
        {pendingSubmissions.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold animate-pulse shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-extrabold text-amber-950 text-sm">
                  {pendingSubmissions.length} New Submission{pendingSubmissions.length > 1 ? "s" : ""} Received!
                </p>
                <p className="text-amber-800">
                  User details and transaction ID received without gateway delay. Review and verify manually below.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab("submissions");
                setStatusFilter("pending");
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
            >
              Review Pending ({pendingSubmissions.length})
            </button>
          </div>
        )}

        {feedbackMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase">Needs Verification</span>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {pendingSubmissions.length}
              </p>
              <span className="text-[10px] text-slate-400">Manual review queue</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase">25% Advance Bookings</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{count25Pct}</p>
              <span className="text-[10px] text-slate-400">UPI token submitted</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase">24h Holds / Standard</span>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {countHold + countStandard}
              </p>
              <span className="text-[10px] text-slate-400">
                {countHold} Holds · {countStandard} Standard
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase">Verified Revenue</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ₹{totalRevenue.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] text-slate-400">{verifiedOrders.length} Confirmed orders</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Top Tab Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "submissions"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>Manual Verification Desk</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
              {pendingSubmissions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("all_orders")}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === "all_orders"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            All Bookings & Pickup Dispatch ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "customers"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers ({customersList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("drivers")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "drivers"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Drivers ({driversList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("fleet")}
            className={`px-4 py-2 rounded-xl transition ${
              activeTab === "fleet"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Fleet Inventory ({fleet.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Approval History & Ledger ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: MANUAL VERIFICATION DESK */}
        {activeTab === "submissions" && (
          <div className="space-y-4">
            {/* Filter Control Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              {/* 3 Ways Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-500 mr-1">Booking Way:</span>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    submissionFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({orders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter("confirm_25")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    submissionFilter === "confirm_25"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>25% Advance ({count25Pct})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter("hold_24h")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    submissionFilter === "hold_24h"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>24h Hold ({countHold})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionFilter("standard_booking")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                    submissionFilter === "standard_booking"
                      ? "bg-purple-600 text-white"
                      : "bg-purple-50 text-purple-800 hover:bg-purple-100"
                  }`}
                >
                  <CalendarCheck className="w-3 h-3" />
                  <span>Standard Booking ({countStandard})</span>
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-500 mr-1">Status:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === "all"
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Statuses
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === "pending"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  Pending Review ({pendingSubmissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("verified")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === "verified"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  Verified ({verifiedOrders.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("rejected")}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                    statusFilter === "rejected"
                      ? "bg-red-600 text-white"
                      : "bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
                >
                  Rejected / Flagged ({rejectedOrders.length})
                </button>
              </div>
            </div>

            {/* Submissions List */}
            {displayedSubmissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No Submissions in this Filter
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Customer bookings (24-hour hold, standard booking, or 25% advance payment) will automatically appear here in real-time for manual verification.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Link
                    to="/cars"
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    <span>Browse Fleet in Customer App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedSubmissions.map((sub, idx) => {
                  const isVerified = sub.verified || sub.status === "success";
                  const isRejected = sub.status === "rejected";
                  const way = sub.bookingWay || "confirm_25";

                  return (
                    <div
                      key={sub.paymentId || idx}
                      className={`bg-white rounded-2xl p-5 border shadow-sm transition space-y-4 ${
                        !isVerified && !isRejected
                          ? "border-amber-300 ring-1 ring-amber-200"
                          : "border-slate-200"
                      }`}
                    >
                      {/* Card Top Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                              way === "confirm_25"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : way === "hold_24h"
                                ? "bg-amber-100 text-amber-900 border border-amber-200"
                                : "bg-purple-100 text-purple-800 border border-purple-200"
                            }`}
                          >
                            {way === "confirm_25" && <Zap className="w-3.5 h-3.5" />}
                            {way === "hold_24h" && <Clock className="w-3.5 h-3.5" />}
                            {way === "standard_booking" && <CalendarCheck className="w-3.5 h-3.5" />}
                            <span>{sub.bookingWayLabel || "Booking Submission"}</span>
                          </span>

                          <span className="font-mono text-xs text-slate-500">
                            Ref: #{sub.paymentId}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified & Confirmed Manually</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Pending Admin Verification</span>
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400">
                            {sub.submittedAt
                              ? new Date(sub.submittedAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Recent"}
                          </span>
                        </div>
                      </div>

                      {/* Main Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                        {/* Vehicle & Trip (4 cols) */}
                        <div className="md:col-span-4 space-y-1.5 border-r md:border-slate-100 md:pr-4">
                          <span className="text-slate-400 uppercase text-[10px] font-bold block">
                            Vehicle & Handover
                          </span>
                          <p className="font-extrabold text-sm text-slate-900">
                            {sub.booking?.car || "Rydex Vehicle"}
                          </p>
                          <div className="flex items-center gap-1 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              {sub.booking?.pickupDate} at {sub.booking?.pickupTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                              {sub.booking?.pickupType === "Self pickup"
                                ? `Hub: ${sub.booking?.hub || "Madhapur"}`
                                : `Delivery: ${sub.booking?.deliveryLocation || sub.booking?.deliveryAddress}`}
                            </span>
                          </div>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {sub.booking?.withDriver ? "Chauffeur Driven" : "Self-Drive"}
                          </span>
                        </div>

                        {/* Customer Information (4 cols) */}
                        <div className="md:col-span-4 space-y-1.5 border-r md:border-slate-100 md:pr-4">
                          <span className="text-slate-400 uppercase text-[10px] font-bold block">
                            Customer Details
                          </span>
                          <p className="font-bold text-slate-900 text-sm">
                            {sub.booking?.customer?.name || "Customer"}
                          </p>
                          <p className="text-slate-600">
                            Phone: <strong>+91 {sub.booking?.customer?.phone}</strong>
                          </p>
                          <p className="text-slate-500">
                            Email: {sub.booking?.customer?.email || "On file"}
                          </p>
                          {sub.booking?.customer?.dl && (
                            <p className="text-slate-600 font-mono text-[11px]">
                              DL: {sub.booking.customer.dl}
                            </p>
                          )}

                          {/* Quick Contact Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={`tel:+91${sub.booking?.customer?.phone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 font-bold text-[11px] transition"
                            >
                              <PhoneCall className="w-3 h-3" /> Call
                            </a>
                            <a
                              href={`https://wa.me/91${sub.booking?.customer?.phone}?text=Hello%20${encodeURIComponent(
                                sub.booking?.customer?.name || ""
                              )},%20this%20is%20Rydex%20Car%20Rental%20Hyderabad%20regarding%20your%20reservation.`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 font-bold text-[11px] transition"
                            >
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </a>
                          </div>
                        </div>

                        {/* Financial & Transaction ID (4 cols) */}
                        <div className="md:col-span-4 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-400 uppercase text-[10px] font-bold block">
                            Submitted Transaction & Payment
                          </span>

                          {/* Highlighted UTR ID */}
                          <div className="bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-slate-400 text-[10px] block">
                              Submitted Transaction ID / UTR:
                            </span>
                            <div className="flex items-center justify-between mt-0.5">
                              <code className="font-mono font-bold text-xs text-blue-700">
                                {sub.utrId || "N/A"}
                              </code>
                              {sub.utrId && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyUtr(sub.utrId)}
                                  className="text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-0.5"
                                  title="Copy UTR to verify in Bank app"
                                >
                                  {copiedUtr === sub.utrId ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" /> Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" /> Copy
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span>Total Booking Amount:</span>
                              <span className="font-bold text-slate-900">
                                ₹{sub.totalBookingAmount || sub.booking?.total}
                              </span>
                            </div>
                            <div className="flex justify-between text-blue-700 font-bold">
                              <span>Advance Submitted:</span>
                              <span>₹{sub.amount || 0}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                              <span>Balance at Pickup:</span>
                              <span className="font-bold text-slate-800">
                                ₹{sub.remainingAtPickup || ((sub.totalBookingAmount || sub.booking?.total || 0) - (sub.amount || 0))}
                              </span>
                            </div>
                          </div>

                          {sub.bookingNote && (
                            <p className="text-[10px] text-slate-500 italic bg-white p-1.5 rounded border border-slate-100">
                              Note: "{sub.bookingNote}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          {sub.status === "rejected" ? (
                            <span className="text-red-700 font-bold flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                              <span>Flagged / Rejected: "{sub.rejectionReason || "UTR verification failed"}"</span>
                            </span>
                          ) : isVerified ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              Approved by {sub.verifiedBy || "Admin"} on{" "}
                              {sub.verifiedAt ? new Date(sub.verifiedAt).toLocaleDateString() : "Today"}
                            </span>
                          ) : (
                            <span className="text-amber-800 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              Verify UTR against Rydex Current Account / UPI statement
                            </span>
                          )}
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOperationOrder(sub);
                              setOperationDriverSelection(sub.driver?.name || "Ramesh Kumar");
                              setOperationCarSelection(sub.carRegistrationNumber || sub.carRegistration || "TS 09 EZ 4082");
                              setOperationNote(sub.adminNotes || "");
                            }}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                            title="Pull up all operations & approval power"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Pull Up Operations</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExportSingleDossier(sub)}
                            className="p-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition border border-slate-200"
                            title="Export Booking Details to Excel Dossier (.xlsx)"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>

                          {sub.status === "rejected" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVerifyManually(sub.paymentId)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                <span>Re-Verify & Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectTransaction(sub.paymentId)}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                              >
                                Edit Reason
                              </button>
                            </>
                          ) : !isVerified ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleVerifyManually(sub.paymentId)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                <span>Verify & Confirm Manually</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectTransaction(sub.paymentId)}
                                className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition"
                              >
                                Reject / Flag
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                value={sub.tripStatus || "Confirmed"}
                                onChange={(e) => handleUpdateTripStatus(sub.paymentId, e.target.value)}
                                className="text-xs bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
                              >
                                <option value="Confirmed">Trip: Confirmed</option>
                                <option value="Dispatched">Trip: Dispatched</option>
                                <option value="In Progress">Trip: In Progress</option>
                                <option value="Completed">Trip: Completed</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleVerifyManually(sub.paymentId)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                                title="Re-sync verification stamp"
                              >
                                Re-Confirm
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectTransaction(sub.paymentId)}
                                className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                                title="Revoke approval"
                              >
                                Revoke
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALL BOOKINGS & CAR PICKUP DISPATCH */}
        {activeTab === "all_orders" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  All Reservations & Car Pickup Dispatch Desk ({orders.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Manage reservations, update Car Pickup states, and track live GPS coordinates.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Ref ID</th>
                      <th className="p-3">Vehicle & Driver</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Schedule</th>
                      <th className="p-3">Advance / Balance</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Car Pickup Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((ord, idx) => {
                      const currentPickup = ord.pickupStatus || (ord.verified || ord.status === "success" ? "Pickup Confirmed" : "Pickup Requested");
                      const carTitle = typeof ord.booking?.car === "object"
                        ? `${ord.booking.car.brand || ""} ${ord.booking.car.model || ""}`.trim()
                        : ord.booking?.car || "Vehicle";
                      const carReg = ord.booking?.car?.registrationNumber || ord.carRegistration || "TS 09 EZ 4082";

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-semibold text-slate-700">
                            {ord.paymentId?.substring(0, 16)}...
                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                              {ord.bookingWay === "confirm_25"
                                ? "25% Advance"
                                : ord.bookingWay === "hold_24h"
                                ? "24h Hold"
                                : "Standard"}
                            </span>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{carTitle}</p>
                            <span className="inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 mt-0.5">
                              {carReg}
                            </span>
                            {ord.driver && (
                              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                                Driver: {ord.driver.name} ({ord.driver.phone})
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-800">
                              {ord.booking?.customer?.name || "Customer"}
                            </p>
                            <p className="text-slate-500 font-mono text-[11px]">
                              {ord.booking?.customer?.phone}
                            </p>
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-slate-800">{ord.booking?.pickupDate}</p>
                            <p className="text-slate-400">{ord.booking?.pickupTime}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-emerald-700">Adv: ₹{ord.amount || 0}</p>
                            <p className="text-slate-400">Bal: ₹{ord.remainingAtPickup || 0}</p>
                          </td>
                          <td className="p-3">
                            {ord.verified || ord.status === "success" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Verified
                              </span>
                            ) : ord.status === "rejected" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                Rejected
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Pending
                              </span>
                            )}
                          </td>

                          {/* 13. CAR PICKUP WORKFLOW SELECTOR */}
                          <td className="p-3">
                            <select
                              value={currentPickup}
                              onChange={(e) => handleUpdatePickupStatus(ord.paymentId, e.target.value)}
                              className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                currentPickup === "Completed"
                                  ? "bg-slate-100 text-slate-700 border-slate-300"
                                  : currentPickup === "Picked Up"
                                  ? "bg-purple-50 text-purple-700 border-purple-300"
                                  : currentPickup === "Ready for Pickup"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : currentPickup === "Pickup Confirmed"
                                  ? "bg-blue-50 text-blue-700 border-blue-300"
                                  : "bg-amber-50 text-amber-800 border-amber-300"
                              }`}
                            >
                              {PICKUP_STATUS_STEPS.map((step) => (
                                <option key={step} value={step}>
                                  {step}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOperationOrder(ord);
                                  setOperationDriverSelection(ord.driver?.name || "Ramesh Kumar");
                                  setOperationCarSelection(ord.carRegistrationNumber || ord.carRegistration || "TS 09 EZ 4082");
                                  setOperationNote(ord.adminNotes || "");
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                                title="Pull up operations & approval power"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Operations</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleExportSingleDossier(ord)}
                                className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-lg transition"
                                title="Export Booking Excel Dossier (.xlsx)"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                              </button>

                              {ord.status === "rejected" ? (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyManually(ord.paymentId)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                                >
                                  Re-verify
                                </button>
                              ) : ord.verified || ord.status === "success" ? (
                                <button
                                  type="button"
                                  onClick={() => handleRejectTransaction(ord.paymentId)}
                                  className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold"
                                >
                                  Flag
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyManually(ord.paymentId)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectTransaction(ord.paymentId)}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLETE CUSTOMER MANAGEMENT (Requirement 12) */}
        {activeTab === "customers" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Customer Accounts Directory ({customersList.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Verified customer records with verified primary mobile, alternate number, profile photos, and booking histories.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, phone, email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Primary Mobile (Verified)</th>
                      <th className="p-3">Alternate Mobile</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Residential Address</th>
                      <th className="p-3">Registered On</th>
                      <th className="p-3">Current / Total Bookings</th>
                      <th className="p-3">Account Status</th>
                      <th className="p-3 text-right">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customersList
                      .filter((c) => {
                        if (!customerSearch.trim()) return true;
                        const q = customerSearch.toLowerCase();
                        return (
                          c.name?.toLowerCase().includes(q) ||
                          c.username?.toLowerCase().includes(q) ||
                          c.email?.toLowerCase().includes(q) ||
                          c.mobileNumber?.includes(q) ||
                          c.alternateMobileNumber?.includes(q)
                        );
                      })
                      .map((cust, idx) => {
                        const custBookings = getCustomerBookings(cust);
                        const activeBooking = custBookings.find(
                          (o) => o.pickupStatus !== "Completed" && o.status !== "rejected"
                        );

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                {cust.profilePhoto ? (
                                  <img
                                    src={cust.profilePhoto}
                                    alt={cust.name}
                                    className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                    {(cust.name || cust.username || "U")[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900">{cust.name || cust.username}</p>
                                  <p className="text-[10px] text-slate-400">@{cust.username}</p>
                                </div>
                              </div>
                            </td>

                            <td className="p-3 font-mono font-bold text-slate-800">
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>+91 {cust.mobileNumber || cust.phone || "—"}</span>
                              </span>
                            </td>

                            <td className="p-3 font-mono text-slate-600">
                              {cust.alternateMobileNumber ? `+91 ${cust.alternateMobileNumber}` : "—"}
                            </td>

                            <td className="p-3 text-slate-600">
                              {cust.email || "—"}
                            </td>

                            <td className="p-3 text-slate-600 max-w-xs truncate">
                              {cust.address || "Hyderabad, Telangana"}
                            </td>

                            <td className="p-3 text-slate-500 text-[11px]">
                              {cust.createdAt ? new Date(cust.createdAt).toLocaleDateString("en-IN") : "Active Member"}
                            </td>

                            <td className="p-3">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900">
                                  {custBookings.length} Total Trip{custBookings.length !== 1 ? "s" : ""}
                                </span>
                                {activeBooking && (
                                  <span className="block text-[10px] text-blue-600 font-semibold truncate max-w-[130px]">
                                    Current: {activeBooking.pickupStatus || "Active"}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateCustomerStatus(
                                    cust._id || cust.username,
                                    cust.status === "Suspended" ? "Active" : "Suspended"
                                  )
                                }
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                                  cust.status === "Suspended"
                                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                                    : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                }`}
                              >
                                {cust.status || "Active"}
                              </button>
                            </td>

                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedCustomerDossier(cust)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition shadow-sm"
                              >
                                View File
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPLETE DRIVER MANAGEMENT (Requirement 10 & 12) */}
        {activeTab === "drivers" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Driver Chauffeur Management ({driversList.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Driver profiles with Aadhaar information, Driving License, verified contact numbers, assigned vehicles, and ride logs.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search driver by name, DL, phone..."
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Driver Profile</th>
                      <th className="p-3">Primary & Alt Mobile</th>
                      <th className="p-3">Email Address</th>
                      <th className="p-3">Aadhaar (Admin View)</th>
                      <th className="p-3">Driving License</th>
                      <th className="p-3">Assigned Fleet Vehicle</th>
                      <th className="p-3">Ride History</th>
                      <th className="p-3">Status & Verification</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driversList
                      .filter((d) => {
                        if (!driverSearch.trim()) return true;
                        const q = driverSearch.toLowerCase();
                        return (
                          d.name?.toLowerCase().includes(q) ||
                          d.username?.toLowerCase().includes(q) ||
                          d.email?.toLowerCase().includes(q) ||
                          d.mobileNumber?.includes(q) ||
                          d.alternateMobileNumber?.includes(q) ||
                          d.drivingLicenseNumber?.toLowerCase().includes(q) ||
                          d.aadhaarNumber?.includes(q)
                        );
                      })
                      .map((driver, idx) => {
                        const driverRides = getDriverBookings(driver);

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                {driver.profilePhoto ? (
                                  <img
                                    src={driver.profilePhoto}
                                    alt={driver.name}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                                    {(driver.name || "D")[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-slate-900">{driver.name || driver.username}</p>
                                  <span className="text-[10px] text-slate-400 block">{driver.address || "Hyderabad"}</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3">
                              <p className="font-mono font-bold text-slate-800">
                                +91 {driver.mobileNumber || "—"}
                              </p>
                              {driver.alternateMobileNumber && (
                                <p className="font-mono text-[11px] text-slate-400">
                                  Alt: +91 {driver.alternateMobileNumber}
                                </p>
                              )}
                            </td>

                            <td className="p-3 text-slate-600">
                              {driver.email || "—"}
                            </td>

                            {/* 10. AADHAAR INFO FOR ADMIN */}
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {driver.aadhaarNumber || "Verified"}
                                </span>
                                {driver.aadhaarNumber && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(driver.aadhaarNumber);
                                      showFeedback("Aadhaar copied to clipboard");
                                    }}
                                    className="text-slate-400 hover:text-blue-600"
                                    title="Copy Aadhaar"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* 10. DRIVING LICENSE INFO */}
                            <td className="p-3 font-mono font-bold text-blue-700">
                              {driver.drivingLicenseNumber || "DL Verified"}
                            </td>

                            {/* ASSIGNED VEHICLE */}
                            <td className="p-3">
                              <select
                                value={driver.assignedVehicle || ""}
                                onChange={(e) =>
                                  handleUpdateDriverStatus(
                                    driver._id || driver.username,
                                    driver.status || "Active",
                                    e.target.value
                                  )
                                }
                                className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1 font-semibold text-slate-800"
                              >
                                <option value="">No Vehicle Assigned</option>
                                {fleet.map((car) => (
                                  <option key={car.id} value={`${car.brand} ${car.model}`}>
                                    {car.brand} {car.model} ({car.registrationNumber || "Fleet"})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="p-3 font-bold text-slate-800">
                              {driverRides.length} Trips
                            </td>

                            {/* STATUS & APPROVAL */}
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  driver.status === "Active" || driver.status === "Verified"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : driver.status === "Suspended"
                                    ? "bg-red-100 text-red-800 border border-red-300"
                                    : "bg-amber-100 text-amber-800 border border-amber-300"
                                }`}
                              >
                                {driver.status || "Pending Approval"}
                              </span>
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {driver.status !== "Active" && driver.status !== "Verified" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateDriverStatus(
                                        driver._id || driver.username,
                                        "Active"
                                      )
                                    }
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold"
                                  >
                                    Approve
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateDriverStatus(
                                        driver._id || driver.username,
                                        "Suspended"
                                      )
                                    }
                                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-semibold"
                                  >
                                    Suspend
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setSelectedDriverDossier(driver)}
                                  className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800"
                                >
                                  Dossier
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FLEET INVENTORY (NO Transmission, NO Car Type) */}
        {activeTab === "fleet" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Fleet Availability & Seating Capacity Control ({fleet.length} Vehicles)
                </h2>
                <p className="text-xs text-slate-500">
                  5-Seater & 7-Seater vehicles (includes driver), AC / Non-AC status, and fuel-specific mileage.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fleet.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {c.brand} {c.model}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {/* 1. SEATING CAPACITY */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {formatSeating(c)}
                        </span>
                        {/* 7. AC / NON-AC */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          c.ac !== false
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {c.ac !== false ? "❄️ AC" : "🌡️ Non-AC"}
                        </span>
                        {/* 8. FUEL & MILEAGE */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {c.fuel} · {formatMileage(c)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        c.isAvailable !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.isAvailable !== false ? "AVAILABLE" : "UNAVAILABLE"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Daily Rate (₹)</span>
                      <input
                        type="number"
                        defaultValue={c.price}
                        onBlur={(e) => handleUpdateCarPrice(c.id, e.target.value)}
                        className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold"
                      />
                    </div>

                    <button
                      onClick={() => handleToggleCarAvailability(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        c.isAvailable !== false
                          ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      {c.isAvailable !== false ? "Mark Out-of-Service" : "Mark Available"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: ADMIN APPROVAL POWER & AUDIT LEDGER */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Administrative Operations & Approval History Ledger</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Every decision, approval, driver assignment, vehicle reallocation, and status update is logged with immutable timestamps.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto"
                title="Download Master History Excel with all booking and audit sheets"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export History (Excel)</span>
              </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Search by Booking Ref, Customer, Plate, or Operator..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Operations ({auditLogs.length})</option>
                  <option value="APPLICATION_APPROVED">Approved Applications</option>
                  <option value="APPLICATION_REJECTED">Rejected Applications</option>
                  <option value="APPLICATION_SUBMITTED">New Applications</option>
                  <option value="DRIVER_ASSIGNED">Driver Dispatches</option>
                  <option value="CAR_REASSIGNED">Car Plate Reallocations</option>
                  <option value="PICKUP_STATUS_UPDATED">Pickup Workflow Changes</option>
                  <option value="DEPOSIT_REFUNDED">Deposit Clearances</option>
                  <option value="APPROVAL_REVOKED">Approval Revocations</option>
                </select>

                {(auditSearchQuery || auditActionFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuditSearchQuery("");
                      setAuditActionFilter("all");
                    }}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Operation / Action</th>
                      <th className="p-3">Booking Ref</th>
                      <th className="p-3">Applicant & Contact</th>
                      <th className="p-3">Vehicle & Plate</th>
                      <th className="p-3">Operator</th>
                      <th className="p-3">Status Transition</th>
                      <th className="p-3">Operational Notes</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs
                      .filter((log) => {
                        if (auditActionFilter !== "all" && log.actionType !== auditActionFilter) {
                          return false;
                        }
                        if (auditSearchQuery.trim()) {
                          const q = auditSearchQuery.toLowerCase();
                          return (
                            log.orderId?.toLowerCase().includes(q) ||
                            log.customerName?.toLowerCase().includes(q) ||
                            log.customerPhone?.includes(q) ||
                            log.carModel?.toLowerCase().includes(q) ||
                            log.carRegistration?.toLowerCase().includes(q) ||
                            log.adminUser?.toLowerCase().includes(q) ||
                            log.notes?.toLowerCase().includes(q)
                          );
                        }
                        return true;
                      })
                      .map((log, idx) => {
                        const relatedOrder = orders.find((o) => o.paymentId === log.orderId);
                        return (
                          <tr key={log.logId || idx} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                              {new Date(log.timestamp || log.createdAt || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                                  log.actionType === "APPLICATION_APPROVED"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                    : log.actionType === "APPLICATION_REJECTED"
                                    ? "bg-red-50 text-red-800 border-red-300"
                                    : log.actionType === "DRIVER_ASSIGNED"
                                    ? "bg-purple-50 text-purple-800 border-purple-300"
                                    : log.actionType === "DEPOSIT_REFUNDED"
                                    ? "bg-blue-50 text-blue-800 border-blue-300"
                                    : "bg-slate-100 text-slate-800 border-slate-200"
                                }`}
                              >
                                {log.actionType}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-800">
                              {log.orderId || "GENERAL"}
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-slate-900">{log.customerName || "Customer"}</p>
                              {log.customerPhone && (
                                <p className="font-mono text-[11px] text-slate-500">{log.customerPhone}</p>
                              )}
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-800">{log.carModel || "Vehicle"}</p>
                              <span className="font-mono text-[10px] text-slate-500">{log.carRegistration || "TS 09 EZ 4082"}</span>
                            </td>
                            <td className="p-3 text-slate-600 font-semibold">{log.adminUser || "Admin Operations"}</td>
                            <td className="p-3">
                              <span className="text-indigo-700 font-semibold block text-[11px]">
                                {log.previousStatus ? `${log.previousStatus} → ` : ""}{log.newStatus || "Updated"}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 max-w-xs text-[11px]">
                              {log.notes || "-"}
                            </td>
                            <td className="p-3 text-right">
                              {relatedOrder ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOperationOrder(relatedOrder);
                                    setOperationDriverSelection(relatedOrder.driver?.name || "Ramesh Kumar");
                                    setOperationCarSelection(relatedOrder.carRegistrationNumber || relatedOrder.carRegistration || "TS 09 EZ 4082");
                                    setOperationNote(relatedOrder.adminNotes || "");
                                  }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold"
                                  title="Pull up operations for this booking"
                                >
                                  Operations Desk
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">Logged</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {auditLogs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400">
                          No audit operations recorded yet. Operational actions taken on applications will be displayed here and stored in the Admin History Excel.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 12. CUSTOMER DOSSIER DETAIL MODAL */}
        {selectedCustomerDossier && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  {selectedCustomerDossier.profilePhoto ? (
                    <img
                      src={selectedCustomerDossier.profilePhoto}
                      alt={selectedCustomerDossier.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow">
                      {(selectedCustomerDossier.name || "C")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5">
                      <span>{selectedCustomerDossier.name || selectedCustomerDossier.username}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        Verified Customer
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Member since: {selectedCustomerDossier.createdAt ? new Date(selectedCustomerDossier.createdAt).toLocaleDateString("en-IN") : "Active Member"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerDossier(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Mobile Number</span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    +91 {selectedCustomerDossier.mobileNumber || selectedCustomerDossier.phone}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Alternate Mobile Number</span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {selectedCustomerDossier.alternateMobileNumber ? `+91 ${selectedCustomerDossier.alternateMobileNumber}` : "Not provided"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedCustomerDossier.email || "customer@rydex.com"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Residential Address</span>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {selectedCustomerDossier.address || "Hyderabad, Telangana"}
                  </p>
                </div>
              </div>

              {/* Booking History Table */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Customer Booking History</span>
                  <span className="text-blue-600 font-extrabold">{getCustomerBookings(selectedCustomerDossier).length} Bookings</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px]">
                      <tr>
                        <th className="p-2.5">Ref ID</th>
                        <th className="p-2.5">Vehicle</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Amount</th>
                        <th className="p-2.5">Pickup Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getCustomerBookings(selectedCustomerDossier).map((bk, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-mono text-slate-700">{bk.paymentId?.slice(0, 10)}...</td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {typeof bk.booking?.car === "object" ? `${bk.booking.car.brand} ${bk.booking.car.model}` : bk.booking?.car || "Vehicle"}
                          </td>
                          <td className="p-2.5 text-slate-600">{bk.booking?.pickupDate || "Scheduled"}</td>
                          <td className="p-2.5 font-bold text-emerald-700">₹{bk.amount || 0}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                              {bk.pickupStatus || "Confirmed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {getCustomerBookings(selectedCustomerDossier).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            No reservations on record yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerDossier(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 12. DRIVER DOSSIER DETAIL MODAL */}
        {selectedDriverDossier && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  {selectedDriverDossier.profilePhoto ? (
                    <img
                      src={selectedDriverDossier.profilePhoto}
                      alt={selectedDriverDossier.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-500 shadow"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xl shadow">
                      {(selectedDriverDossier.name || "D")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      <span>{selectedDriverDossier.name || selectedDriverDossier.username}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                        Driver Chauffeur File
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Residential Address: {selectedDriverDossier.address || "Hyderabad, Telangana"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDriverDossier(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sensitive Verification Credentials (Requirement 10 & 12) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-amber-800 block text-[10px] uppercase font-bold">
                    Official Aadhaar Number (Admin Authorized)
                  </span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5 flex items-center justify-between">
                    <span>{selectedDriverDossier.aadhaarNumber || "Verified"}</span>
                    {selectedDriverDossier.aadhaarNumber && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedDriverDossier.aadhaarNumber);
                          showFeedback("Aadhaar copied");
                        }}
                        className="text-amber-700 hover:text-amber-900"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-blue-800 block text-[10px] uppercase font-bold">
                    Commercial Driving License (DL)
                  </span>
                  <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {selectedDriverDossier.drivingLicenseNumber || "DL Verified"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Mobile Number</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    +91 {selectedDriverDossier.mobileNumber}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Alternate Mobile Number</span>
                  <p className="font-mono font-bold text-slate-900 mt-0.5">
                    {selectedDriverDossier.alternateMobileNumber ? `+91 ${selectedDriverDossier.alternateMobileNumber}` : "Not provided"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Fleet Vehicle</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {selectedDriverDossier.assignedVehicle || "Pending vehicle assignment from fleet"}
                  </p>
                </div>
              </div>

              {/* Driver Ride History */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Assigned Rides History ({getDriverBookings(selectedDriverDossier).length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px]">
                      <tr>
                        <th className="p-2.5">Trip Ref</th>
                        <th className="p-2.5">Customer</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Pickup Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getDriverBookings(selectedDriverDossier).map((rd, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono">{rd.paymentId?.slice(0, 10)}...</td>
                          <td className="p-2.5 font-semibold text-slate-800">{rd.booking?.customer?.name || "Customer"}</td>
                          <td className="p-2.5 text-slate-500">{rd.booking?.pickupDate}</td>
                          <td className="p-2.5 font-bold text-purple-700">{rd.pickupStatus || "Assigned"}</td>
                        </tr>
                      ))}
                      {getDriverBookings(selectedDriverDossier).length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400">
                            No rides completed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateDriverStatus(
                      selectedDriverDossier._id || selectedDriverDossier.username,
                      selectedDriverDossier.status === "Active" ? "Suspended" : "Active"
                    )
                  }
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                    selectedDriverDossier.status === "Active"
                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {selectedDriverDossier.status === "Active" ? "Suspend Driver" : "Approve & Activate Driver"}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDriverDossier(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ADMIN OPERATIONS & APPROVAL POWER COMMAND CENTER MODAL */}
        {selectedOperationOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base tracking-tight">
                        Car Application Operations & Approval Desk
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Admin Authority Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Ref ID: #{selectedOperationOrder.paymentId} &bull; Booking Type:{" "}
                      {selectedOperationOrder.bookingWay === "confirm_25"
                        ? "25% Advance Booking"
                        : selectedOperationOrder.bookingWay === "hold_24h"
                        ? "24-Hour Hold"
                        : "Standard"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportSingleDossier(selectedOperationOrder)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    title="Export Complete Booking Dossier Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="hidden sm:inline">Export Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPdfVoucher(selectedOperationOrder)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                    title="Download PDF Booking Confirmation Voucher"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF Voucher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOperationOrder(null)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`px-6 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 border-b shrink-0 ${
                  selectedOperationOrder.verified ||
                  selectedOperationOrder.status === "success" ||
                  selectedOperationOrder.approvalStatus === "APPROVED"
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : selectedOperationOrder.status === "rejected" ||
                      selectedOperationOrder.approvalStatus === "REJECTED"
                    ? "bg-red-50 text-red-900 border-red-200"
                    : "bg-amber-50 text-amber-900 border-amber-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  {selectedOperationOrder.verified ||
                  selectedOperationOrder.status === "success" ||
                  selectedOperationOrder.approvalStatus === "APPROVED" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        APPROVED by {selectedOperationOrder.approvedBy || "Admin Operations"} on{" "}
                        {selectedOperationOrder.approvedAt
                          ? new Date(selectedOperationOrder.approvedAt).toLocaleString("en-IN")
                          : "Official Record"}
                      </span>
                    </>
                  ) : selectedOperationOrder.status === "rejected" ||
                    selectedOperationOrder.approvalStatus === "REJECTED" ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        REJECTED: "{selectedOperationOrder.rejectionReason || "UTR verification mismatch"}"
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      <span>
                        PENDING APPROVAL: User applied to car &bull; Awaiting Administrator Verification Decision
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-500">
                    Pickup: {selectedOperationOrder.pickupStatus || "Pickup Requested"}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Deposit: {selectedOperationOrder.depositRefunded ? "Refunded" : "Active (₹3,000)"}
                  </span>
                </div>
              </div>

              {/* Scrollable Operations Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-xs">
                {/* 3-Column Operations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Column 1: Applied Car & Reservation Specs (4 cols) */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Applied Vehicle Specs
                        </span>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {selectedOperationOrder.carRegistrationNumber || selectedOperationOrder.carRegistration || "TS 09 EZ 4082"}
                        </span>
                      </div>

                      <div>
                        <p className="font-black text-slate-900 text-base">
                          {typeof selectedOperationOrder.booking?.car === "object"
                            ? `${selectedOperationOrder.booking.car.brand || ""} ${selectedOperationOrder.booking.car.model || ""}`.trim()
                            : selectedOperationOrder.booking?.car || "Rydex Vehicle"}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-bold">
                            {selectedOperationOrder.booking?.car?.seats || 5} Seats
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-bold">
                            {selectedOperationOrder.booking?.car?.fuel || "Petrol"}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 text-[10px] font-bold">
                            {selectedOperationOrder.booking?.withDriver ? "Chauffeur Driven" : "Self-Drive"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 space-y-1 text-[11px]">
                        <div className="flex justify-between text-slate-600">
                          <span>Pickup Date:</span>
                          <span className="font-bold text-slate-900">
                            {selectedOperationOrder.booking?.pickupDate} at {selectedOperationOrder.booking?.pickupTime}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Return Date:</span>
                          <span className="font-bold text-slate-900">
                            {selectedOperationOrder.booking?.dropoffDate || selectedOperationOrder.booking?.returnDate || "N/A"} at{" "}
                            {selectedOperationOrder.booking?.dropoffTime || selectedOperationOrder.booking?.returnTime || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Handover Location:</span>
                          <span className="font-semibold text-slate-900 text-right">
                            {selectedOperationOrder.booking?.pickupLocation ||
                              selectedOperationOrder.booking?.hub ||
                              selectedOperationOrder.booking?.deliveryLocation ||
                              "Madhapur Hub"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Customer Dossier */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Applicant Customer Dossier
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Verified Applicant
                        </span>
                      </div>

                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">
                          {selectedOperationOrder.booking?.customer?.name || selectedOperationOrder.customerName || "Customer"}
                        </p>
                        <p className="text-slate-600 mt-0.5">
                          Mobile: <strong className="font-mono text-slate-900">+91 {selectedOperationOrder.booking?.customer?.phone || selectedOperationOrder.customerMobile || "N/A"}</strong>
                        </p>
                        {selectedOperationOrder.booking?.customer?.alternateMobile && (
                          <p className="text-slate-500 text-[11px]">
                            Alt: +91 {selectedOperationOrder.booking.customer.alternateMobile}
                          </p>
                        )}
                        <p className="text-slate-500 text-[11px]">
                          Email: {selectedOperationOrder.booking?.customer?.email || "On file"}
                        </p>
                        {selectedOperationOrder.booking?.customer?.dl && (
                          <p className="text-slate-600 font-mono text-[11px] mt-1">
                            DL: {selectedOperationOrder.booking.customer.dl}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:+91${selectedOperationOrder.booking?.customer?.phone || selectedOperationOrder.customerMobile}`}
                          className="flex-1 py-1.5 text-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 font-bold text-[11px] transition flex items-center justify-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3" /> Call
                        </a>
                        <a
                          href={`https://wa.me/91${selectedOperationOrder.booking?.customer?.phone || selectedOperationOrder.customerMobile}?text=Hello%20${encodeURIComponent(
                            selectedOperationOrder.booking?.customer?.name || ""
                          )},%20this%20is%20Rydex%20Car%20Rental%20Hyderabad%20regarding%20your%20car%20application.`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 text-center bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 font-bold text-[11px] transition flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* Financial Snapshot & UTR */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                        Payment & UTR Verification
                      </span>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Bank UTR Reference</span>
                          <code className="font-mono font-black text-xs text-blue-700">
                            {selectedOperationOrder.utrId || selectedOperationOrder.utrNumber || "Verified Gateway"}
                          </code>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyUtr(selectedOperationOrder.utrId || selectedOperationOrder.utrNumber)}
                          className="px-2 py-1 text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>

                      <div className="space-y-1 text-[11px] pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total Booking Cost:</span>
                          <span className="font-bold text-slate-900">₹{selectedOperationOrder.totalAmount || selectedOperationOrder.booking?.total || 0}</span>
                        </div>
                        <div className="flex justify-between text-blue-700 font-bold">
                          <span>Advance Paid:</span>
                          <span>₹{selectedOperationOrder.amount || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                          <span>Balance at Handover:</span>
                          <span className="font-bold text-slate-900">₹{selectedOperationOrder.remainingAtPickup || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Admin Approval Power Desk (4 cols) */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-indigo-100 pb-3">
                        <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                            Approval Power Desk
                          </h4>
                          <p className="text-[11px] text-slate-500">Official Operations Executive Authority</p>
                        </div>
                      </div>

                      {/* Approval Action Buttons */}
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => handleApproveBooking(
                            selectedOperationOrder.paymentId,
                            operationNote || "Application approved & vehicle allocated by Operations Desk",
                            selectedOperationOrder.driver || { name: operationDriverSelection, phone: "+91 98765 43210" }
                          )}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs transition shadow-sm flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve Application & Confirm Car</span>
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleRejectTransaction(selectedOperationOrder.paymentId)}
                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Flag / Reject</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetOrderToReview(selectedOperationOrder.paymentId)}
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-1.5"
                            title="Reset application to pending review"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Reset Review</span>
                          </button>
                        </div>
                      </div>

                      {/* Admin Operational Notes Form */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <label className="text-[11px] font-extrabold uppercase text-slate-600 tracking-wider block">
                          Operational Remarks & Ledger Notes:
                        </label>
                        <textarea
                          rows={3}
                          value={operationNote}
                          onChange={(e) => setOperationNote(e.target.value)}
                          placeholder="Add operational notes (e.g. UTR verified in HDFC account, vehicle inspected, customer briefed)..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveAdminNotes(selectedOperationOrder.paymentId, operationNote)}
                          className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save & Log Notes to History</span>
                        </button>
                      </div>
                    </div>

                    {/* Security Deposit Management */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Security Deposit Desk (₹3,000)
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            selectedOperationOrder.depositRefunded
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {selectedOperationOrder.depositRefunded ? "Refunded / Cleared" : "Held / Active"}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600">
                        {selectedOperationOrder.depositRefunded
                          ? "Security deposit has been cleared and refunded back to customer upon return inspection."
                          : "Deposit is currently held. Inspect vehicle exterior, odometer, and fuel before refunding."}
                      </p>

                      {!selectedOperationOrder.depositRefunded && (
                        <button
                          type="button"
                          onClick={() => handleRefundDeposit(selectedOperationOrder.paymentId)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Refund Deposit & Complete Trip</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Fleet & Chauffeur Operations (4 cols) */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Car Pickup Workflow Stepper */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Car Pickup Workflow
                        </span>
                        <span className="font-bold text-xs text-indigo-700">
                          {selectedOperationOrder.pickupStatus || "Pickup Requested"}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {PICKUP_STATUS_STEPS.map((step, idx) => {
                          const isCurrent = (selectedOperationOrder.pickupStatus || "Pickup Requested") === step;
                          return (
                            <button
                              key={step}
                              type="button"
                              onClick={() => handleUpdatePickupStatus(selectedOperationOrder.paymentId, step)}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                                isCurrent
                                  ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                    isCurrent ? "bg-white text-indigo-700" : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                                <span>{step}</span>
                              </div>
                              {isCurrent && <Check className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Chauffeur Assignment */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                          Chauffeur / Driver Assignment
                        </span>
                        <span className="text-[10px] font-bold text-slate-700">
                          {selectedOperationOrder.driver?.name || "Ramesh Kumar"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <select
                          value={operationDriverSelection}
                          onChange={(e) => setOperationDriverSelection(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                        >
                          <option value="Ramesh Kumar">Ramesh Kumar (+91 98765 43210)</option>
                          <option value="Suresh Reddy">Suresh Reddy (+91 98765 43211)</option>
                          <option value="Vijay Kumar">Vijay Kumar (+91 98765 43212)</option>
                          <option value="Mohammed Imran">Mohammed Imran (+91 98765 43213)</option>
                          {driversList.map((d) => (
                            <option key={d._id || d.username} value={d.name || d.username}>
                              {d.name || d.username} ({d.mobileNumber ? `+91 ${d.mobileNumber}` : "Driver"})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const foundDriver = driversList.find((d) => (d.name || d.username) === operationDriverSelection);
                            const driverObj = foundDriver
                              ? {
                                  name: foundDriver.name || foundDriver.username,
                                  phone: foundDriver.mobileNumber ? `+91 ${foundDriver.mobileNumber}` : "+91 98765 43210",
                                  licenseNumber: foundDriver.drivingLicenseNumber || "TS-09-2018-0048291",
                                }
                              : {
                                  name: operationDriverSelection,
                                  phone: "+91 98765 43210",
                                  licenseNumber: "TS-09-2018-0048291",
                                };
                            handleAssignDriverToBooking(selectedOperationOrder.paymentId, driverObj);
                          }}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Dispatch Chauffeur</span>
                        </button>
                      </div>
                    </div>

                    {/* Vehicle Plate Reallocation */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                        Vehicle Plate Allocation
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={operationCarSelection}
                          onChange={(e) => setOperationCarSelection(e.target.value.toUpperCase())}
                          placeholder="e.g. TS 09 EZ 4082"
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleReassignCarToBooking(selectedOperationOrder.paymentId, operationCarSelection)}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                        >
                          Reallocate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Trail of Administrative Actions for this Booking */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>Administrative Audit Ledger for #{selectedOperationOrder.paymentId}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Auto-recorded & exported to Excel
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold text-[10px]">
                        <tr>
                          <th className="p-2.5">Time</th>
                          <th className="p-2.5">Operation</th>
                          <th className="p-2.5">Operator</th>
                          <th className="p-2.5">Status Transition</th>
                          <th className="p-2.5">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs
                          .filter((l) => l.orderId === selectedOperationOrder.paymentId)
                          .map((log, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-mono text-[11px] text-slate-500">
                                {log.timestamp || log.createdAt
                                  ? new Date(log.timestamp || log.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    })
                                  : "Recent"}
                              </td>
                              <td className="p-2.5 font-bold text-slate-800">
                                <span className="px-2 py-0.5 rounded bg-slate-100 border text-[10px]">
                                  {log.actionType}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-600">{log.adminUser || "Admin Operations"}</td>
                              <td className="p-2.5 font-medium text-indigo-700">
                                {log.newStatus || "Updated"}
                              </td>
                              <td className="p-2.5 text-slate-500 max-w-xs truncate">{log.notes || "-"}</td>
                            </tr>
                          ))}
                        {auditLogs.filter((l) => l.orderId === selectedOperationOrder.paymentId).length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-slate-400">
                              Application recorded. Additional operational actions will appear in this timeline and Excel report.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500 font-mono">
                  Rydex Chief Operations &bull; Real-time MongoDB & Excel Sync
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedOperationOrder(null)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  Close Command Center
                </button>
              </div>
            </div>
          </div>
        )}

        {/* In-Page Interactive Rejection Modal (no window.prompt) */}
        {rejectModalOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Reject / Flag Booking</h3>
                    <p className="text-[11px] text-slate-500 font-mono">Ref: #{rejectModalOrder.paymentId}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRejectModalOrder(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Quick Reason Selection:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "UTR not reflected in Rydex bank statement",
                      "Invalid / mismatched payment amount",
                      "Duplicate transaction reference",
                      "Customer requested cancellation",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setRejectionReasonText(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition ${
                          rejectionReasonText === preset
                            ? "bg-red-50 border-red-300 text-red-700 font-bold"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Detailed Reason / Customer Notice:
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    placeholder="Explain why this transaction was rejected so customer can correct it..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    This updates the customer's portal in real-time, marks the status as Rejected, and allows them to re-submit their valid UTR.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalOrder(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmRejection}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
