"use client";

import { useEffect, useState } from "react";
import LoadingScreen from "@/components/LoadingScreen";

interface Log {
  id: number;
  action: string;
  details: string | null;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchLogs() {
    setError(null);
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch logs");
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch logs error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="animate-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
            System History
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px" }}>
            Audit trail of all actions performed in your account
          </p>
        </div>
        <button onClick={() => fetchLogs()} className="btn-secondary">Refresh</button>
      </div>

      {error && (
        <div style={{ 
          background: "rgba(239,68,68,0.1)", 
          border: "1px solid rgba(239,68,68,0.3)", 
          borderRadius: "8px", 
          padding: "16px 20px", 
          color: "#ef4444", 
          marginBottom: "32px",
          fontSize: "14px"
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "100px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          Loading audit trail...
        </div>
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
