"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Invoice {
  id: number;
  InvoiceDate: string;
  TotalAmount: number;
  SalesTax: number;
  FBR_InvoiceNumber: string | null;
  FBR_Status: string;
  QRCodeData: string | null;
  PaymentMode: string;
  InvoiceType: string;
  company: {
    BusinessName: string;
    NTN: string;
    Address: string;
    Province: string;
  };
  customer: {
    CustomerName: string;
    NTN_CNIC: string | null;
    Address: string | null;
    BuyerType: string;
  };
  items: Array<{
    ItemName: string;
    HSCode: string | null;
    Quantity: number;
    Rate: number;
    TaxPct: number;
    TaxAmount: number;
  }>;
}

export default function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        const data = await res.json();
        setInvoice(data);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>;
  if (!invoice) return <div style={{ padding: "100px", textAlign: "center" }}>Invoice not found</div>;

  const paymentModes: Record<string, string> = { "1": "Cash", "2": "Credit", "3": "Cheque", "4": "Bank Transfer" };
  const invoiceTypes: Record<string, string> = { "SI": "Sales Invoice", "CN": "Credit Note", "DN": "Debit Note" };

  return (
    <div style={{ background: "#fff", color: "#000", minHeight: "100vh" }}>
      {/* Action Bar (Hidden when printing) */}
      <div className="no-print" style={{ 
        padding: "20px", 
        background: "#f4f5f8", 
        borderBottom: "1px solid #d4d7dc",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <Link href="/invoices" style={{ textDecoration: "none", color: "#0077c5", fontWeight: 600 }}>← Back to Invoices</Link>
        <button onClick={() => window.print()} className="btn-primary" style={{ padding: "10px 30px" }}>Print Invoice</button>
      </div>

      {/* Invoice Content */}
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "40px", border: "1px solid #eee", boxShadow: "0 0 10px rgba(0,0,0,0.05)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px 0", color: "#2ca01c" }}>{invoice.company.BusinessName}</h1>
            <p style={{ margin: "2px 0", fontSize: "14px" }}>NTN: {invoice.company.NTN}</p>
            <p style={{ margin: "2px 0", fontSize: "14px" }}>{invoice.company.Address}</p>
            <p style={{ margin: "2px 0", fontSize: "14px" }}>{invoice.company.Province}, Pakistan</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ fontSize: "28px", margin: "0 0 10px 0", color: "#393a3d" }}>INVOICE</h2>
            <p style={{ margin: "2px 0", fontWeight: 700 }}>#{invoice.id}</p>
            <p style={{ margin: "2px 0" }}>Date: {new Date(invoice.InvoiceDate).toLocaleDateString("en-PK")}</p>
            <p style={{ margin: "2px 0", color: "#666" }}>{invoiceTypes[invoice.InvoiceType]}</p>
          </div>
        </div>

        <hr style={{ border: "0", borderTop: "2px solid #2ca01c", marginBottom: "40px" }} />

        {/* Bill To */}
        <div style={{ marginBottom: "40px" }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", color: "#6a6c71", marginBottom: "12px" }}>Bill To:</h3>
          <p style={{ margin: "0", fontSize: "18px", fontWeight: 700 }}>{invoice.customer.CustomerName}</p>
          <p style={{ margin: "4px 0", fontSize: "14px" }}>{invoice.customer.NTN_CNIC ? `NTN/CNIC: ${invoice.customer.NTN_CNIC}` : "Type: Individual"}</p>
          <p style={{ margin: "4px 0", fontSize: "14px", maxWidth: "300px" }}>{invoice.customer.Address}</p>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "40px" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
              <th style={{ textAlign: "left", padding: "12px", fontSize: "12px" }}>DESCRIPTION</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "12px" }}>QTY</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "12px" }}>RATE</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "12px" }}>TAX (18%)</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "12px" }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px", fontSize: "14px" }}>
                  <div style={{ fontWeight: 600 }}>{item.ItemName}</div>
                  {item.HSCode && <div style={{ fontSize: "11px", color: "#666" }}>HS Code: {item.HSCode}</div>}
                </td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: "14px" }}>{item.Quantity}</td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: "14px" }}>{item.Rate.toLocaleString()}</td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: "14px" }}>{item.TaxAmount.toLocaleString()}</td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: "14px", fontWeight: 600 }}>{(item.Quantity * item.Rate + item.TaxAmount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Area */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {/* FBR Details */}
          <div style={{ maxWidth: "300px" }}>
            <div style={{ padding: "16px", background: "#f9fafb", border: "1px solid #eee", borderRadius: "4px" }}>
              <p style={{ margin: "0", fontSize: "11px", fontWeight: 700, color: "#2ca01c", marginBottom: "10px" }}>FBR VERIFICATION</p>
              {invoice.FBR_Status === "SUBMITTED" ? (
                <>
                  <p style={{ margin: "2px 0", fontSize: "12px" }}><strong>Invoice #:</strong> {invoice.FBR_InvoiceNumber}</p>
                  <p style={{ margin: "2px 0", fontSize: "12px", color: "#2ca01c" }}>✅ Verified Application Integrated</p>
                  {/* Placeholder for QR Code */}
                  <div style={{ marginTop: "15px", width: "100px", height: "100px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", textAlign: "center", padding: "10px" }}>
                    QR Code Placeholder
                  </div>
                </>
              ) : (
                <p style={{ margin: "0", fontSize: "12px", color: "#6a6c71" }}>Waiting for FBR submission...</p>
              )}
            </div>
            <p style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
              Payment Mode: {paymentModes[invoice.PaymentMode]}
            </p>
          </div>

          {/* Totals */}
          <div style={{ width: "250px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "14px" }}>
              <span>Subtotal</span>
              <span>₨ {(invoice.TotalAmount - invoice.SalesTax).toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "14px" }}>
              <span>Sales Tax (18%)</span>
              <span>₨ {invoice.SalesTax.toLocaleString()}</span>
            </div>
            <hr style={{ border: "0", borderTop: "1px solid #eee" }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: "18px", fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: "#2ca01c" }}>₨ {invoice.TotalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div style={{ marginTop: "80px", textAlign: "center", fontSize: "12px", color: "#999", borderTop: "1px solid #eee", paddingTop: "20px" }}>
          Thank you for your business. This is a computer generated invoice and does not require a signature.
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          div { box-shadow: none !important; border: none !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
