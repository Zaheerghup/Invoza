"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
  { href: "/", label: "Dashboard", short: "DB" },
  { href: "/invoices", label: "Invoices", short: "IN" },
  { href: "/invoices/new", label: "Create Invoice", short: "CI" },
  { href: "/customers", label: "Customers", short: "CU" },
  { href: "/logs", label: "System History", short: "SH" },
  { href: "/reports", label: "Reports", short: "RP" },
  { href: "/settings", label: "Account Settings", short: "AS" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase.auth]);

  // Close mobile sidebar entirely on route change 
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (pathname === "/login") return null;

  return (
    <>
      <button 
        className="md:hidden fixed top-4 left-4 z-40 p-2.5 bg-white rounded-xl shadow-md border border-[var(--border-light)] text-[var(--text-main)] hover:bg-gray-50 hover:shadow-lg transition-all"
        onClick={() => setIsMobileOpen(true)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* Backdrop for Mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-md z-40 transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 left-0 z-50
        flex flex-col h-screen
        bg-[var(--bg-sidebar)] border-r border-[var(--border)]
        transition-all duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0 shadow-2xl rounded-r-[16px]" : "-translate-x-full md:translate-x-0"}
        ${isCollapsed ? "w-20" : "w-[260px]"}
      `}>
        
        {/* Collapse Toggle (Desktop Only) */}
        <button 
          className="hidden md:flex absolute -right-3.5 top-9 bg-white border border-[var(--border)] rounded-full w-7 h-7 items-center justify-center text-[var(--text-main)] shadow-md hover:scale-110 transition-all z-50 group"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""} group-hover:text-[var(--secondary)]`}>
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        {/* Mobile Close Button */}
        <button 
          className="md:hidden absolute right-4 top-4 p-2.5 bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-card-hover)] z-[60] transition-colors"
          onClick={() => setIsMobileOpen(false)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Brand Header */}
        <div className={`p-6 border-b border-[var(--border-light)] flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} transition-all min-h-[85px] overflow-hidden`}>
          <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl p-0.5 overflow-hidden transition-all hover:scale-105 duration-300">
             {/* Beautiful vector logo imported statically */}
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src="/logo.svg" alt="Invoza Logo" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="font-black text-[22px] tracking-[0.15em] text-[var(--text-main)] uppercase whitespace-nowrap opacity-90 transition-opacity duration-300 mt-1">
              Invoza
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center mx-3 my-1 rounded-xl transition-all duration-200 group relative
                  ${isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"}
                  ${isActive 
                    ? "bg-[var(--secondary)] text-white shadow-md shadow-blue-500/20 translate-x-1" 
                    : "text-[var(--text-main)] hover:bg-[var(--bg-card-hover)]"}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <div className={`
                  flex items-center justify-center font-bold text-[10px] rounded-lg
                  ${isCollapsed ? "w-9 h-9 text-xs" : "w-7 h-7"}
                  ${isActive ? "bg-white/25 text-white" : "bg-[var(--border-light)] text-[var(--text-muted)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors duration-300"}
                `}>
                  {item.short}
                </div>
                {!isCollapsed && (
                  <span className={`text-sm font-semibold truncate ${isActive ? "" : "opacity-80 group-hover:opacity-100"}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area (Themes, User, Status) */}
        <div className={`bg-[var(--bg-app)] border-t border-[var(--border-light)] transition-all overflow-hidden ${isCollapsed ? "p-3" : "p-5"}`}>
          <div className="mb-5 flex flex-col items-center md:items-start">
            {!isCollapsed && <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-2 tracking-[0.1em]">Theme</div>}
            <div className={`flex gap-2 ${isCollapsed ? "flex-col" : ""}`}>
              {[
                { id: "emerald", color: "#2ca01c" },
                { id: "indigo", color: "#4f46e5" },
                { id: "midnight", color: "#0f172a" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                  className={`w-5 h-5 rounded-full shadow-inner hover:scale-125 transition-transform duration-200 ${theme === t.id ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-app)] ring-[var(--text-main)]' : 'ring-1 ring-black/10'}`}
                  style={{ background: t.color }}
                />
              ))}
            </div>
          </div>

          {user && (
            <div className={`mb-4 flex flex-col ${isCollapsed ? "items-center" : ""}`}>
              {!isCollapsed && <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.1em] mb-1">Account</div>}
              {!isCollapsed && <div className="text-[11px] text-[var(--text-main)] font-bold truncate opacity-80">{user.email}</div>}
              <button 
                onClick={handleLogout}
                className={`text-[var(--danger)] font-bold cursor-pointer hover:underline opacity-90 hover:opacity-100 transition-all ${isCollapsed ? "text-[10px] mt-2" : "text-xs mt-1 text-left"}`}
                title="Sign out"
              >
                {isCollapsed ? "Exit" : "Sign out"}
              </button>
            </div>
          )}
          
          <div className={`flex items-center ${isCollapsed ? "justify-center mt-3" : "gap-2 mt-2"} text-[11px] font-bold text-[var(--success)]`}>
            <div className="relative flex items-center justify-center">
              <div className="absolute w-2.5 h-2.5 rounded-full bg-[var(--success)] opacity-40 animate-ping"></div>
              <div className="relative w-1.5 h-1.5 rounded-full bg-[var(--success)] shadow-sm"></div>
            </div>
            {!isCollapsed && <span className="opacity-90">Gateway Ready</span>}
          </div>
        </div>
      </aside>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 6px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: var(--accent);
        }
      `}</style>
    </>
  );
}
