"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

// A high-end professional business character animation (Clean & Premium)
const LOTTIE_URL = "https://lottie.host/6475734e-096d-49f2-89b5-f350c779774a/RkK4jR7d7j.json";

// Cache the animation data globally to avoid re-fetching on every mount
let cachedAnimationData: any = null;

interface LoadingScreenProps {
  inline?: boolean;
  message?: string;
}

export default function LoadingScreen({ inline = false, message = "LOADING YOUR BUSINESS" }: LoadingScreenProps) {
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

  if (inline) {
    return (
      <div className="flex flex-col items-center justify-center py-[60px] text-center">
        <div className="w-[220px] h-[220px] mb-4">
          {animationData ? (
            <Lottie animationData={animationData} loop={true} />
          ) : (
            <div className="spinner w-[40px] h-[40px] my-[90px] mx-auto" />
          )}
        </div>
        <div className="text-sm font-bold text-[var(--text-muted)] tracking-[1px] flex items-center gap-[10px] uppercase">
          <span className="pulse-dot" /> {message}
        </div>
        <style jsx>{`
          .pulse-dot {
            width: 6px;
            height: 6px;
            background: var(--primary);
            border-radius: 50%;
            animation: pulse 1.5s infinite ease-in-out;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          .spinner {
            border: 3px solid rgba(0, 0, 0, 0.1);
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-app)] flex flex-col items-center justify-center z-[9999] animate-[fadeIn_0.6s_ease-out]">
      {/* Immersive Background Elements */}
      <div className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle,var(--primary-light)_0%,transparent_70%)] opacity-15 blur-[60px] -z-10" />

      {/* Main Character Animation */}
      <div className="w-[450px] h-[450px] flex items-center justify-center mb-5">
        {animationData ? (
          <Lottie 
            animationData={animationData} 
            loop={true} 
            className="w-full h-full" 
          />
        ) : (
          <div className="spinner w-[60px] h-[60px]" />
        )}
      </div>
      
      {/* Brand & Status */}
      <div className="text-center animate-[slideUp_0.8s_ease-out]">
        <h2 className="m-0 text-[28px] font-black text-[var(--primary)] tracking-[6px] uppercase opacity-90">
          Invoza
        </h2>
        <div className="mt-4 text-sm font-bold text-[var(--text-muted)] tracking-[2px] flex items-center gap-3 justify-center uppercase">
          <span className="pulse-dot" /> {message}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
