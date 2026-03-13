"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Invoice {
  id: number;
  InvoiceDate: string;
  TotalAmount: number;
  SalesTax: number;
  FBR_Status: string;
  FBR_InvoiceNumber: string | null;
  QRCodeData: string | null;
  PaymentMode: string;
  InvoiceType: string;
  customer: { CustomerName: string; NTN_CNIC: string | null };
  company: { BusinessName: string };
  items: Array<{ ItemName: string; Quantity: number; Rate: number; TaxPct: number; TaxAmount: number }>;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/invoices");
      setInvoices(await res.json());
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchInvoices(); }, []);

  async function submitToFBR(invoiceId: number) {
    setSubmitting(invoiceId);
    setMessage(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/submit`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `✅ Submitted! FBR Invoice #: ${data.invoiceNumber}` });
        await fetchInvoices();
      } else {
        setMessage({ type: "error", text: `❌ ${data.message || data.error || "FBR submission failed"}` });
      }
    } catch {
      setMessage({ type: "error", text: "❌ Network error. Please try again." });
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="animate-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
            <span className="gradient-text">Invoices</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px" }}>
            Manage and submit invoices to FBR
          </p>
        </div>
        <Link href="/invoices/new">
          <button className="btn-primary">New Invoice</button>
        </Link>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px",
          background: message.type === "success" ? "rgba(0,200,150,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${message.type === "success" ? "rgba(0,200,150,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: message.type === "success" ? "var(--accent-green)" : "#ef4444"
        }}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} /> Loading invoices...
        </div>
      ) : invoices.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <p style={{ color: "var(--text-secondary)" }}>No invoices yet.</p>
          <Link href="/invoices/new">
            <button className="btn-primary" style={{ marginTop: "12px" }}>Create Your First Invoice</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {invoices.map((inv) => (
            <div key={inv.id} className="card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "16px" }}>Invoice #{inv.id}</span>
                    <span className={`badge badge-${inv.FBR_Status.toLowerCase()}`}>{inv.FBR_Status}</span>
                    {inv.FBR_InvoiceNumber && (
                      <span style={{ fontSize: "12px", color: "var(--accent-green)" }}>FBR# {inv.FBR_InvoiceNumber}</span>
                    )}
                  </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "16px", fontSize: "13px" }}>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Customer</div>
                        <div style={{ color: "var(--text-main)", fontWeight: 700 }}>{inv.customer.CustomerName}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Date</div>
                        <div>{new Date(inv.InvoiceDate).toLocaleDateString("en-PK")}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Total Amount</div>
                        <div style={{ color: "var(--primary)", fontWeight: 700 }}>₨ {inv.TotalAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Sales Tax</div>
                        <div>₨ {inv.SalesTax.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Type</div>
                        <div style={{ fontWeight: 600 }}>{inv.InvoiceType === "SI" ? "Sales" : inv.InvoiceType === "CN" ? "Credit" : "Debit"}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "2px" }}>Payment</div>
                        <div style={{ fontWeight: 600 }}>{inv.PaymentMode === "1" ? "Cash" : inv.PaymentMode === "2" ? "Credit" : inv.PaymentMode === "3" ? "Cheque" : "Bank"}</div>
                      </div>
                    </div>
                  {/* Items summary */}
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                    {inv.items.length} item{inv.items.length !== 1 ? "s" : ""}: {inv.items.map(i => i.ItemName).join(", ")}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ marginLeft: "24px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", minWidth: "150px" }}>
                  {inv.FBR_Status === "PENDING" || inv.FBR_Status === "FAILED" ? (
                    <button
                      className="btn-primary"
                      onClick={() => submitToFBR(inv.id)}
                      disabled={submitting === inv.id}
                      style={{ fontSize: "13px", padding: "8px 16px", width: "100%" }}
                    >
                      {submitting === inv.id ? <><span className="spinner" /> Submitting...</> : "Submit to FBR"}
                    </button>
                  ) : (
                    <div style={{ fontSize: "12px", color: "var(--accent-green)", fontWeight: 600, padding: "8px 0" }}>
                      Submitted
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                    <Link href={`/invoices/${inv.id}/print`} style={{ flex: 1 }}>
                      <button className="btn-secondary" style={{ fontSize: "12px", padding: "6px", width: "100%" }}>Print</button>
                    </Link>
                    {(inv.FBR_Status === "PENDING" || inv.FBR_Status === "FAILED") && (
                      <>
                        <Link href={`/invoices/${inv.id}/edit`} style={{ flex: 1 }}>
                          <button className="btn-secondary" style={{ fontSize: "12px", padding: "6px", width: "100%" }}>Edit</button>
                        </Link>
                        <button 
                          className="btn-danger-outline" 
                          style={{ fontSize: "12px", padding: "6px" }}
                          onClick={async () => {
                            if (confirm("Are you sure you want to delete this invoice?")) {
                              const res = await fetch(`/api/invoices/${inv.id}`, { method: "DELETE" });
                              if (res.ok) fetchInvoices();
                              else {
                                const d = await res.json();
                                alert(d.error || "Failed to delete");
                              }
                            }
                          }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
