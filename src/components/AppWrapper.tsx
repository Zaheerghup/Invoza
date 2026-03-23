"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // UI States
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/invoices?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-[var(--bg-app)]">
        <Sidebar />
        <div className="flex-1 flex flex-col w-full max-w-[100vw] overflow-y-auto relative">
          
          <header className="sticky top-0 z-30 flex items-center justify-end h-16 px-4 md:px-10 bg-[var(--bg-card)] border-b border-[var(--border-light)] gap-2 md:gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] w-full transition-colors">
            
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex-1 max-w-md flex items-center bg-gray-50 border border-[var(--border)] rounded-full px-4 py-1.5 animate-[fadeIn_0.2s_ease-out]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Search invoices or customers..." 
                  className="bg-transparent border-none outline-none w-full px-3 text-sm text-[var(--text-main)] font-semibold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="button" onClick={() => setIsSearchOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--danger)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </form>
            ) : (
              <>
                <button onClick={() => setIsHelpOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] rounded-full transition-colors hidden sm:flex" title="Tutorials & Help">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  <span>Help</span>
                </button>

                <div className="hidden sm:block w-[1px] h-6 bg-[var(--border-light)] mx-1"></div>

                <button onClick={() => setIsSearchOpen(true)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] rounded-full transition-colors" title="Search">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>

                <div className="relative" ref={notifRef}>
                  <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] rounded-full transition-colors" title="Notifications">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-[var(--danger)] rounded-full border border-white filter animate-pulse"></span>
                  </button>

                  {/* Notification Dropdown */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-3 w-[340px] bg-white border border-[var(--border-light)] rounded-2xl shadow-xl z-50 animate-[fadeIn_0.2s_ease-out] overflow-hidden">
                      <div className="flex justify-between items-center p-4 border-b border-[var(--border-light)] bg-gray-50">
                        <h3 className="font-bold text-[var(--text-main)] text-sm m-0">Notifications</h3>
                        <span className="text-[10px] uppercase font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded-full">System Active</span>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <div className="p-4 border-b border-[var(--border-light)] hover:bg-gray-50 cursor-pointer transition-colors relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)]"></div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                            <p className="text-xs font-black text-[var(--text-main)]">FBR Integration S.R.O 709</p>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1">System is securely transmitting real-time compliance packets to the gateway. Operating normally.</p>
                          <p className="text-[9px] text-[var(--text-light)] mt-2 font-bold tracking-wider">2 HOURS AGO</p>
                        </div>
                        <div className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="text-xs font-bold text-[var(--text-main)] mb-1 opacity-70">Tax Season Ready</p>
                          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed opacity-70">Your historical sales templates have been permanently migrated to the modern dashboard layout.</p>
                          <p className="text-[9px] text-[var(--text-light)] mt-2 font-bold tracking-wider opacity-70">YESTERDAY</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={() => router.push('/settings')} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-hover)] rounded-full transition-colors" title="Settings">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>

                <div 
                  className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs ml-2 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => router.push('/settings')}
                >
                  Z
                </div>
              </>
            )}
          </header>

          {/* Help Drawer Modal */}
          {isHelpOpen && (
            <div className="fixed inset-0 z-[100] flex justify-end">
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]" onClick={() => setIsHelpOpen(false)} />
              <div className="relative w-full max-w-md bg-[var(--bg-card)] h-full shadow-2xl overflow-y-auto animate-[slideLeft_0.3s_ease-out] flex flex-col border-l border-[var(--border-light)]">
                <div className="p-6 border-b border-[var(--border-light)] flex justify-between items-center bg-[var(--bg-app)]/50">
                  <h2 className="text-xl font-black text-[var(--text-main)] mb-0">Help & Tutorials</h2>
                  <button onClick={() => setIsHelpOpen(false)} className="p-2 bg-[var(--bg-card)] rounded-full shadow-sm text-[var(--text-muted)] hover:text-[var(--danger)]">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div className="p-6 flex-1 flex flex-col gap-6 text-[var(--text-main)]">
                  <div>
                    <h3 className="text-sm font-black text-[var(--primary)] uppercase tracking-wider mb-2">Getting Started</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">Welcome to Invoza, your central hub for FBR POS Invoice generation and tax enforcement tracking.</p>
                  </div>
                  
                  <div className="bg-[var(--bg-app)] rounded-2xl p-5 border border-[var(--border-light)] shadow-sm">
                    <h4 className="font-bold mb-3 text-sm text-[var(--text-main)]">How to create an Invoice?</h4>
                    <ol className="list-decimal pl-4 text-[13px] text-[var(--text-muted)] flex flex-col gap-2.5 font-medium leading-relaxed">
                      <li>Click the <span className="text-[var(--primary)] font-bold">Create Invoice</span> button anywhere on the Dashboard.</li>
                      <li>Select an existing Customer or quickly add a new one inline.</li>
                      <li>Add line items identically. The system mathematically applies the local S.R.O tax automatically.</li>
                      <li>Click Save. Your invoice is now staged securely as <strong>PENDING</strong>.</li>
                      <li>In the Invoices tab, click <strong>Submit to FBR</strong> to permanently transmit the packet seamlessly.</li>
                    </ol>
                  </div>

                  <div className="bg-[var(--bg-app)] rounded-2xl p-5 border border-[var(--border-light)] shadow-sm">
                    <h4 className="font-bold mb-2 text-sm text-[var(--text-main)]">Bulk Importing Data</h4>
                    <p className="text-[13px] text-[var(--text-muted)] leading-relaxed font-medium mb-3">You can instantly migrate hundreds of records via our custom CSV engine natively.</p>
                    <ul className="list-disc pl-4 text-[13px] text-[var(--text-muted)] flex flex-col gap-3 font-medium">
                      <li><strong>Customers:</strong> <code className="bg-[var(--bg-card)] px-1.5 py-0.5 rounded border border-[var(--border-light)] text-[11px] font-bold tracking-tight shadow-sm w-fit mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">CustomerName, NTN_CNIC, Address, BuyerType</code></li>
                      <li><strong>Invoices:</strong> <code className="bg-[var(--bg-card)] px-1.5 py-0.5 rounded border border-[var(--border-light)] text-[11px] font-bold tracking-tight shadow-sm w-fit mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap">CustomerName, InvoiceDate, PaymentMode...</code></li>
                    </ul>
                  </div>

                  <div className="bg-[var(--bg-app)] rounded-2xl p-5 border border-[var(--border-light)] shadow-sm">
                    <h4 className="font-bold mb-2 text-sm text-[var(--text-main)]">Managing the Dashboard</h4>
                    <p className="text-[13px] text-[var(--text-muted)] leading-relaxed font-medium">
                      Your dashboard automatically calculates aggregate revenue seamlessly across all submitted and pending invoices recursively. Navigate using the sidebar to switch dynamically between <span className="font-black text-[var(--text-main)] tracking-tight">Midnight, Emerald, and Indigo</span> themes!
                    </p>
                  </div>

                </div>
                <div className="p-6 border-t border-[var(--border-light)] bg-[var(--bg-app)]/50 text-center">
                   <p className="text-xs text-[var(--text-muted)] font-bold">Still need help? <a href="mailto:support@invoza.com" className="text-[var(--secondary)] hover:underline ml-1">Contact Support</a></p>
                </div>
              </div>
              <style jsx>{`
                @keyframes slideLeft {
                  from { transform: translateX(100%); opacity: 0; }
                  to { transform: translateX(0); opacity: 1; }
                }
              `}</style>
            </div>
          )}

          <main className="flex-1 flex flex-col w-full max-w-[1600px] px-4 pt-6 pb-6 md:px-10 md:py-8 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
