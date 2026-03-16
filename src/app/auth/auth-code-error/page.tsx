"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "20px" }}>
      <div className="card" style={{ maxWidth: "450px", width: "100%", padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "20px", color: "var(--danger)" }}>!</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>Authentication Error</h1>
        
        <div style={{ 
          background: "#fff1f0", 
          border: "1px solid #ffa39e", 
          borderRadius: "8px", 
          padding: "16px", 
          marginBottom: "24px",
          textAlign: "left"
        }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: 700, fontSize: "14px", color: "#cf1322" }}>
            {errorCode === "otp_expired" ? "Link Expired" : "Login Failed"}
          </p>
          <p style={{ margin: 0, fontSize: "13px", color: "#595959", lineHeight: "1.5" }}>
            {errorCode === "otp_expired" 
              ? "The confirmation link has expired or has already been used. Please try signing up again or requesting a new link." 
              : (errorDescription || "There was a problem verifying your account code. This can happen if the link is old or invalid.")}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <Link href="/login" style={{ width: "100%" }}>
            <button className="btn-primary" style={{ width: "100%" }}>Back to Login</button>
          </Link>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Need help? Make sure you use the most recent email sent to you.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={<div style={{ padding: "100px", textAlign: "center" }}>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
