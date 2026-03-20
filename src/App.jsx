import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080/api/rentals";

const initialForm = {
  tenantName: "",
  propertyAddress: "",
  rentAmount: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
  contactPhone: "",
  email: "",
};

const statusColors = {
  ACTIVE: { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  INACTIVE: { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  PENDING: { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" },
};

export default function App() {
  const [rentals, setRentals] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewRental, setViewRental] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchRentals();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      if (res.ok) {
        const data = await res.json();
        setRentals(data);
      }
    } catch {
      // Demo mode: use mock data if backend not connected
      setRentals(mockData);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.tenantName || !form.propertyAddress || !form.rentAmount) {
      showToast("Please fill all required fields", "error");
      return;
    }
    setLoading(true);
    try {
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await fetchRentals();
        showToast(editingId ? "Rental updated successfully!" : "Rental added successfully!");
      }
    } catch {
      // Demo: update local state
      if (editingId) {
        setRentals((prev) => prev.map((r) => (r.id === editingId ? { ...form, id: editingId } : r)));
        showToast("Rental updated successfully!");
      } else {
        const newRental = { ...form, id: Date.now() };
        setRentals((prev) => [...prev, newRental]);
        showToast("Rental added successfully!");
      }
    }
    resetForm();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      await fetchRentals();
    } catch {
      setRentals((prev) => prev.filter((r) => r.id !== id));
    }
    showToast("Rental deleted.", "info");
    setConfirmDelete(null);
    setLoading(false);
  };

  const startEdit = (rental) => {
    setForm({ ...rental });
    setEditingId(rental.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowModal(false);
  };

  const filtered = rentals.filter((r) => {
    const matchSearch =
      r.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
      r.propertyAddress?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: rentals.length,
    active: rentals.filter((r) => r.status === "ACTIVE").length,
    pending: rentals.filter((r) => r.status === "PENDING").length,
    revenue: rentals
      .filter((r) => r.status === "ACTIVE")
      .reduce((s, r) => s + Number(r.rentAmount || 0), 0),
  };

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🏠</span>
          <span style={styles.logoText}>RentEase</span>
        </div>
        <nav style={styles.nav}>
          {["Dashboard", "Properties", "Tenants", "Payments", "Reports"].map((item, i) => (
            <div key={item} style={{ ...styles.navItem, ...(i === 0 ? styles.navActive : {}) }}>
              <span style={styles.navIcon}>{["⊞", "🏘️", "👥", "💳", "📊"][i]}</span>
              {item}
            </div>
          ))}
        </nav>
        <div style={styles.sidebarBottom}>
          <div style={styles.adminCard}>
            <div style={styles.adminAvatar}>A</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Admin</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>admin@rentease.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>Rental Management</h1>
            <p style={styles.pageSubtitle}>Manage all your rental properties in one place</p>
          </div>
          <button style={styles.addBtn} onClick={() => setShowModal(true)}>
            + Add Rental
          </button>
        </header>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {[
            { label: "Total Rentals", value: stats.total, icon: "🏠", color: "#6366f1" },
            { label: "Active Leases", value: stats.active, icon: "✅", color: "#10b981" },
            { label: "Pending", value: stats.pending, icon: "⏳", color: "#f59e0b" },
            { label: "Monthly Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: "💰", color: "#ec4899" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: s.color + "22", color: s.color }}>{s.icon}</div>
              <div>
                <div style={styles.statValue}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={styles.filterBar}>
          <input
            placeholder="🔍  Search tenant or property..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={styles.filterBtns}>
            {["ALL", "ACTIVE", "PENDING", "INACTIVE"].map((s) => (
              <button
                key={s}
                style={{ ...styles.filterBtn, ...(filterStatus === s ? styles.filterBtnActive : {}) }}
                onClick={() => setFilterStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableWrap}>
          {loading ? (
            <div style={styles.emptyState}>⏳ Loading rentals...</div>
          ) : filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 48 }}>🏚️</div>
              <div>No rentals found</div>
              <button style={{ ...styles.addBtn, marginTop: 12 }} onClick={() => setShowModal(true)}>
                Add First Rental
              </button>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Tenant", "Property", "Rent/Month", "Lease Period", "Status", "Actions"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const sc = statusColors[r.status] || statusColors.INACTIVE;
                  return (
                    <tr key={r.id} style={{ ...styles.tr, animationDelay: `${i * 0.05}s` }}>
                      <td style={styles.td}>
                        <div style={styles.tenantCell}>
                          <div style={styles.tenantAvatar}>{r.tenantName?.[0]?.toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.tenantName}</div>
                            <div style={{ fontSize: 12, color: "#6b7280" }}>{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 500 }}>{r.propertyAddress}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{r.contactPhone}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.rentBadge}>₹{Number(r.rentAmount).toLocaleString()}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: 13 }}>{r.startDate}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>→ {r.endDate}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, background: sc.bg, color: sc.color }}>
                          <span style={{ ...styles.statusDot, background: sc.dot }} />
                          {r.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionBtns}>
                          <button style={styles.viewBtn} onClick={() => setViewRental(r)} title="View">👁</button>
                          <button style={styles.editBtn} onClick={() => startEdit(r)} title="Edit">✏️</button>
                          <button style={styles.deleteBtn} onClick={() => setConfirmDelete(r.id)} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && resetForm()}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingId ? "Edit Rental" : "Add New Rental"}</h2>
              <button style={styles.closeBtn} onClick={resetForm}>✕</button>
            </div>
            <div style={styles.formGrid}>
              {[
                { label: "Tenant Name *", key: "tenantName", placeholder: "Full name" },
                { label: "Email", key: "email", placeholder: "tenant@email.com" },
                { label: "Contact Phone", key: "contactPhone", placeholder: "+91 XXXXX XXXXX" },
                { label: "Property Address *", key: "propertyAddress", placeholder: "Full address", full: true },
                { label: "Monthly Rent (₹) *", key: "rentAmount", placeholder: "e.g. 15000", type: "number" },
                { label: "Start Date", key: "startDate", type: "date" },
                { label: "End Date", key: "endDate", type: "date" },
              ].map(({ label, key, placeholder, type = "text", full }) => (
                <div key={key} style={{ gridColumn: full ? "1/-1" : "auto" }}>
                  <label style={styles.label}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    style={styles.input}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div>
                <label style={styles.label}>Status</label>
                <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={resetForm}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSubmit}>
                {editingId ? "Update Rental" : "Add Rental"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewRental && (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && setViewRental(null)}>
          <div style={{ ...styles.modal, maxWidth: 480 }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Rental Details</h2>
              <button style={styles.closeBtn} onClick={() => setViewRental(null)}>✕</button>
            </div>
            <div style={styles.viewCard}>
              <div style={styles.viewAvatar}>{viewRental.tenantName?.[0]?.toUpperCase()}</div>
              <h3 style={{ margin: "8px 0 2px", fontSize: 20 }}>{viewRental.tenantName}</h3>
              <p style={{ color: "#6b7280", margin: 0 }}>{viewRental.email}</p>
            </div>
            <div style={styles.viewDetails}>
              {[
                ["📍 Property", viewRental.propertyAddress],
                ["📞 Phone", viewRental.contactPhone],
                ["💰 Monthly Rent", `₹${Number(viewRental.rentAmount).toLocaleString()}`],
                ["📅 Start Date", viewRental.startDate],
                ["📅 End Date", viewRental.endDate],
                ["🔖 Status", viewRental.status],
              ].map(([k, v]) => (
                <div key={k} style={styles.viewRow}>
                  <span style={styles.viewKey}>{k}</span>
                  <span style={styles.viewVal}>{v}</span>
                </div>
              ))}
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setViewRental(null)}>Close</button>
              <button style={styles.saveBtn} onClick={() => { startEdit(viewRental); setViewRental(null); }}>Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, maxWidth: 380, textAlign: "center", padding: 32 }}>
            <div style={{ fontSize: 48 }}>🗑️</div>
            <h3 style={{ margin: "12px 0 8px" }}>Delete Rental?</h3>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button style={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button style={{ ...styles.saveBtn, background: "#ef4444" }} onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, background: toast.type === "error" ? "#ef4444" : toast.type === "info" ? "#6366f1" : "#10b981" }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Mock data for demo
const mockData = [
  { id: 1, tenantName: "Arjun Sharma", email: "arjun@email.com", contactPhone: "+91 98765 43210", propertyAddress: "12A, MG Road, Chennai - 600001", rentAmount: 18000, startDate: "2025-01-01", endDate: "2025-12-31", status: "ACTIVE" },
  { id: 2, tenantName: "Priya Nair", email: "priya@email.com", contactPhone: "+91 98765 11111", propertyAddress: "45, Anna Salai, Chennai - 600002", rentAmount: 22000, startDate: "2025-03-01", endDate: "2026-02-28", status: "ACTIVE" },
  { id: 3, tenantName: "Ravi Kumar", email: "ravi@email.com", contactPhone: "+91 87654 32100", propertyAddress: "7, Velachery Main Road - 600042", rentAmount: 12000, startDate: "2025-02-01", endDate: "2025-07-31", status: "PENDING" },
  { id: 4, tenantName: "Meena Devi", email: "meena@email.com", contactPhone: "+91 99887 76655", propertyAddress: "88, T.Nagar, Chennai - 600017", rentAmount: 25000, startDate: "2024-06-01", endDate: "2024-12-31", status: "INACTIVE" },
];

const styles = {
  root: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#f1f5f9", color: "#1e293b" },
  sidebar: { width: 240, background: "#0f172a", color: "#e2e8f0", display: "flex", flexDirection: "column", padding: "0 0 16px", flexShrink: 0 },
  logo: { display: "flex", alignItems: "center", gap: 10, padding: "24px 20px 20px", borderBottom: "1px solid #1e293b" },
  logoIcon: { fontSize: 28 },
  logoText: { fontSize: 20, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.5px" },
  nav: { padding: "16px 12px", flex: 1 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#94a3b8", marginBottom: 2 },
  navActive: { background: "#6366f1", color: "#fff" },
  navIcon: { fontSize: 16 },
  sidebarBottom: { padding: "12px 16px", borderTop: "1px solid #1e293b" },
  adminCard: { display: "flex", alignItems: "center", gap: 10 },
  adminAvatar: { width: 34, height: 34, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 },
  main: { flex: 1, padding: "28px 32px", overflow: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  pageTitle: { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px" },
  pageSubtitle: { margin: "4px 0 0", color: "#64748b", fontSize: 14 },
  addBtn: { background: "#6366f1", color: "#fff", border: "none", padding: "11px 22px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" },
  statIcon: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 2 },
  filterBar: { display: "flex", gap: 12, marginBottom: 18, alignItems: "center" },
  searchInput: { flex: 1, padding: "10px 16px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, background: "#fff", outline: "none" },
  filterBtns: { display: "flex", gap: 6 },
  filterBtn: { padding: "8px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748b" },
  filterBtnActive: { background: "#6366f1", color: "#fff", border: "1.5px solid #6366f1" },
  tableWrap: { background: "#fff", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "14px 16px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "14px 16px", fontSize: 14, verticalAlign: "middle" },
  tenantCell: { display: "flex", alignItems: "center", gap: 10 },
  tenantAvatar: { width: 36, height: 36, borderRadius: "50%", background: "#e0e7ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 },
  rentBadge: { background: "#f0fdf4", color: "#166534", padding: "4px 10px", borderRadius: 6, fontWeight: 700, fontSize: 13 },
  statusBadge: { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  statusDot: { width: 7, height: 7, borderRadius: "50%" },
  actionBtns: { display: "flex", gap: 6 },
  viewBtn: { background: "#e0e7ff", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 },
  editBtn: { background: "#fef3c7", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 },
  deleteBtn: { background: "#fee2e2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 },
  emptyState: { padding: 60, textAlign: "center", color: "#94a3b8", fontSize: 15 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 20, width: "90%", maxWidth: 620, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 24px 16px", borderBottom: "1px solid #f1f5f9" },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 800 },
  closeBtn: { background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 24 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fafafa" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid #f1f5f9" },
  cancelBtn: { padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 },
  saveBtn: { padding: "10px 22px", borderRadius: 10, border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 },
  viewCard: { textAlign: "center", padding: "20px 24px 0" },
  viewAvatar: { width: 64, height: 64, borderRadius: "50%", background: "#e0e7ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28, margin: "0 auto" },
  viewDetails: { padding: "16px 24px" },
  viewRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  viewKey: { fontSize: 13, color: "#6b7280" },
  viewVal: { fontSize: 14, fontWeight: 600 },
  toast: { position: "fixed", bottom: 24, right: 24, padding: "12px 24px", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 9999 },
};
