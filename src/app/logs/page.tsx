"use client";

import { useEffect, useState } from "react";

interface Log {
  id: number;
  action: string;
  details: string | null;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/logs");
        setLogs(await res.json());
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div className="animate-in">
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
          System History
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px" }}>
          Audit trail of all actions performed in your account
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}><div className="spinner" /></div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          No history available yet.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>Action</th>
                <th style={{ padding: "12px 20px", textAlign: "left", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>Details</th>
                <th style={{ padding: "12px 20px", textAlign: "right", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 700, color: "var(--text-main)" }}>
                    {log.action}
                  </td>
                  <td style={{ padding: "16px 20px", color: "var(--text-secondary)" }}>
                    {log.details || "—"}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: "right", color: "var(--text-muted)", fontSize: "12px" }}>
                    {new Date(log.createdAt).toLocaleString("en-PK")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
