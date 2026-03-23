"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LoadingScreen from "@/components/LoadingScreen";

// Types
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

const DonutChart = ({ data, total, colors }: any) => {
  let currentAngle = -90;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-[100px] h-[100px] drop-shadow-sm">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border-light)" strokeWidth="16" />
        {data.map((item: any, i: number) => {
          const percentage = total === 0 ? 0 : item.value / total;
          if (percentage <= 0) return null;
          const dashArray = `${percentage * circumference} ${circumference}`;
          const circle = (
            <circle
              key={item.label} cx="50" cy="50" r={radius} fill="none"
              stroke={colors[i]} strokeWidth="16" strokeDasharray={dashArray} strokeDashoffset="0"
              transform={`rotate(${currentAngle} 50 50)`}
              strokeLinecap="butt"
              className="transition-all duration-1000 ease-out"
            />
          );
          currentAngle += percentage * 360;
          return circle;
        })}
      </svg>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setError(null);
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch dashboard data");
      
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
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message);
      setStats({ totalInvoices: 0, pendingInvoices: 0, submittedInvoices: 0, failedInvoices: 0, totalRevenue: 0, totalTax: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading || !stats) return <LoadingScreen inline message="Preparing your dashboard..." />;

  const invoiceData = [
    { label: "Submitted", value: stats.submittedInvoices },
    { label: "Pending", value: stats.pendingInvoices },
    { label: "Failed", value: stats.failedInvoices }
  ];
  // Brand colors defined globally mapping to status codes
  const invoiceColors = ["#2ca01c", "#ef8d05", "#d52b1e"]; 
  
  // Tax percentage representation
  const taxPercentage = stats.totalRevenue > 0 ? (stats.totalTax / stats.totalRevenue) * 100 : 0;

  return (
    <div className="animate-[fadeIn_0.5s_ease-out] w-full max-w-[1400px]">
      
      {/* Clean, authentic Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4 px-1">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] mb-1 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-medium">
            Welcome! Here is your latest invoice integrity snapshot.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => fetchData()} className="btn-secondary text-xs px-4 py-2 hover:bg-gray-50 bg-white shadow-sm border border-[var(--border-light)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
            Refresh Data
          </button>
          <Link href="/invoices/new">
            <button className="btn-primary text-xs px-5 py-2 shadow-sm shadow-[var(--primary)]/30">Create Invoice</button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-[#fff1f0] border border-[#ffa39e] rounded-xl p-4 text-[#cf1322] mb-8 text-sm">
          <strong>Connection Error:</strong> {error}
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* REVENUE OVERVIEW */}
        <div className="card flex flex-col p-6 shadow-sm border border-[var(--border-light)] hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 z-10 w-full relative">
            <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">Total Revenue</h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2.5" className="opacity-70"><rect x="2" y="4" width="20" height="16" rx="2"></rect><line x1="12" y1="12" x2="12" y2="12"></line></svg>
          </div>
          <h2 className="text-[34px] font-black text-[var(--text-main)] tracking-tighter mb-1 z-10 w-full relative">
            ₨ {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <div className="text-xs text-[var(--text-light)] font-medium mb-6 z-10 w-full relative">Aggregate billed amount to clients</div>
          
          <div className="mt-auto pt-5 border-t border-[var(--border-light)] z-10 w-full relative">
            <div className="flex justify-between items-center text-sm font-bold text-[var(--text-main)]">
              <span>Invoices Generated</span>
              <span className="bg-[var(--bg-app)] text-[var(--secondary)] border border-[var(--border-light)] px-2.5 py-1 rounded-lg shadow-inner">{stats.totalInvoices}</span>
            </div>
          </div>
        </div>

        {/* INVOICE STATUS (The Donut) */}
        <div className="card flex flex-col p-6 shadow-sm border border-[var(--border-light)] hover:shadow-md transition-shadow">
          <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] mb-4">FBR Integration Status</h3>
          
          <div className="flex items-center justify-between mt-auto flex-1">
            <div className="flex flex-col gap-4 w-full h-full justify-center">
              {invoiceData.map((d, i) => (
                <div key={d.label} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: invoiceColors[i] }}></div>
                  <div className="flex flex-col">
                    <span className="text-[17px] font-black text-[var(--text-main)] leading-none">{d.value}</span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider mt-0.5">{d.label}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mr-0 relative flex items-center justify-center">
              {stats.totalInvoices > 0 ? (
                 <DonutChart data={invoiceData} total={stats.totalInvoices} colors={invoiceColors} />
              ) : (
                <div className="w-[100px] h-[100px] rounded-full border-8 border-[var(--border-light)] opacity-40 flex items-center justify-center text-[10px] text-[var(--text-light)] font-bold uppercase tracking-widest text-center px-2">No<br/>Data</div>
              )}
            </div>
          </div>
        </div>

        {/* TAX COLLECTION */}
        <div className="card flex flex-col p-6 shadow-sm border border-[var(--border-light)] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">Tax Collected</h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" className="opacity-70"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          </div>
          <h2 className="text-[34px] font-black text-[var(--text-main)] tracking-tighter mb-1">
            ₨ {stats.totalTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <div className="text-xs text-[var(--text-light)] font-medium mb-10">Sales tax collected for FBR S.R.O. 709</div>

          <div className="mt-auto">
            <div className="flex justify-between text-xs font-black text-[var(--text-main)] mb-2 uppercase tracking-wide">
              <span>Tax / Revenue Ratio</span>
              <span className="text-[var(--primary)]">{taxPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-[var(--border-light)] h-3 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-[var(--primary)] h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(taxPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* RECENT INVOICES TABLE (Restored) */}
      <div className="card p-0 overflow-hidden shadow-sm border border-[var(--border-light)] mb-10">
        <div className="px-6 py-5 border-b border-[var(--border-light)] flex justify-between items-center bg-white/50">
          <h2 className="text-sm font-black text-[var(--text-main)] uppercase tracking-wider m-0">Recent Invoices</h2>
          <Link href="/invoices" className="text-xs font-bold text-[var(--secondary)] hover:underline flex items-center gap-1 group">
            View All <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="group-hover:translate-x-0.5 transition-transform"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </Link>
        </div>
        
        <div className="overflow-x-auto w-full">
          {recentInvoices.length === 0 ? (
            <div className="text-center py-16 px-4 flex flex-col items-center justify-center bg-[var(--bg-app)]/30">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" className="mb-4 text-[var(--text-light)]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <h3 className="text-sm font-bold text-[var(--text-main)] mb-1">No invoices generated</h3>
              <p className="text-xs text-[var(--text-muted)] mb-5 max-w-sm font-medium">You haven't created any invoices yet. Generate your first invoice to see data populate here.</p>
              <Link href="/invoices/new">
                <button className="btn-primary text-xs px-6 py-2.5 shadow-sm">Create First Invoice</button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-[var(--bg-app)]/30 border-b border-[var(--border-light)]">
                <tr>
                  {["Invoice Number", "Customer Name", "Generated On", "Amount", "Tax Applied", "Current FBR Status"].map((h) => (
                    <th key={h} className="py-3.5 px-6 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)] bg-white">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[var(--bg-card-hover)] transition-colors group">
                    <td className="py-4 px-6 text-xs font-black text-[var(--text-main)] tracking-widest">INV-{inv.id.toString().padStart(4, '0')}</td>
                    <td className="py-4 px-6 text-sm font-bold text-[var(--text-main)]">{inv.customer.CustomerName}</td>
                    <td className="py-4 px-6 text-xs font-semibold text-[var(--text-muted)]">{new Date(inv.InvoiceDate).toLocaleDateString("en-PK", { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="py-4 px-6 text-sm font-black text-[var(--text-main)]">₨ {inv.TotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6 text-sm font-bold text-[var(--text-muted)]">₨ {inv.SalesTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-6">
                      <span className={`badge badge-${inv.FBR_Status.toLowerCase()} shadow-sm px-2.5 py-1 text-[9px] tracking-wider`}>{inv.FBR_Status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
