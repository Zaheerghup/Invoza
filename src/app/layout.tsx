import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Invoza | Professional Accounting & FBR Integration",
  description: "Invoza — Advanced accounting and FBR-compliant digital invoicing for Pakistani businesses. Created by Zaheer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
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
      </body>
    </html>
  );
}
