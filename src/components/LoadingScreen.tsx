"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

// A high-end professional accounting/business animation
const LOTTIE_URL = "https://lottie.host/8e906b3e-7971-4835-9005-4c0792348570/6Kq5xI8iT5.json";

export default function LoadingScreen() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(LOTTIE_URL)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Lottie load error:", err));
  }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(244, 245, 248, 0.8)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: "fadeIn 0.4s ease-out"
    }}>
      <div style={{ 
        width: "320px", 
        height: "320px",
        background: "#ffffff",
        borderRadius: "40px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
        padding: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "30px"
      }}>
        {animationData ? (
          <Lottie animationData={animationData} loop={true} style={{ width: "100%", height: "100%" }} />
        ) : (
          <div className="spinner" style={{ width: "50px", height: "50px" }} />
        )}
      </div>
      
      <div style={{ textAlign: "center" }}>
        <h2 style={{ 
          margin: 0,
          fontSize: "22px", 
          fontWeight: 800, 
          color: "var(--primary)",
          letterSpacing: "4px",
          textTransform: "uppercase"
        }}>
          Invoza
        </h2>
        <div style={{ 
          marginTop: "12px",
          fontSize: "13px", 
          fontWeight: 600, 
          color: "var(--text-muted)",
          letterSpacing: "1px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          justifyContent: "center"
        }}>
          <span className="spinner-small" /> PROCESSING...
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .spinner-small {
          width: 12px;
          height: 12px;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
