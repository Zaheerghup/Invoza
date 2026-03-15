import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import LoadingScreen from "@/components/LoadingScreen";
import { useState, useEffect } from "react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Invoza | Professional Accounting & FBR Integration",
  description: "Invoza — Advanced accounting and FBR-compliant digital invoicing for Pakistani businesses. Created by Zaheer.",
};

function AppContent({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading or wait for hydration
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // 1.5s for a nice wow effect but not too long
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
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
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <ThemeProvider>
          <AppContent>{children}</AppContent>
        </ThemeProvider>
      </body>
    </html>
  );
}
