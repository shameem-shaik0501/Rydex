import express from "express";
import cors from "cors";
import path from "node:path";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://shameemshaik0501_db_user:dO0vbJltxc3EGEFD@cluster0.opol09p.mongodb.net/rydex?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// MongoDB Connection
mongoose.set("bufferCommands", false); // fail fast, don't hang
let isMongoConnected = false;

async function connectMongo() {
  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "rydex",
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log("✅ Successfully connected to MongoDB Atlas (database: rydex)");
  } catch (error) {
    isMongoConnected = false;
    console.error("❌ MongoDB connection error:", (error as Error).message);
  }
}

connectMongo();

mongoose.connection.on("connected", () => {
  isMongoConnected = true;
});

mongoose.connection.on("disconnected", () => {
  isMongoConnected = false;
  console.warn("⚠️ MongoDB disconnected, attempting reconnect...");
  setTimeout(connectMongo, 5000);
});

// Schemas & Models
const OrderSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true, index: true },
    bookingWay: { type: String },
    bookingWayLabel: { type: String },
    amount: { type: Number },
    advanceAmount: { type: Number },
    totalBookingAmount: { type: Number },
    total: { type: Number },
    remainingAtPickup: { type: Number },
    method: { type: String, default: "upi" },
    status: { type: String, default: "pending_admin" },
    verified: { type: Boolean, default: false },
    adminReviewState: { type: String, default: "Pending Manual Review" },
    rejectionReason: { type: String, default: "" },
    customerUser: { type: String },
    booking: { type: mongoose.Schema.Types.Mixed },
    car: { type: String },
    carImage: { type: String },
    registrationNumber: { type: String },
    utrId: { type: String },
    bookingNote: { type: String },
    qrCodeUrl: { type: String },
    expiresAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
    timestamp: { type: String },
    // 13. Car Pickup Workflow
    pickupStatus: {
      type: String,
      enum: ["Pickup Requested", "Pickup Confirmed", "Ready for Pickup", "Picked Up", "Completed"],
      default: "Pickup Requested",
    },
    // Admin Approval & Governance (Requirement)
    approvalStatus: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "PENDING_APPROVAL",
    },
    approvedBy: { type: String, default: "" },
    approvedAt: { type: Date },
    adminNotes: { type: String, default: "" },
    depositRefunded: { type: Boolean, default: false },
    // 14. User Location
    userLocation: { type: mongoose.Schema.Types.Mixed },
    driver: { type: mongoose.Schema.Types.Mixed },
    carDetails: { type: mongoose.Schema.Types.Mixed },
    carTracking: { type: mongoose.Schema.Types.Mixed },
    tripStatus: { type: String, default: "Confirmed" },
  },
  { timestamps: true }
);

