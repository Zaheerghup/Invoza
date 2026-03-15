"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

// A professional accounting/calculating animation
const LOTTIE_URL = "https://lottie.host/8e906b3e-7971-4835-9005-4c0792348570/6Kq5xI8iT5.json";

export default function LoadingScreen() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(LOTTIE_URL)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Lottie load error:", err));
  }, []);

  if (!animationData) return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--bg-app)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    }}>
       <div className="spinner" style={{ width: "40px", height: "40px" }} />
    </div>
  );

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
      transition: "opacity 0.5s ease"
    }}>
      <div style={{ width: "300px", height: "300px" }}>
        <Lottie animationData={animationData} loop={true} />
      </div>
      <div style={{ 
        marginTop: "20px", 
        fontSize: "18px", 
        fontWeight: 600, 
        color: "var(--primary)",
        letterSpacing: "1px"
      }}>
        INVOZA IS LOADING...
      </div>
    </div>
  );
}
