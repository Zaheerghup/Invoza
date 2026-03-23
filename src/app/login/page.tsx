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
    <div className="flex flex-col lg:flex-row justify-center items-center min-h-screen w-full bg-[var(--bg-app)] gap-4 lg:gap-20 p-6 lg:p-12">
      
      {/* SEO Optimized Context Panel (Desktop visible mostly, or stacked on mobile) */}
      <div className="max-w-lg hidden md:flex flex-col gap-4 text-[var(--text-main)] mb-10 lg:mb-0 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white shadow-lg">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
          <span className="text-2xl font-black tracking-tighter">Invoza</span>
        </div>
        
        <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-2">
          Professional FBR POS Integration & Core Accounting
        </h2>
        
        <h3 className="text-lg text-[var(--text-muted)] font-medium mt-2 leading-relaxed max-w-md">
          Scale your business effortlessly today with automated sales tax calculations, seamless CSV metadata imports, and real-time backend FBR synchronization.
        </h3>
        
        <div className="mt-10 grid gap-8">
          <div className="flex gap-4 items-start">
             <div className="mt-1 bg-[var(--success)]/10 p-2.5 rounded-xl text-[var(--success)] shadow-sm">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </div>
             <div>
               <h4 className="font-bold text-lg text-[var(--text-main)]">FBR Verified Compliance Engine</h4>
               <p className="text-[15px] text-[var(--text-muted)] leading-relaxed mt-1 max-w-[350px]">Instantly generate and digitally transmit valid S.R.O integrated streaming payloads directly to the Federal Board of Revenue.</p>
             </div>
          </div>
          <div className="flex gap-4 items-start">
             <div className="mt-1 bg-[var(--secondary)]/10 p-2.5 rounded-xl text-[var(--secondary)] shadow-sm">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
             </div>
             <div>
               <h4 className="font-bold text-lg text-[var(--text-main)]">Dynamic Financial Architecture</h4>
               <p className="text-[15px] text-[var(--text-muted)] leading-relaxed mt-1 max-w-[350px]">Maintain sophisticated item catalogs, process recurring enterprise transactions, and intelligently analyze aggregate net revenue algorithms.</p>
             </div>
          </div>
        </div>
      </div>

      <div className="card w-full max-w-[420px] p-10 shadow-2xl border border-[var(--border-light)] relative z-10 lg:-mt-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black mb-2 tracking-tight">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-[var(--text-muted)] text-[15px] font-medium">
            {mode === "login" ? "Login to access Invoza accounting" : "Join Invoza — Professional Accounting"}
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
