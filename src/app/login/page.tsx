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
    <div className="flex justify-center items-center min-h-screen w-full bg-[var(--bg-app)]">
      <div className="card w-full max-w-[400px] p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            {mode === "login" ? "Login to access Invoza accounting" : "Join Invoza — Professional Accounting for Pakistan"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5">
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
              <div className="flex justify-between items-baseline">
                <label className="label">Password</label>
                {mode === "login" && (
                  <span onClick={handleResetPassword} className="text-xs text-[var(--secondary)] cursor-pointer font-semibold">Forgot?</span>
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
              <div className="text-[var(--danger)] text-[13px] p-2.5 bg-[#fff1f0] border border-[#ffa39e] rounded">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center p-3" disabled={loading}>
              {loading ? <span className="spinner" /> : (mode === "login" ? "Login" : "Sign Up")}
            </button>
          </div>
        </form>

        <div className="text-center mt-6 text-sm text-[var(--text-muted)]">
          {mode === "login" ? (
            <>Don&apos;t have an account? <span onClick={() => setMode("signup")} className="text-[var(--secondary)] cursor-pointer font-semibold">Sign Up</span></>
          ) : (
            <>Already have an account? <span onClick={() => setMode("login")} className="text-[var(--secondary)] cursor-pointer font-semibold">Login</span></>
          )}
        </div>
      </div>
    </div>
  );
}
