"use client";

import { useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";

interface Customer {
  id: number;
  CustomerName: string;
  NTN_CNIC: string | null;
  Address: string | null;
  BuyerType: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    CustomerName: "", NTN_CNIC: "", Address: "", BuyerType: "Individual",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  async function fetchCustomers() {
    setError(null);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch customers");
      }
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCustomers(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setForm({ CustomerName: "", NTN_CNIC: "", Address: "", BuyerType: "Individual" });
        setEditingCustomer(null);
        setShowAdd(false);
        fetchCustomers();
      } else {
        setError(data.error || "Failed to save customer");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setForm({
      CustomerName: customer.CustomerName,
      NTN_CNIC: customer.NTN_CNIC || "",
      Address: customer.Address || "",
      BuyerType: customer.BuyerType,
    });
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setEditingCustomer(null);
    setForm({ CustomerName: "", NTN_CNIC: "", Address: "", BuyerType: "Individual" });
    setShowAdd(false);
  }

  return (
    <div className="animate-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
            Customers
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "6px", fontSize: "14px" }}>
            Manage your registered buyers and tax profiles
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => fetchCustomers()} className="btn-secondary" style={{ padding: "10px 16px" }}>
            Refresh
          </button>
          <button onClick={() => {
            if (showAdd) handleCancel();
            else setShowAdd(true);
          }} className="btn-primary">
            {showAdd ? "X Close" : "Add Customer"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          background: "rgba(239,68,68,0.1)", 
          border: "1px solid rgba(239,68,68,0.3)", 
          borderRadius: "8px", 
          padding: "16px 20px", 
          color: "#ef4444", 
          marginBottom: "32px",
          fontSize: "14px"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {showAdd && (
        <div className="card" style={{ marginBottom: "32px", maxWidth: "600px" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "20px" }}>
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="label">Customer Name</label>
                  <input className="input-field" value={form.CustomerName}
                    onChange={e => setForm({ ...form, CustomerName: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Buyer Type</label>
                  <select className="input-field" value={form.BuyerType}
                    onChange={e => setForm({ ...form, BuyerType: e.target.value })}>
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                    <option value="Government">Government</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">NTN / CNIC</label>
                <input className="input-field" value={form.NTN_CNIC} placeholder="e.g. 42101-1234567-1"
                  onChange={e => setForm({ ...form, NTN_CNIC: e.target.value })} />
              </div>
              <div>
                <label className="label">Address</label>
                <textarea className="input-field" value={form.Address} rows={2}
                  onChange={e => setForm({ ...form, Address: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "fit-content" }}>
                  {submitting ? "Saving..." : (editingCustomer ? "Update Customer" : "Save Customer")}
                </button>
                {editingCustomer && (
                  <button type="button" onClick={handleCancel} className="btn-secondary" style={{ width: "fit-content" }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "100px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          Loading customers...
        </div>
      ) : customers.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          No customers found. Add your first customer to start invoicing.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {customers.map(c => (
            <div key={c.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 700 }}>{c.CustomerName}</span>
                  <span className="badge" style={{ background: "#f0f7ff", color: "var(--secondary)", border: "1px solid #d0e7ff", width: "fit-content" }}>{c.BuyerType}</span>
                </div>
                <button 
                  onClick={() => handleEdit(c)}
                  className="btn-secondary" 
                  style={{ fontSize: "12px", padding: "6px 12px" }}
                >
                  Edit
                </button>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                <div style={{ marginBottom: "4px" }}>NTN/CNIC: <span style={{ color: "var(--text-main)", fontWeight: 600 }}>{c.NTN_CNIC || "N/A"}</span></div>
                <div>Address: {c.Address || "No address provided"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
