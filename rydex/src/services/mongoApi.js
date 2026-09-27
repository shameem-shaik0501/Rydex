// MongoDB Integration Service for Rydex

const API_BASE = "/api";

export const mongoApi = {
  checkStatus: async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error("Status check failed");
      return await res.json();
    } catch (e) {
      console.warn("MongoDB status check:", e.message);
      return { status: "disconnected", error: e.message };
    }
  },

  // Orders
  getOrders: async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) {
        const orders = await res.json();
        if (Array.isArray(orders) && orders.length > 0) {
          localStorage.setItem("all_orders", JSON.stringify(orders));
          return orders;
        }
      }
    } catch (e) {
      console.warn("MongoDB getOrders fallback:", e.message);
    }
    try {
      const cached = localStorage.getItem("all_orders");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  saveOrder: async (order) => {
    try {
      const raw = localStorage.getItem("all_orders");
      const list = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(
        (o) => o.paymentId === order.paymentId || (o._id && o._id === order._id)
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...order };
      } else {
        list.unshift(order);
      }
      localStorage.setItem("all_orders", JSON.stringify(list));
      localStorage.setItem("paymentData", JSON.stringify(order));
    } catch (err) {
      console.error("Local storage error:", err);
    }

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("MongoDB saveOrder error:", e.message);
    }
    return order;
  },

  updateOrder: async (id, updateData) => {
    try {
      const raw = localStorage.getItem("all_orders");
      if (raw) {
        const list = JSON.parse(raw);
        const idx = list.findIndex(
          (o) => o.paymentId === id || o._id === id || String(o.id) === String(id)
        );
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updateData };
          localStorage.setItem("all_orders", JSON.stringify(list));
        }
      }
    } catch (err) {
      console.error(err);
    }

    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("MongoDB updateOrder error:", e.message);
    }
    return updateData;
  },

  // 13. Car Pickup Status
  updatePickupStatus: async (orderId, pickupStatus) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/pickup-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupStatus }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("updatePickupStatus error:", e.message);
    }
    return null;
  },

  // Admin Approval Power APIs
  approveOrder: async (orderId, { adminUser = "Admin (Chief Operations)", notes = "Application approved & vehicle allocated", driver } = {}) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser, notes, driver }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("approveOrder error:", e.message);
    }
    return null;
  },

  rejectOrder: async (orderId, { adminUser = "Admin (Chief Operations)", reason = "UTR verification mismatch" } = {}) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser, reason }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("rejectOrder error:", e.message);
    }
    return null;
  },

  assignDriver: async (orderId, driver, adminUser = "Admin (Chief Operations)") => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/assign-driver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driver, adminUser }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("assignDriver error:", e.message);
    }
    return null;
  },

  refundDeposit: async (orderId, { adminUser = "Admin (Chief Operations)", notes = "Deposit cleared upon inspection" } = {}) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/refund-deposit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser, notes }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("refundDeposit error:", e.message);
    }
    return null;
  },

  // Audit Logs API
  getAuditLogs: async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("getAuditLogs error:", e.message);
    }
    try {
      const cached = localStorage.getItem("admin_audit_logs");
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return [];
  },

  addAuditLog: async (logData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("addAuditLog error:", e.message);
    }
    return null;
  },

  deleteOrder: async (id) => {
    try {
      const raw = localStorage.getItem("all_orders");
      if (raw) {
        const list = JSON.parse(raw);
        const filtered = list.filter(
          (o) => o.paymentId !== id && o._id !== id && String(o.id) !== String(id)
        );
        localStorage.setItem("all_orders", JSON.stringify(filtered));
      }
    } catch (err) {
      console.error(err);
    }

    try {
      await fetch(`${API_BASE}/orders/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("MongoDB deleteOrder error:", e.message);
    }
  },

  // 12. User Management
  getUsers: async (role = null) => {
    try {
      const url = role ? `${API_BASE}/users?role=${role}` : `${API_BASE}/users`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("MongoDB getUsers error:", e.message);
    }
    try {
      const cached = localStorage.getItem("registered_customers");
      const parsed = cached ? JSON.parse(cached) : [];
      if (role) return parsed.filter((u) => u.role === role);
      return parsed;
    } catch {
      return [];
    }
  },

  getAdminUsers: async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("getAdminUsers error:", e.message);
    }
    try {
      const cached = localStorage.getItem("registered_customers");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  updateUserStatus: async (userId, statusData) => {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("updateUserStatus error:", e.message);
    }
    return null;
  },

  registerUser: async (userData) => {
    try {
      const raw = localStorage.getItem("registered_customers");
      const list = raw ? JSON.parse(raw) : [];
      const filtered = list.filter((u) => u.username !== userData.username);
      filtered.push(userData);
      localStorage.setItem("registered_customers", JSON.stringify(filtered));
    } catch (err) {
      console.error(err);
    }

    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("MongoDB registerUser error:", e.message);
    }
    return userData;
  },

  loginUser: async (identifier, password) => {
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("MongoDB loginUser error:", e.message);
    }
    return null;
  },

  // Fleet Cars
  getCars: async () => {
    try {
      const res = await fetch(`${API_BASE}/cars`);
      if (res.ok) {
        const cars = await res.json();
        if (Array.isArray(cars) && cars.length > 0) {
          localStorage.setItem("rydex_fleet_cars", JSON.stringify(cars));
          return cars;
        }
      }
    } catch (e) {
      console.warn("MongoDB getCars error:", e.message);
    }
    return null;
  },

  syncCars: async (carsList) => {
    try {
      await fetch(`${API_BASE}/cars/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(carsList),
      });
    } catch (e) {
      console.warn("MongoDB syncCars error:", e.message);
    }
  },

  // Locations
  getLocations: async () => {
    try {
      const res = await fetch(`${API_BASE}/locations`);
      if (res.ok) {
        const locs = await res.json();
        if (Array.isArray(locs) && locs.length > 0) {
          localStorage.setItem("locations_admin", JSON.stringify(locs));
          return locs;
        }
      }
    } catch (e) {
      console.warn("MongoDB getLocations error:", e.message);
    }
    return null;
  },

  syncLocations: async (locsList) => {
    try {
      await fetch(`${API_BASE}/locations/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locsList),
      });
    } catch (e) {
      console.warn("MongoDB syncLocations error:", e.message);
    }
  },
};

export default mongoApi;
