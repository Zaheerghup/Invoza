"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        alert("Check your email for the confirmation link!");
      }
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      });
      if (error) throw error;
      alert("Password reset link sent to your email.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh", 
      width: "100%",
      background: "var(--bg-app)"
    }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: "0 0 8px 0" }}>
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {mode === "login" ? "Login to access Invoza accounting" : "Join Invoza — Professional Accounting for Pakistan"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "20px" }}>
            <div>
              <label className="label">Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label className="label">Password</label>
                {mode === "login" && (
                  <span onClick={handleResetPassword} style={{ fontSize: "12px", color: "var(--secondary)", cursor: "pointer", fontWeight: 600 }}>Forgot?</span>
                )}
              </div>
              <input 
                type="password" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{ color: "var(--danger)", fontSize: "13px", padding: "10px", background: "#fff1f0", border: "1px solid #ffa39e", borderRadius: "4px" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "12px" }}>
              {loading ? <span className="spinner" /> : (mode === "login" ? "Login" : "Sign Up")}
            </button>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--text-muted)" }}>
          {mode === "login" ? (
            <>Don&apos;t have an account? <span onClick={() => setMode("signup")} style={{ color: "var(--secondary)", cursor: "pointer", fontWeight: 600 }}>Sign Up</span></>
          ) : (
            <>Already have an account? <span onClick={() => setMode("login")} style={{ color: "var(--secondary)", cursor: "pointer", fontWeight: 600 }}>Login</span></>
          )}
        </div>
      </div>
    </div>
  );
}
