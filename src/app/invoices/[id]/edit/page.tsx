"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";

interface Customer {
  id: number;
  CustomerName: string;
  BuyerType: string;
  NTN_CNIC: string | null;
}

interface Company {
  id: number;
  BusinessName: string;
}

interface InvoiceItem {
  id: string; // temp id for UI
  ItemName: string;
  description: string;
  HSCode: string;
  Quantity: number;
  Rate: number;
  TaxPct: number;
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: invoiceId } = use(params);
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyId: "",
    customerId: "",
    InvoiceDate: "",
    PaymentMode: "1",
    InvoiceType: "SI",
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, compRes, invRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/companies"),
          fetch(`/api/invoices/${invoiceId}`),
        ]);
        
        const custs = await custRes.json();
        const comps = await compRes.json();
        const invoice = await invRes.json();

        if (invoice.error) {
          setError(invoice.error);
          setLoading(false);
          return;
        }

        if (invoice.FBR_Status === "SUBMITTED") {
          setError("This invoice has already been submitted to FBR and cannot be edited.");
          setLoading(false);
          return;
        }

        setCustomers(Array.isArray(custs) ? custs : []);
        setCompanies(Array.isArray(comps) ? comps : []);
        setForm({
          companyId: invoice.companyId.toString(),
          customerId: invoice.customerId.toString(),
          InvoiceDate: new Date(invoice.InvoiceDate).toISOString().split("T")[0],
          PaymentMode: invoice.PaymentMode || "1",
          InvoiceType: invoice.InvoiceType || "SI",
        });
        setItems(invoice.items.map((it: any) => ({
          ...it,
          id: it.id.toString(),
        })));
      } catch {
        setError("Failed to load invoice data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [invoiceId]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), ItemName: "", description: "", HSCode: "", Quantity: 1, Rate: 0, TaxPct: 18 }]);
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
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map(({ id, ...rest }) => rest),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update invoice.");
      } else {
        router.push("/invoices");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen inline message="Loading invoice details..." />;

  return (
    <div className="animate-in">
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
            <span className="gradient-text">Edit Invoice #{invoiceId}</span>
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "6px", fontSize: "14px" }}>
            Update your invoice details before FBR submission
          </p>
        </div>
        <Link href="/invoices">
          <button className="btn-secondary">Cancel</button>
        </Link>
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
                    {customers.map(c => <option key={c.id} value={c.id}>{c.CustomerName} ({c.BuyerType}{c.NTN_CNIC ? ` - ${c.NTN_CNIC}` : ""})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Invoice Date</label>
                  <input type="date" className="input-field" value={form.InvoiceDate} 
                    onChange={e => setForm({ ...form, InvoiceDate: e.target.value })} required />
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

              <div style={{ display: "grid", gap: "24px" }}>
                {items.map((item, idx) => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "16px", alignItems: "start", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
                    
                    {/* Left Column: Descriptions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <label className="label">Short Name (Title)</label>
                        <input className="input-field" value={item.ItemName} placeholder="Item title" onChange={e => updateItem(item.id, "ItemName", e.target.value)} required />
                      </div>
                      
                      <div>
                        <label className="label">Detailed Description</label>
                        <textarea className="input-field" value={item.description || ""} placeholder="Full item description... (Will appear on invoice)" rows={3} style={{ resize: "vertical" }} onChange={e => updateItem(item.id, "description", e.target.value)} />
                      </div>
                    </div>

                    {/* Right Column: Values */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", alignItems: "end" }}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label className="label">HS Code</label>
                        <input className="input-field" value={item.HSCode} placeholder="8 digits" onChange={e => updateItem(item.id, "HSCode", e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Qty</label>
                        <input type="number" step="any" className="input-field" value={item.Quantity} onChange={e => updateItem(item.id, "Quantity", Number(e.target.value))} required />
                      </div>
                      <div>
                        <label className="label">Tax %</label>
                        <input type="number" step="any" className="input-field" value={item.TaxPct} onChange={e => updateItem(item.id, "TaxPct", Number(e.target.value))} required />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label className="label">Rate</label>
                        <input type="number" step="any" className="input-field" value={item.Rate} onChange={e => updateItem(item.id, "Rate", Number(e.target.value))} required />
                      </div>
                      <div style={{ gridColumn: "1 / -1", textAlign: "right", marginTop: "4px" }}>
                        <button type="button" onClick={() => removeItem(item.id)} className="btn-danger-outline" style={{ padding: "6px 12px", fontSize: "12px", width: "100%" }}>Remove Line Item</button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Area: Summary */}
          <div style={{ position: "sticky", top: "24px" }}>
            <div className="card" style={{ background: "var(--bg-app)", border: "1px solid var(--border)" }}>
              <h3 style={{ fontSize: "16px", marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>Summary</h3>
              
              <div style={{ display: "grid", gap: "12px", fontSize: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                  <span>₨ {saleValue.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Sales Tax (GST)</span>
                  <span>₨ {taxAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "2px solid var(--border-light)", fontWeight: 700, fontSize: "18px" }}>
                  <span>Total</span>
                  <span style={{ color: "var(--primary)" }}>₨ {total.toLocaleString()}</span>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: "20px", padding: "10px", background: "#fff1f0", border: "1px solid #ffa39e", borderRadius: "4px", color: "var(--danger)", fontSize: "12px" }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "100%", marginTop: "24px", justifyContent: "center", padding: "14px" }}>
                {submitting ? <><span className="spinner" /> Updating...</> : "Update Invoice"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
