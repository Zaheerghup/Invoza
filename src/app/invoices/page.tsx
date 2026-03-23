"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";
import { parseCSV } from "@/utils/csvParser";

interface Invoice {
  id: number;
  invoiceNumber: string;
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
  
  // File Upload Logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
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
        setMessage({ type: "success", text: `Submitted! FBR Invoice #: ${data.invoiceNumber}` });
        await fetchInvoices();
      } else {
        setMessage({ type: "error", text: `${data.message || data.error || "FBR submission failed"}` });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(null);
    }
  }

  // Bulk Import Native Handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImporting(true);
        setMessage(null);
        const csvText = event.target?.result as string;
        const parsedData = parseCSV(csvText);

        const res = await fetch("/api/invoices/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedData)
        });
        
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: "success", text: data.message });
          fetchInvoices();
        } else {
          setMessage({ type: "error", text: data.error });
        }
      } catch (err: any) {
        setMessage({ type: "error", text: "Failed to load CSV: " + err.message });
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-start mb-8 gap-4 flex-wrap">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 900, margin: 0, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
            Invoices
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "6px", fontSize: "14px", fontWeight: 500 }}>
            Manage and transmit sales tax invoices universally
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: "none" }} 
          />
          
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            className="btn-secondary" 
            style={{ padding: "10px 16px" }}
            disabled={importing}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            {importing ? "Processing..." : "Import CSV"}
          </button>

          <button onClick={() => fetchInvoices()} className="btn-secondary" style={{ padding: "10px 16px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
          </button>
          
          <Link href="/invoices/new">
            <button className="btn-primary flex gap-1 items-center shadow-sm">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
             New Invoice
            </button>
          </Link>
        </div>
      </div>

      {message && (
        <div style={{
          padding: "16px 20px", borderRadius: "12px", marginBottom: "24px", fontSize: "14px", fontWeight: 600,
          background: message.type === "success" ? "rgba(0,200,150,0.1)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${message.type === "success" ? "rgba(0,200,150,0.3)" : "rgba(239,68,68,0.3)"}`,
          color: message.type === "success" ? "var(--success)" : "#cf1322"
        }}>
          <strong>System Message:</strong> {message.text}
        </div>
      )}

      {loading || importing ? (
        <LoadingScreen inline message={importing ? "Structuring CSV Invoice Arrays..." : "Fetching invoices..."} />
      ) : invoices.length === 0 ? (
        <div className="card border border-[var(--border-light)] shadow-sm" style={{ textAlign: "center", padding: "60px" }}>
          <p style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "16px" }}>No invoices yet.</p>
          <Link href="/invoices/new">
            <button className="btn-primary mt-4 shadow-sm shadow-[var(--primary)]/30">Create Your First Invoice</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {invoices.map((inv) => (
            <div key={inv.id} className="card border border-[var(--border-light)] shadow-sm hover:shadow-md transition-shadow" style={{ padding: "20px 24px", borderLeft: "4px solid var(--primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{ fontWeight: 800, fontSize: "18px", color: "var(--text-main)" }}>{inv.invoiceNumber || `INV-${inv.id}`}</span>
                    <span className={`badge badge-${inv.FBR_Status.toLowerCase()} px-3 py-1 font-bold tracking-wider`}>{inv.FBR_Status}</span>
                    {inv.FBR_InvoiceNumber && (
                      <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 800, background: "rgba(0,200,150,0.1)", padding: "4px 8px", borderRadius: "6px" }}>FBR# {inv.FBR_InvoiceNumber}</span>
                    )}
                  </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-[13px]">
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "4px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Customer</div>
                        <div style={{ color: "var(--text-main)", fontWeight: 800 }}>{inv.customer.CustomerName}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "4px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Date</div>
                        <div style={{ fontWeight: 600 }}>{new Date(inv.InvoiceDate).toLocaleDateString("en-PK")}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "4px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Total Amount</div>
                        <div style={{ color: "var(--primary)", fontWeight: 900, fontSize: "15px" }}>₨ {inv.TotalAmount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "4px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Sales Tax</div>
                        <div style={{ fontWeight: 600 }}>₨ {inv.SalesTax.toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "4px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Type</div>
                        <div style={{ fontWeight: 700 }}>{inv.InvoiceType === "SI" ? "Sales" : inv.InvoiceType === "CN" ? "Credit" : "Debit"}</div>
                      </div>
                      <div>
                        <div style={{ color: "var(--text-muted)", marginBottom: "4px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Payment</div>
                        <div style={{ fontWeight: 700 }}>{inv.PaymentMode === "1" ? "Cash" : inv.PaymentMode === "2" ? "Credit" : inv.PaymentMode === "3" ? "Cheque" : "Bank"}</div>
                      </div>
                    </div>
                  {/* Items summary */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-[var(--border-light)]" style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                    <span className="text-[var(--text-main)] font-black text-xs mr-2">{inv.items.length} ITEM{inv.items.length !== 1 ? "S" : ""} LISTED:</span>
                    {inv.items.map(i => i.ItemName).join(", ")}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end", minWidth: "150px" }}>
                  {inv.FBR_Status === "PENDING" || inv.FBR_Status === "FAILED" ? (
                    <button
                      className="btn-primary"
                      onClick={() => submitToFBR(inv.id)}
                      disabled={submitting === inv.id}
                      style={{ fontSize: "13px", padding: "10px 16px", width: "100%", textAlign: "center", justifyContent: "center", fontWeight: 800, boxShadow: "0 2px 10px rgba(14, 165, 233, 0.3)" }}
                    >
                      {submitting === inv.id ? <><span className="spinner mr-2 border-white border-t-transparent" /> Transmitting...</> : "Submit to FBR"}
                    </button>
                  ) : (
                    <div className="bg-[rgba(0,200,150,0.1)] rounded-lg w-full flex items-center justify-center gap-2" style={{ fontSize: "12px", color: "var(--success)", fontWeight: 800, padding: "10px 0", border: "1px solid rgba(0,200,150,0.3)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Submitted
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: "8px", width: "100%" }}>
                    <Link href={`/invoices/${inv.id}/print`} style={{ flex: 1 }}>
                      <button className="btn-secondary" style={{ fontSize: "12px", padding: "8px", width: "100%", fontWeight: 700 }}>Print</button>
                    </Link>
                    {(inv.FBR_Status === "PENDING" || inv.FBR_Status === "FAILED") && (
                      <>
                        <Link href={`/invoices/${inv.id}/edit`} style={{ flex: 1 }}>
                          <button className="btn-secondary" style={{ fontSize: "12px", padding: "8px", width: "100%", fontWeight: 700 }}>Edit</button>
                        </Link>
                        <button 
                          className="btn-danger" 
                          style={{ fontSize: "12px", padding: "8px", fontWeight: 700 }}
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
