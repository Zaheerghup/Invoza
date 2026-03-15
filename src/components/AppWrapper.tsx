"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading or wait for hydration
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5s for a nice wow effect but not too long
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      {loading && <LoadingScreen />}
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ 
          flex: 1, 
          display: "flex",
          flexDirection: "column",
          maxWidth: "100vw",
          padding: "32px 40px",
          overflowX: "hidden"
        }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
