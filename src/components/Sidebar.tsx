"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const navItems = [
  { href: "/", label: "Dashboard", icon: "" },
  { href: "/invoices", label: "Invoices", icon: "" },
  { href: "/invoices/new", label: "Create Invoice", icon: "" },
  { href: "/customers", label: "Customers", icon: "" },
  { href: "/logs", label: "System History", icon: "" },
  { href: "/reports", label: "Reports", icon: "" },
  { href: "/settings", label: "Account Settings", icon: "" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (pathname === "/login") return null;

  return (
    <aside style={{
      width: "240px",
      minHeight: "100vh",
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      position: "sticky",
      top: 0,
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border-light)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            padding: "6px",
            background: "var(--primary)",
            borderRadius: "6px",
            color: "white",
            fontWeight: 800,
            fontSize: "18px",
            lineHeight: 1
          }}>INV</div>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-main)" }}>OZA</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "20px 0" }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 20px",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "white" : "var(--text-main)",
                background: isActive ? "var(--secondary)" : "transparent",
                borderLeft: isActive ? "4px solid var(--primary)" : "4px solid transparent",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "#f0f0f0";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "20px", background: "#f9fafb", borderTop: "1px solid var(--border-light)" }}>
        {user && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Logged in as</div>
            <div style={{ fontSize: "12px", color: "var(--text-main)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
            <button 
              onClick={handleLogout}
              style={{ background: "none", border: "none", padding: 0, color: "var(--danger)", fontSize: "12px", cursor: "pointer", marginTop: "4px", fontWeight: 600 }}
            >
              Sign out
            </button>
          </div>
        )}
        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>SYSTEM STATUS</div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "var(--success)" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)" }}></div>
          FBR Gateway Ready
        </div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "12px", borderTop: "1px solid #eee", paddingTop: "8px" }}>
          Created by <strong>Zaheer</strong>
        </div>
      </div>
    </aside>
  );
}
