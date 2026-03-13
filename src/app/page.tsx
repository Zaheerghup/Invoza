"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalInvoices: number;
  pendingInvoices: number;
  submittedInvoices: number;
  failedInvoices: number;
  totalRevenue: number;
  totalTax: number;
}

interface Invoice {
  id: number;
  InvoiceDate: string;
  TotalAmount: number;
  SalesTax: number;
  FBR_Status: string;
  FBR_InvoiceNumber: string | null;
  customer: { CustomerName: string };
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/invoices");
        const data = await res.json();
        const invoices: Invoice[] = Array.isArray(data) ? data : [];

        const s: Stats = {
          totalInvoices: invoices.length,
          pendingInvoices: invoices.filter((i) => i.FBR_Status === "PENDING").length,
          submittedInvoices: invoices.filter((i) => i.FBR_Status === "SUBMITTED").length,
          failedInvoices: invoices.filter((i) => i.FBR_Status === "FAILED").length,
          totalRevenue: invoices.reduce((a, b) => a + b.TotalAmount, 0),
          totalTax: invoices.reduce((a, b) => a + b.SalesTax, 0),
        };
        setStats(s);
        setRecentInvoices(invoices.slice(0, 5));
      } catch {
        setStats({ totalInvoices: 0, pendingInvoices: 0, submittedInvoices: 0, failedInvoices: 0, totalRevenue: 0, totalTax: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Invoices", value: stats?.totalInvoices ?? 0, icon: "", color: "var(--secondary)" },
    { label: "Submitted to FBR", value: stats?.submittedInvoices ?? 0, icon: "", color: "var(--primary)" },
    { label: "Pending", value: stats?.pendingInvoices ?? 0, icon: "", color: "var(--warning)" },
    { label: "Failed", value: stats?.failedInvoices ?? 0, icon: "", color: "var(--danger)" },
    { label: "Total Revenue (PKR)", value: `₨ ${(stats?.totalRevenue ?? 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`, icon: "", color: "var(--primary)" },
    { label: "Total Tax Collected", value: `₨ ${(stats?.totalTax ?? 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}`, icon: "", color: "var(--secondary)" },
  ];

  return (
    <div className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
          <span className="gradient-text">Invoza Dashboard</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px" }}>
          Professional Accounting — FBR Compliance S.R.O. 709(I)/2025
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div style={{ color: "var(--text-muted)", padding: "40px 0", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          Loading dashboard...
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {statCards.map((card) => (
            <div key={card.label} className="card" style={{ display: "flex", alignItems: "center", gap: "16px", transition: "transform 0.2s", cursor: "default" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}>
              <div style={{ fontSize: "32px", width: "52px", height: "52px", borderRadius: "12px", background: `${card.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: card.color }}>{card.value}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
        <Link href="/invoices/new">
          <button className="btn-primary">Create New Invoice</button>
        </Link>
        <Link href="/invoices">
          <button className="btn-secondary">View All Invoices</button>
        </Link>
        <Link href="/settings">
          <button className="btn-secondary">Company Settings</button>
        </Link>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <h2 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 600 }}>Recent Invoices</h2>
        {recentInvoices.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "32px 0", fontSize: "14px" }}>
            No invoices yet. <Link href="/invoices/new" style={{ color: "var(--accent-green)", textDecoration: "none" }}>Create your first invoice</Link>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["#", "Customer", "Date", "Amount (PKR)", "Tax (PKR)", "FBR Status", "FBR #"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px" }}>{inv.id}</td>
                  <td style={{ padding: "12px", color: "var(--text-primary)", fontWeight: 500 }}>{inv.customer.CustomerName}</td>
                  <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{new Date(inv.InvoiceDate).toLocaleDateString("en-PK")}</td>
                  <td style={{ padding: "12px", fontWeight: 600, color: "var(--accent-green)" }}>₨ {inv.TotalAmount.toLocaleString()}</td>
                  <td style={{ padding: "12px", color: "var(--text-secondary)" }}>₨ {inv.SalesTax.toLocaleString()}</td>
                  <td style={{ padding: "12px" }}>
                    <span className={`badge badge-${inv.FBR_Status.toLowerCase()}`}>{inv.FBR_Status}</span>
                  </td>
                  <td style={{ padding: "12px", color: "var(--text-muted)", fontSize: "12px" }}>{inv.FBR_InvoiceNumber || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
