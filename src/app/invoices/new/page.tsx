"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Customer {
  id: number;
  CustomerName: string;
  BuyerType: string;
}

interface Company {
  id: number;
  BusinessName: string;
}

interface InvoiceItem {
  id: string; // temp id for UI
  ItemName: string;
  HSCode: string;
  Quantity: number;
  Rate: number;
  TaxPct: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyId: "",
    customerId: "",
    InvoiceDate: new Date().toISOString().split("T")[0],
    PaymentMode: "1", // Default to Cash
    InvoiceType: "SI", // Default to Sales Invoice
    TaxYear: new Date().getFullYear(),
    TaxMonth: new Date().getMonth() + 1,
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: Math.random().toString(36), ItemName: "", HSCode: "", Quantity: 1, Rate: 0, TaxPct: 18 },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, compRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/companies"),
        ]);
        const custs = await custRes.json();
        const comps = await compRes.json();
        const secureCusts = Array.isArray(custs) ? custs : [];
        const secureComps = Array.isArray(comps) ? comps : [];
        setCustomers(secureCusts);
        setCompanies(secureComps);
        if (secureComps.length > 0) setForm(f => ({ ...f, companyId: secureComps[0].id.toString() }));
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36), ItemName: "", HSCode: "", Quantity: 1, Rate: 0, TaxPct: 18 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(i => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const calculateTotals = useCallback(() => {
    let saleValue = 0;
    let taxAmount = 0;
    items.forEach(item => {
      const lineTotal = item.Quantity * item.Rate;
      const lineTax = (lineTotal * item.TaxPct) / 100;
      saleValue += lineTotal;
      taxAmount += lineTax;
    });
    return { saleValue, taxAmount, total: saleValue + taxAmount };
  }, [items]);

  const { saleValue, taxAmount, total } = calculateTotals();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.companyId || !form.customerId) {
      setError("Please select a company and a customer.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map(({ id, ...rest }) => rest),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create invoice.");
      } else {
        router.push("/invoices");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ textAlign: "center", padding: "100px" }}><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
          <span className="gradient-text">Create New Invoice</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px" }}>
          Draft a new invoice and prepare it for FBR submission
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
          
          {/* Main Area */}
          <div style={{ display: "grid", gap: "24px" }}>
            
            {/* Header info */}
            <div className="card">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label className="label">Customer</label>
                  <select className="input-field" value={form.customerId} 
                    onChange={e => setForm({ ...form, customerId: e.target.value })} required>
                    <option value="">Select a customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.CustomerName} ({c.BuyerType})</option>)}
                  </select>
                  <Link href="/customers" style={{ fontSize: "12px", color: "var(--accent-blue)", display: "block", marginTop: "4px", textDecoration: "none" }}>Add new customer</Link>
                </div>
                <div>
                  <label className="label">Invoice Date</label>
                  <input type="date" className="input-field" value={form.InvoiceDate} 
                    onChange={e => setForm({ ...form, InvoiceDate: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Tax Year</label>
                  <input type="number" className="input-field" value={form.TaxYear} 
                    onChange={e => setForm({ ...form, TaxYear: Number(e.target.value) })} required />
                </div>
                <div>
                  <label className="label">Tax Month</label>
                  <select className="input-field" value={form.TaxMonth} 
                    onChange={e => setForm({ ...form, TaxMonth: Number(e.target.value) })} required>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Payment Mode</label>
                  <select className="input-field" value={form.PaymentMode}
                    onChange={e => setForm({ ...form, PaymentMode: e.target.value })}>
                    <option value="1">Cash</option>
                    <option value="2">Credit</option>
                    <option value="3">Cheque</option>
                    <option value="4">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Invoice Type</label>
                  <select className="input-field" value={form.InvoiceType}
                    onChange={e => setForm({ ...form, InvoiceType: e.target.value })}>
                    <option value="SI">Sales Invoice</option>
                    <option value="CN">Credit Note</option>
                    <option value="DN">Debit Note</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "14px", margin: 0 }}>Invoice Items</h3>
                <button type="button" onClick={addItem} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }}>
                  Add Line Item
                </button>
              </div>

              <div style={{ display: "grid", gap: "10px" }}>
                {items.map((item, idx) => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 100px 80px auto", gap: "10px", alignItems: "end", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
                    <div>
                      <label className="label">Item Name</label>
                      <input className="input-field" value={item.ItemName} placeholder="Description"
                        onChange={e => updateItem(item.id, "ItemName", e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">HS Code</label>
                      <input className="input-field" value={item.HSCode} placeholder="8 digits"
                        onChange={e => updateItem(item.id, "HSCode", e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Qty</label>
                      <input type="number" step="any" className="input-field" value={item.Quantity}
                        onChange={e => updateItem(item.id, "Quantity", Number(e.target.value))} required />
                    </div>
                    <div>
                      <label className="label">Rate</label>
                      <input type="number" step="any" className="input-field" value={item.Rate}
                        onChange={e => updateItem(item.id, "Rate", Number(e.target.value))} required />
                    </div>
                    <div>
                      <label className="label">Tax %</label>
                      <input type="number" step="any" className="input-field" value={item.TaxPct}
                        onChange={e => updateItem(item.id, "TaxPct", Number(e.target.value))} required />
                    </div>
                    <div>
                      <button type="button" onClick={() => removeItem(item.id)} className="btn-danger-outline" style={{ marginBottom: "2px", padding: "8px" }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Area: Summary */}
          <div style={{ position: "sticky", top: "24px" }}>
            <div className="card" style={{ background: "var(--bg-secondary)" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>Summary</h3>
              
              <div style={{ display: "grid", gap: "12px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
                  <span>₨ {saleValue.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Sales Tax (GST)</span>
                  <span>₨ {taxAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "2px solid var(--border)", fontWeight: 700, fontSize: "18px" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--accent-green)" }}>₨ {total.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: "20px", padding: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#ef4444", fontSize: "12px" }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "100%", marginTop: "24px", justifyContent: "center", padding: "14px" }}>
                {submitting ? <><span className="spinner" /> Saving...</> : "Save Invoice"}
              </button>
              
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "16px", textAlign: "center" }}>
                Invoices are saved as PENDING in the database. You can submit them to FBR individually after review.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
