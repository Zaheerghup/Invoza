"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  InvoiceDate: string;
  TotalAmount: number;
  SalesTax: number;
  FBR_InvoiceNumber: string | null;
  FBR_Status: string;
  QRCodeData: string | null;
  digitalSignature: string | null;
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
    description: string | null;
    HSCode: string | null;
    UoM: string;
    SaleType: string;
    Quantity: number;
    Rate: number;
    TaxPct: number;
    TaxAmount: number;
    Discount: number;
    FurtherTax: number;
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
  if (!invoice || !invoice.company || !invoice.customer || !Array.isArray(invoice.items)) return <div style={{ padding: "100px", textAlign: "center" }}>Invoice not found or data missing.</div>;

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
            <p style={{ margin: "2px 0", fontWeight: 700 }}>#{invoice.invoiceNumber || invoice.id}</p>
            <p style={{ margin: "2px 0" }}>Date: {new Date(invoice.InvoiceDate).toLocaleDateString("en-PK")}</p>
            <p style={{ margin: "2px 0", color: "#666" }}>{invoiceTypes[invoice.InvoiceType]}</p>
          </div>
        </div>

        <hr style={{ border: "0", borderTop: "2px solid #2ca01c", marginBottom: "40px" }} />

        {/* Bill To */}
        <div style={{ marginBottom: "40px" }}>
          <h3 style={{ fontSize: "12px", textTransform: "uppercase", color: "#6a6c71", marginBottom: "12px" }}>Bill To:</h3>
          <p style={{ margin: "0", fontSize: "18px", fontWeight: 700 }}>{invoice.customer.CustomerName}</p>
          {invoice.customer.NTN_CNIC && <p style={{ margin: "4px 0", fontSize: "14px" }}>NTN/CNIC: {invoice.customer.NTN_CNIC}</p>}
          {invoice.customer.Address && <p style={{ margin: "4px 0", fontSize: "14px", maxWidth: "400px" }}>{invoice.customer.Address}</p>}
          <p style={{ margin: "4px 0", fontSize: "12px", color: "#666" }}>Type: {invoice.customer.BuyerType}</p>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "40px" }}>
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #eee" }}>
              <th style={{ textAlign: "left", padding: "12px", fontSize: "11px" }}>DESCRIPTION / HS / SALE TYPE</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "11px" }}>UOM</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "11px" }}>QTY</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "11px" }}>RATE</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "11px" }}>TAX (18%)</th>
              <th style={{ textAlign: "right", padding: "12px", fontSize: "11px" }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px", fontSize: "13px" }}>
                  <div style={{ fontWeight: 600 }}>{item.ItemName}</div>
                  <div style={{ fontSize: "10px", color: "#666" }}>{item.SaleType}</div>
                  {item.description && <div style={{ fontSize: "11px", color: "#444", marginTop: "2px", whiteSpace: "pre-wrap" }}>{item.description}</div>}
                  {item.HSCode && <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>HS Code: {item.HSCode}</div>}
                </td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>{item.UoM}</td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>{item.Quantity}</td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>{item.Rate.toLocaleString()}</td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: "13px" }}>{(item.TaxAmount + item.FurtherTax).toLocaleString()}</td>
                <td style={{ padding: "12px", textAlign: "right", fontSize: "13px", fontWeight: 600 }}>{(item.Quantity * item.Rate + item.TaxAmount + item.FurtherTax - item.Discount).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Area */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {/* FBR Details */}
          <div style={{ maxWidth: "300px" }}>
            <div style={{ padding: "16px", background: "#f9fafb", border: "1px solid #eee", borderRadius: "4px", display: "flex", gap: "15px", alignItems: "start" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0", fontSize: "10px", fontWeight: 700, color: "#2ca01c", marginBottom: "8px", textTransform:"uppercase" }}>FBR Digital Invoicing</p>
                {invoice.FBR_Status === "SUBMITTED" ? (
                  <>
                    <p style={{ margin: "2px 0", fontSize: "11px" }}><strong>POS ID:</strong> {invoice.company.NTN}</p>
                    <p style={{ margin: "2px 0", fontSize: "11px" }}><strong>Inv:</strong> {invoice.FBR_InvoiceNumber}</p>
                    <div style={{ marginTop: "10px" }}>
                      <img src="/fbr-logo.png" alt="FBR Logo" style={{ width: "40px", opacity: 0.9 }} />
                    </div>
                  </>
                ) : (
                  <p style={{ margin: "0", fontSize: "11px", color: "#6a6c71" }}>Waiting for FBR submission...</p>
                )}
              </div>
              
              {invoice.FBR_Status === "SUBMITTED" && invoice.QRCodeData && (
                <div style={{ border: "1px solid #ddd", padding: "2px", background: "#fff" }}>
                  <QRCodeCanvas 
                    value={invoice.QRCodeData} 
                    size={26} // Approx 7mm @ 96dpi
                    style={{ width: "7mm", height: "7mm" }}
                    level="L"
                  />
                  <p style={{fontSize:"6px", textAlign:"center", margin:"2px 0 0 0"}}>7x7mm Scan</p>
                </div>
              )}
            </div>
            
            {invoice.digitalSignature && (
              <div style={{ marginTop: "10px", fontSize: "8px", color: "#888", wordBreak: "break-all", fontStyle: "italic" }}>
                DS: {invoice.digitalSignature}
              </div>
            )}
            
            <p style={{ marginTop: "15px", fontSize: "12px", color: "#666" }}>
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
