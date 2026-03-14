"use client";

import { useEffect, useState } from "react";

interface Invoice {
  id: number;
  InvoiceDate: string;
  TotalAmount: number;
  SalesTax: number;
  FBR_Status: string;
  customer: { CustomerName: string };
}

export default function ReportsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: "ALL",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch("/api/invoices");
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = filter.status === "ALL" || inv.FBR_Status === filter.status;
    const invDate = new Date(inv.InvoiceDate);
    const matchesFrom = !filter.dateFrom || invDate >= new Date(filter.dateFrom);
    const matchesTo = !filter.dateTo || invDate <= new Date(filter.dateTo);
    return matchesStatus && matchesFrom && matchesTo;
  });

  const totals = filteredInvoices.reduce((acc, inv) => ({
    total: acc.total + inv.TotalAmount,
    tax: acc.tax + inv.SalesTax,
    count: acc.count + 1
  }), { total: 0, tax: 0, count: 0 });

  return (
    <div className="animate-in">
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
            Reports
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px" }}>
            Generate and export business performance summaries
          </p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary">Print Report</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
          <div>
            <label className="label">FBR Status</label>
            <select className="input-field" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
          <div>
            <label className="label">Date From</label>
            <input type="date" className="input-field" value={filter.dateFrom} onChange={e => setFilter({ ...filter, dateFrom: e.target.value })} />
          </div>
          <div>
            <label className="label">Date To</label>
            <input type="date" className="input-field" value={filter.dateTo} onChange={e => setFilter({ ...filter, dateTo: e.target.value })} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}><div className="spinner" /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Total Invoices</div>
              <div style={{ fontSize: "20px", fontWeight: 700 }}>{totals.count}</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Total Revenue</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--accent-green)" }}>₨ {totals.total.toLocaleString()}</div>
            </div>
            <div className="card" style={{ textAlign: "center" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "12px", marginBottom: "4px" }}>Total Sales Tax</div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "var(--secondary)" }}>₨ {totals.tax.toLocaleString()}</div>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "12px 20px", textAlign: "left" }}>Invoice #</th>
                  <th style={{ padding: "12px 20px", textAlign: "left" }}>Customer</th>
                  <th style={{ padding: "12px 20px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "12px 20px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "12px 20px", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 20px" }}>{inv.id}</td>
                    <td style={{ padding: "12px 20px", fontWeight: 600 }}>{inv.customer.CustomerName}</td>
                    <td style={{ padding: "12px 20px" }}>{new Date(inv.InvoiceDate).toLocaleDateString("en-PK")}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <span className={`badge badge-${inv.FBR_Status.toLowerCase()}`}>{inv.FBR_Status}</span>
                    </td>
                    <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600 }}>₨ {inv.TotalAmount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
