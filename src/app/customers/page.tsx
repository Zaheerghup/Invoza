"use client";

import { useEffect, useState } from "react";

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

  async function fetchCustomers() {
    try {
      const res = await fetch("/api/customers");
      setCustomers(await res.json());
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCustomers(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ CustomerName: "", NTN_CNIC: "", Address: "", BuyerType: "Individual" });
        setShowAdd(false);
        fetchCustomers();
      }
    } catch { /* empty */ } finally {
      setSubmitting(false);
    }
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
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary">
          {showAdd ? "X Close" : "Add Customer"}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: "32px", maxWidth: "600px" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "20px" }}>Add New Customer</h3>
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
              <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "fit-content" }}>
                {submitting ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}><div className="spinner" /></div>
      ) : customers.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          No customers found. Add your first customer to start invoicing.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {customers.map(c => (
            <div key={c.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: "16px", fontWeight: 700 }}>{c.CustomerName}</span>
                <span className="badge" style={{ background: "#f0f7ff", color: "var(--secondary)", border: "1px solid #d0e7ff" }}>{c.BuyerType}</span>
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
