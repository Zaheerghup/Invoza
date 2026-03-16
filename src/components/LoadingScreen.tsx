"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

// A high-end professional business character animation (Clean & Premium)
const LOTTIE_URL = "https://lottie.host/6475734e-096d-49f2-89b5-f350c779774a/RkK4jR7d7j.json";

// Cache the animation data globally to avoid re-fetching on every mount
let cachedAnimationData: any = null;

export default function LoadingScreen() {
  const [animationData, setAnimationData] = useState(cachedAnimationData);

  useEffect(() => {
    if (cachedAnimationData) return;

    fetch(LOTTIE_URL)
      .then((res) => res.json())
      .then((data) => {
        cachedAnimationData = data;
        setAnimationData(data);
      })
      .catch((err) => console.error("Lottie load error:", err));
  }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--bg-app)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      animation: "fadeIn 0.6s ease-out"
    }}>
      {/* Immersive Background Elements */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, var(--primary-light) 0%, transparent 70%)",
        opacity: 0.15,
        filter: "blur(60px)",
        zIndex: -1
      }} />

      {/* Main Character Animation */}
      <div style={{ 
        width: "450px", 
        height: "450px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "20px"
      }}>
        {animationData ? (
          <Lottie 
            animationData={animationData} 
            loop={true} 
            style={{ width: "100%", height: "100%" }} 
          />
        ) : (
          <div className="spinner" style={{ width: "60px", height: "60px" }} />
        )}
      </div>
      
      {/* Brand & Status */}
      <div style={{ textAlign: "center", animation: "slideUp 0.8s ease-out" }}>
        <h2 style={{ 
          margin: 0,
          fontSize: "28px", 
          fontWeight: 900, 
          color: "var(--primary)",
          letterSpacing: "6px",
          textTransform: "uppercase",
          opacity: 0.9
        }}>
          Invoza
        </h2>
        <div style={{ 
          marginTop: "16px",
          fontSize: "14px", 
          fontWeight: 700, 
          color: "var(--text-muted)",
          letterSpacing: "2px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          justifyContent: "center",
          textTransform: "uppercase"
        }}>
          <span className="pulse-dot" /> LOADING YOUR BUSINESS
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
