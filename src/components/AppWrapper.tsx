"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem("invoza_loaded");
    if (hasLoaded) {
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem("invoza_loaded", "true");
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      {loading && <LoadingScreen />}
      <div className="flex min-h-screen bg-[var(--bg-app)]">
        <Sidebar />
        {/* Adjusted mobile paddings (px-4 pt-20 for hamburger space) and robust flex scaling */}
        <main className="flex-1 flex flex-col w-full max-w-[100vw] px-4 pt-20 pb-6 md:px-10 md:py-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