// Admin Governance & Approval Audit Trail Schema
const AuditLogSchema = new mongoose.Schema(
  {
    logId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, index: true },
    customerName: { type: String },
    customerPhone: { type: String },
    carModel: { type: String },
    carRegistration: { type: String },
    actionType: { type: String, required: true }, // "APPLICATION_SUBMITTED", "APPLICATION_APPROVED", "APPLICATION_REJECTED", "STATUS_UPDATED", "DRIVER_ASSIGNED", "CAR_REASSIGNED", "DEPOSIT_REFUNDED"
    previousStatus: { type: String },
    newStatus: { type: String },
    adminUser: { type: String, default: "Admin (Operations)" },
    notes: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    email: { type: String, index: true },
    mobileNumber: { type: String, required: true, index: true },
    alternateMobileNumber: { type: String, default: "" },
    profilePhoto: { type: String, default: "" },
    password: { type: String },
    role: { type: String, enum: ["customer", "driver", "admin"], default: "customer" },
    address: { type: String, default: "" },
    // Driver sensitive fields (Req 10)
    aadhaarNumber: { type: String, default: "" },
    drivingLicenseNumber: { type: String, default: "" },
    assignedVehicle: { type: String, default: "" },
    status: { type: String, default: "Active" }, // "Active", "Pending Approval", "Suspended"
    verified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CarSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    brand: { type: String },
    model: { type: String },
    year: { type: Number },
    registrationNumber: { type: String, default: "" },
    seats: { type: Number, enum: [5, 7], default: 5 }, // 1. strictly 5 or 7 (incl. driver)
    fuel: { type: String },
    color: { type: String },
    price: { type: Number },
    hourlyPrice: { type: Number },
    pickupFee: { type: Number },
    image: { type: String },
    rating: { type: Number, default: 4.8 },
    reviewsCount: { type: Number, default: 120 },
    features: [{ type: String }],
    ac: { type: Boolean, default: true }, // 7. AC / Non-AC
    mileage: { type: Number }, // 8. Mileage
    fuelPolicy: { type: String, default: "Full-to-Full" },
    driverOptions: [{ type: String }],
    popularity: { type: Number, default: 90 },
    pickup: [{ type: String }],
    engine: { type: String },
    power: { type: String },
    bootSpace: { type: String },
    fuelTank: { type: String },
    description: { type: String },
    isAvailable: { type: Boolean, default: true },
    // Car Station Location (Base Depot)
    currentLocation: {
      latitude: { type: Number, default: 17.4485 },
      longitude: { type: Number, default: 78.3756 },
      address: { type: String, default: "Hitec City / Cyber Towers, Hyderabad" },
      status: { type: String, default: "Stationary" },
      speed: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

const LocationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    city: { type: String, default: "Hyderabad" },
    name: { type: String },
    address: { type: String },
    deliveryCharge: { type: Number, default: 0 },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("Order", OrderSchema);
const UserModel = mongoose.model("User", UserSchema);
const CarModel = mongoose.model("Car", CarSchema);
const LocationModel = mongoose.model("Location", LocationSchema);
const AuditLogModel = mongoose.model("AuditLog", AuditLogSchema);

// Audit Logging Service for Administrative Operations
async function logAuditAction(data: {
  orderId?: string;
  customerName?: string;
  customerPhone?: string;
  carModel?: string;
  carRegistration?: string;
  actionType: string;
  previousStatus?: string;
  newStatus?: string;
  adminUser?: string;
  notes?: string;
}) {
  try {
    if (!isMongoConnected) return null;
    const logId = `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const entry = await AuditLogModel.create({
      logId,
      timestamp: new Date(),
      ...data,
    });
    return entry;
  } catch (e) {
    console.warn("[AUDIT LOG ERROR]", (e as Error).message);
    return null;
  }
}

// API Routes

// Health / Status Check
app.get("/api/status", async (_req, res) => {
  try {
    const ordersCount = isMongoConnected ? await OrderModel.countDocuments() : 0;
    const usersCount = isMongoConnected ? await UserModel.countDocuments() : 0;
    const carsCount = isMongoConnected ? await CarModel.countDocuments() : 0;
    const locationsCount = isMongoConnected ? await LocationModel.countDocuments() : 0;

    res.json({
      status: isMongoConnected ? "connected" : "connecting",
      database: "rydex",
      mongodbUri: MONGODB_URI.replace(/:([^@]+)@/, ":****@"),
      counts: {
        orders: ordersCount,
        users: usersCount,
        cars: carsCount,
        locations: locationsCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Orders API
app.get("/api/orders", async (_req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const orderData = req.body;
    if (!orderData || !orderData.paymentId) {
      return res.status(400).json({ error: "Missing paymentId in order data" });
    }

    const order = await OrderModel.findOneAndUpdate(
      { paymentId: orderData.paymentId },
      { $set: orderData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Audit log application submission
    const cName = orderData.booking?.customer?.name || orderData.customerName || "Customer";
    const cPhone = orderData.booking?.customer?.phone || orderData.customerMobile || "";
    const carName = typeof orderData.booking?.car === "object"
      ? `${orderData.booking.car.brand || ""} ${orderData.booking.car.model || ""}`.trim()
      : orderData.booking?.car || "Vehicle";

    await logAuditAction({
      orderId: orderData.paymentId,
      customerName: cName,
      customerPhone: cPhone,
      carModel: carName,
      carRegistration: orderData.carRegistrationNumber || orderData.carRegistration || "TS 09 EZ 4082",
      actionType: "APPLICATION_SUBMITTED",
      previousStatus: "New Application",
      newStatus: orderData.pickupStatus || "Pickup Requested",
      adminUser: "System (Self-Service)",
      notes: `User applied for ${carName} (${orderData.bookingWay || "Standard"}). Advance: ₹${orderData.amount || 0}`,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Admin Approval Power: Approve Application
app.put("/api/orders/:id/approve", async (req, res) => {
  try {
    if (!isMongoConnected) return res.status(503).json({ error: "DB not connected" });
    const id = req.params.id;
    const { adminUser = "Admin (Operations)", notes = "Application approved & vehicle allocated", driver } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { paymentId: id }] }
      : { paymentId: id };

    const updatePayload: any = {
      verified: true,
      status: "success",
      approvalStatus: "APPROVED",
      pickupStatus: "Pickup Confirmed",
      adminReviewState: "Verified by Operations Desk",
      approvedBy: adminUser,
      approvedAt: new Date(),
      adminNotes: notes,
    };

    if (driver) {
      updatePayload.driver = driver;
    }

    const updated = await OrderModel.findOneAndUpdate(query, { $set: updatePayload }, { new: true });
    if (!updated) return res.status(404).json({ error: "Order not found" });

    const cName = updated.booking?.customer?.name || "Customer";
    const carName = typeof updated.booking?.car === "object"
      ? `${updated.booking.car.brand} ${updated.booking.car.model}`
      : updated.booking?.car || "Vehicle";

    await logAuditAction({
      orderId: updated.paymentId,
      customerName: cName,
      customerPhone: updated.booking?.customer?.phone || "",
      carModel: carName,
      carRegistration: updated.carRegistration || "TS 09 EZ 4082",
      actionType: "APPLICATION_APPROVED",
      previousStatus: "Pending Verification",
      newStatus: "Pickup Confirmed",
      adminUser,
      notes,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Admin Approval Power: Reject Application
app.put("/api/orders/:id/reject", async (req, res) => {
  try {
    if (!isMongoConnected) return res.status(503).json({ error: "DB not connected" });
    const id = req.params.id;
    const { adminUser = "Admin (Operations)", reason = "UTR verification failed or document mismatch" } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { paymentId: id }] }
      : { paymentId: id };

    const updated = await OrderModel.findOneAndUpdate(
      query,
      {
        $set: {
          verified: false,
          status: "rejected",
          approvalStatus: "REJECTED",
          adminReviewState: "Flagged / Rejected",
          rejectionReason: reason,
          adminNotes: `Rejected by ${adminUser}: ${reason}`,
        },
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Order not found" });

    const cName = updated.booking?.customer?.name || "Customer";
    const carName = typeof updated.booking?.car === "object"
      ? `${updated.booking.car.brand} ${updated.booking.car.model}`
      : updated.booking?.car || "Vehicle";

    await logAuditAction({
      orderId: updated.paymentId,
      customerName: cName,
      customerPhone: updated.booking?.customer?.phone || "",
      carModel: carName,
      carRegistration: updated.carRegistration || "TS 09 EZ 4082",
      actionType: "APPLICATION_REJECTED",
      previousStatus: "Pending Verification",
      newStatus: "Rejected",
      adminUser,
      notes: reason,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Admin Operation: Assign Chauffeur / Driver
app.put("/api/orders/:id/assign-driver", async (req, res) => {
  try {
    if (!isMongoConnected) return res.status(503).json({ error: "DB not connected" });
    const id = req.params.id;
    const { driver, adminUser = "Admin (Operations)" } = req.body;
    if (!driver || !driver.name) return res.status(400).json({ error: "Driver details required" });

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { paymentId: id }] }
      : { paymentId: id };

    const updated = await OrderModel.findOneAndUpdate(
      query,
      { $set: { driver } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Order not found" });

    await logAuditAction({
      orderId: updated.paymentId,
      customerName: updated.booking?.customer?.name || "Customer",
      customerPhone: updated.booking?.customer?.phone || "",
      carModel: typeof updated.booking?.car === "object" ? `${updated.booking.car.brand} ${updated.booking.car.model}` : "Vehicle",
      actionType: "DRIVER_ASSIGNED",
      newStatus: `Chauffeur: ${driver.name}`,
      adminUser,
      notes: `Driver ${driver.name} (${driver.phone}) assigned to reservation.`,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Admin Operation: Refund / Clear Security Deposit
app.put("/api/orders/:id/refund-deposit", async (req, res) => {
  try {
    if (!isMongoConnected) return res.status(503).json({ error: "DB not connected" });
    const id = req.params.id;
    const { adminUser = "Admin (Operations)", notes = "Security deposit cleared after vehicle inspection" } = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { paymentId: id }] }
      : { paymentId: id };

    const updated = await OrderModel.findOneAndUpdate(
      query,
      { $set: { depositRefunded: true, tripStatus: "Completed" } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Order not found" });

    await logAuditAction({
      orderId: updated.paymentId,
      customerName: updated.booking?.customer?.name || "Customer",
      actionType: "DEPOSIT_REFUNDED",
      newStatus: "Deposit Cleared",
      adminUser,
      notes,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const id = req.params.id;
    const updateData = req.body;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { paymentId: id }] }
      : { paymentId: id };

    const updated = await OrderModel.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 13. Car Pickup Status API
app.put("/api/orders/:id/pickup-status", async (req, res) => {
  try {
    if (!isMongoConnected) return res.status(503).json({ error: "DB not connected" });
    const { pickupStatus } = req.body;
    const validStatuses = [
      "Pickup Requested",
      "Pickup Confirmed",
      "Ready for Pickup",
      "Picked Up",
      "Completed",
    ];

    if (!validStatuses.includes(pickupStatus)) {
      return res.status(400).json({ error: "Invalid pickup status" });
    }

    const id = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { paymentId: id }] }
      : { paymentId: id };

    const updated = await OrderModel.findOneAndUpdate(
      query,
      { $set: { pickupStatus, tripStatus: pickupStatus } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Order not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const id = req.params.id;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { paymentId: id }] }
      : { paymentId: id };

    await OrderModel.findOneAndDelete(query);
    res.json({ success: true, message: "Order deleted" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// 12. Complete Admin User Management (Customers & Drivers)
app.get("/api/users", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const roleFilter = req.query.role;
    const filter = roleFilter ? { role: roleFilter } : {};
    const users = await UserModel.find(filter).select("-password").sort({ createdAt: -1 });

    // For public users endpoint, mask Aadhaar numbers for security
    const safeUsers = users.map((u) => {
      const obj = u.toObject();
      if (obj.aadhaarNumber && obj.aadhaarNumber.length >= 4) {
        obj.aadhaarNumber = "XXXX-XXXX-" + obj.aadhaarNumber.slice(-4);
      }
      return obj;
    });

    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Admin endpoint with full sensitive document view for authorized admins
app.get("/api/admin/users", async (_req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const users = await UserModel.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/api/admin/users/:id/status", async (req, res) => {
  try {
    if (!isMongoConnected) return res.status(503).json({ error: "DB not connected" });
    const { status, assignedVehicle } = req.body;
    const id = req.params.id;

    const updated = await UserModel.findByIdAndUpdate(
      id,
      { $set: { status, assignedVehicle } },
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/users/register", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const {
      username,
      name,
      email,
      mobileNumber,
      alternateMobileNumber,
      profilePhoto,
      password,
      role,
      address,
      aadhaarNumber,
      drivingLicenseNumber,
    } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const existingUser = await UserModel.findOne({
      $or: [
        { username: username.toLowerCase().trim() },
        { mobileNumber: mobileNumber ? mobileNumber.trim() : "__none__" },
      ],
    });

    if (existingUser) {
      existingUser.name = name || existingUser.name;
      existingUser.alternateMobileNumber = alternateMobileNumber || existingUser.alternateMobileNumber;
      existingUser.profilePhoto = profilePhoto || existingUser.profilePhoto;
      existingUser.address = address || existingUser.address;
      if (aadhaarNumber) existingUser.aadhaarNumber = aadhaarNumber;
      if (drivingLicenseNumber) existingUser.drivingLicenseNumber = drivingLicenseNumber;
      if (password) existingUser.password = password;
      await existingUser.save();
      const safe = existingUser.toObject();
      delete (safe as any).password;
      return res.json(safe);
    }

    const newUser = await UserModel.create({
      username: username.trim(),
      name: name || username,
      email: email ? email.trim() : "",
      mobileNumber: mobileNumber ? mobileNumber.trim() : "",
      alternateMobileNumber: alternateMobileNumber ? alternateMobileNumber.trim() : "",
      profilePhoto: profilePhoto || "",
      password: password || "",
      role: role || "customer",
      address: address || "",
      aadhaarNumber: aadhaarNumber || "",
      drivingLicenseNumber: drivingLicenseNumber || "",
      status: role === "driver" ? "Pending Approval" : "Active",
      verified: true,
    });

    const safe = newUser.toObject();
    delete (safe as any).password;
    res.status(201).json(safe);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/users/login", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const { identifier, password } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Identifier is required" });
    }

    const user = await UserModel.findOne({
      $or: [
        { username: new RegExp(`^${identifier.trim()}$`, "i") },
        { mobileNumber: identifier.trim() },
        { email: new RegExp(`^${identifier.trim()}$`, "i") },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.password && password && user.password !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const safe = user.toObject();
    delete (safe as any).password;
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Admin Governance & Audit Logs API
app.get("/api/admin/audit-logs", async (_req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const logs = await AuditLogModel.find().sort({ timestamp: -1 }).limit(500);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/admin/audit-logs", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const logData = req.body;
    const created = await logAuditAction(logData);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Cars API
app.get("/api/cars", async (_req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const cars = await CarModel.find().sort({ id: 1 });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/cars/sync", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const carsList = req.body;
    if (!Array.isArray(carsList)) {
      return res.status(400).json({ error: "Expected an array of cars" });
    }

    for (const car of carsList) {
      if (car.id) {
        // Ensure no transmission or car type
        const { transmission, type, freeCancellation, distanceLimit, ...sanitized } = car;
        await CarModel.findOneAndUpdate(
          { id: car.id },
          { $set: sanitized },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
    const updated = await CarModel.find().sort({ id: 1 });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/api/cars/:id", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const carId = Number(req.params.id);
    const { transmission, type, freeCancellation, distanceLimit, ...sanitized } = req.body;
    const updated = await CarModel.findOneAndUpdate(
      { id: carId },
      { $set: sanitized },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/cars/:id", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const carId = Number(req.params.id);
    await CarModel.findOneAndDelete({ id: carId });
    res.json({ success: true, message: "Car deleted" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Locations API (General Pickup points)
app.get("/api/locations", async (_req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const locations = await LocationModel.find();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/locations/sync", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({ error: "Database not connected yet" });
    }
    const locationsList = req.body;
    if (!Array.isArray(locationsList)) {
      return res.status(400).json({ error: "Expected an array of locations" });
    }

    for (const loc of locationsList) {
      if (loc.id) {
        await LocationModel.findOneAndUpdate(
          { id: loc.id },
          { $set: loc },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
    const updated = await LocationModel.find();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Error handling middleware for Mongoose/DB failures
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    err.name === "MongooseError" ||
    err.name === "MongoNetworkError" ||
    (err.message && err.message.includes("buffering timed out"))
  ) {
    console.warn("[AI Studio] Database offline — handling gracefully");
    if (req.method === "GET") {
      return res.json(req.path.endsWith("s") || req.path.endsWith("s/") ? [] : {});
    }
    return res.status(503).json({ error: "Service temporarily unavailable (database offline)" });
  }
  next(err);
});

// Vite Middleware Setup
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, host: "0.0.0.0", port: PORT },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Rydex server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
