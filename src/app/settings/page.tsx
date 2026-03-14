"use client";

import { useEffect, useState } from "react";

interface Company {
  id: number;
  NTN: string;
  BusinessName: string;
  Address: string;
  Province: string;
  API_Token: string;
}

const provinces = [
  "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan",
  "Islamabad Capital Territory", "Azad Jammu & Kashmir", "Gilgit-Baltistan",
];

export default function SettingsPage() {
  const [form, setForm] = useState({
    NTN: "", BusinessName: "", Address: "", Province: "", API_Token: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showToken, setShowToken] = useState(false);
  
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/companies");
        const companies: Company[] = await res.json();
        if (companies.length > 0) {
          const c = companies[0];
          setForm({ NTN: c.NTN, BusinessName: c.BusinessName, Address: c.Address, Province: c.Province, API_Token: c.API_Token });
        }
      } catch { /* empty */ } finally {
        setFetchLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage({ type: "", text: "" });

    try {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setPasswordMessage({ type: "error", text: error.message });
      } else {
        setPasswordMessage({ type: "success", text: "Password updated successfully!" });
        setPassword("");
      }
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: "Failed to update password." });
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>
          <span className="gradient-text">Company Settings</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px" }}>
          Configure your company details and FBR API credentials
        </p>
      </div>

      {fetchLoading ? (
        <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "60px 0" }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} /> Loading settings...
        </div>
      ) : (
        <div style={{ maxWidth: "600px" }}>
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: "20px" }}>
                {/* NTN */}
                <div>
                  <label className="label">NTN (National Tax Number)</label>
                  <input className="input-field" placeholder="e.g. 1234567-8" value={form.NTN}
                    onChange={(e) => setForm({ ...form, NTN: e.target.value })} required />
                </div>

                {/* Business Name */}
                <div>
                  <label className="label">Business Name</label>
                  <input className="input-field" placeholder="e.g. ABC Trading Co." value={form.BusinessName}
                    onChange={(e) => setForm({ ...form, BusinessName: e.target.value })} required />
                </div>

                {/* Address */}
                <div>
                  <label className="label">Business Address</label>
                  <textarea className="input-field" placeholder="Full business address" value={form.Address} rows={3}
                    onChange={(e) => setForm({ ...form, Address: e.target.value })} required
                    style={{ resize: "vertical" }} />
                </div>

                {/* Province */}
                <div>
                  <label className="label">Province / Territory</label>
                  <select className="input-field" value={form.Province}
                    onChange={(e) => setForm({ ...form, Province: e.target.value })} required>
                    <option value="">Select province...</option>
                    {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* API Token */}
                <div>
                  <label className="label">FBR API Token</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-field"
                      type={showToken ? "text" : "password"}
                      placeholder="Enter your FBR Bearer Token"
                      value={form.API_Token}
                      onChange={(e) => setForm({ ...form, API_Token: e.target.value })}
                      required
                      style={{ paddingRight: "100px" }}
                    />
                    <button type="button" onClick={() => setShowToken(!showToken)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px" }}>
                      {showToken ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                    Your API token is stored securely and used only for FBR API requests.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "12px 16px", color: "#ef4444", fontSize: "14px" }}>
                    {error}
                  </div>
                )}

                {/* Success */}
                {saved && (
                  <div style={{ background: "rgba(0,200,150,0.1)", border: "1px solid rgba(0,200,150,0.3)", borderRadius: "8px", padding: "12px 16px", color: "var(--accent-green)", fontSize: "14px" }}>
                    Company settings saved successfully!
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: "fit-content" }}>
                  {loading ? <><span className="spinner" /> Saving...</> : "Save Settings"}
                </button>
              </div>
            </form>
          </div>

          {/* Security Settings Card */}
          <div className="card" style={{ marginTop: "24px" }}>
            <h3 style={{ fontSize: "16px", marginBottom: "20px" }}>Security Settings</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div style={{ display: "grid", gap: "20px" }}>
                <div>
                  <label className="label">Update Password</label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                    This will update the password you use to log in to Invoza.
                  </p>
                </div>

                {passwordMessage.text && (
                  <div style={{
                    background: passwordMessage.type === "success" ? "rgba(0,200,150,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${passwordMessage.type === "success" ? "rgba(0,200,150,0.3)" : "rgba(239,68,68,0.3)"}`,
                    borderRadius: "8px", padding: "12px 16px",
                    color: passwordMessage.type === "success" ? "var(--accent-green)" : "#ef4444", fontSize: "14px"
                  }}>
                    {passwordMessage.text}
                  </div>
                )}

                <button type="submit" className="btn-secondary" disabled={passwordLoading} style={{ width: "fit-content" }}>
                  {passwordLoading ? <><span className="spinner" /> Updating...</> : "Update Password"}
                </button>
              </div>
            </form>
          </div>

          {/* Info Card */}
          <div style={{ marginTop: "24px", padding: "16px 20px", background: "#f0f7ff", border: "1px solid #d0e7ff", borderRadius: "4px" }}>
            <div style={{ fontSize: "13px", color: "var(--text-main)", lineHeight: "1.7" }}>
              <strong style={{ color: "var(--secondary)" }}>FBR Compliance Note</strong><br />
              This system complies with <strong>S.R.O. 709(I)/2025</strong>. Ensure your NTN matches the one registered with FBR for real-time invoice verification. You can obtain your API Token from the FBR Iris portal.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
