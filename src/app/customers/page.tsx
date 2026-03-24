"use client";

import { useEffect, useState, useRef } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import { parseCSV } from "@/utils/csvParser";

interface Customer {
  id: number;
  CustomerName: string;
  NTN_CNIC: string | null;
  Address: string | null;
  Province: string;
  BuyerType: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    CustomerName: "", NTN_CNIC: "", Address: "", Province: "Punjab", BuyerType: "Unregistered",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  // File Upload Logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  async function fetchCustomers() {
    setError(null);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch customers");
      }
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCustomers(); }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImporting(true);
        setError(null);
        const csvText = event.target?.result as string;
        const parsedData = parseCSV(csvText);

        const res = await fetch("/api/customers/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsedData)
        });
        
        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          fetchCustomers();
        } else {
          setError(data.error);
        }
      } catch (err: any) {
        setError("Failed to parse CSV: " + err.message);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setForm({ CustomerName: "", NTN_CNIC: "", Address: "", Province: "Punjab", BuyerType: "Unregistered" });
        setEditingCustomer(null);
        setShowAdd(false);
        fetchCustomers();
      } else {
        setError(data.error || "Failed to save customer");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setForm({
      CustomerName: customer.CustomerName,
      NTN_CNIC: customer.NTN_CNIC || "",
      Address: customer.Address || "",
      Province: customer.Province || "Punjab",
      BuyerType: customer.BuyerType,
    });
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setEditingCustomer(null);
    setForm({ CustomerName: "", NTN_CNIC: "", Address: "", Province: "Punjab", BuyerType: "Unregistered" });
    setShowAdd(false);
  }

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      <div className="flex justify-between items-start mb-8 gap-4 flex-wrap">
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
            Customers
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "6px", fontSize: "14px", fontWeight: 500 }}>
            Manage your registered buyers and tax profiles
          </p>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap">
          
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: "none" }} 
          />
          
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            className="btn-secondary" 
            style={{ padding: "10px 16px" }}
            disabled={importing}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            {importing ? "Importing..." : "Bulk Import CSV"}
          </button>
          
          <button onClick={() => fetchCustomers()} className="btn-secondary" style={{ padding: "10px 16px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg>
          </button>

          <button onClick={() => {
            if (showAdd) handleCancel();
            else setShowAdd(true);
          }} className="btn-primary flex gap-1 items-center">
            {showAdd ? "X Close" : <>
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
               Add Customer
             </>}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          background: "rgba(239,68,68,0.1)", 
          border: "1px solid rgba(239,68,68,0.3)", 
          borderRadius: "12px", 
          padding: "16px 20px", 
          color: "#cf1322", 
          marginBottom: "32px",
          fontSize: "14px",
          fontWeight: 600
        }}>
          <strong>System Message:</strong> {error}
        </div>
      )}

      {showAdd && (
        <div className="card border border-[var(--border-light)] shadow-sm" style={{ marginBottom: "32px", maxWidth: "600px" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "20px", color: "var(--text-main)", fontWeight: 800 }}>
            {editingCustomer ? "Edit Customer" : "Add New Customer"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="label">Customer Name</label>
                  <input className="input-field" value={form.CustomerName}
                    onChange={e => setForm({ ...form, CustomerName: e.target.value })} required />
                </div>
                <div>
                  <label className="label">NTN / CNIC</label>
                  <input className="input-field" value={form.NTN_CNIC} placeholder="e.g. 42101-1234567-1"
                    onChange={e => setForm({ ...form, NTN_CNIC: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="label">Registration Type <span style={{fontSize:"10px",color:"var(--accent-red)"}}>FBR Required</span></label>
                  <select className="input-field" value={form.BuyerType}
                    onChange={e => setForm({ ...form, BuyerType: e.target.value })}>
                    <option value="Unregistered">Unregistered</option>
                    <option value="Registered">Registered</option>
                  </select>
                </div>
                <div>
                  <label className="label">Province <span style={{fontSize:"10px",color:"var(--accent-red)"}}>FBR Required</span></label>
                  <select className="input-field" value={form.Province}
                    onChange={e => setForm({ ...form, Province: e.target.value })}>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                    <option value="Azad Jammu & Kashmir">Azad Jammu & Kashmir</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                  </select>
                </div>
              </div>



              <div>
                <label className="label">Address</label>
                <textarea className="input-field" value={form.Address} rows={2}
                  onChange={e => setForm({ ...form, Address: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ width: "fit-content" }}>
                  {submitting ? "Saving..." : (editingCustomer ? "Update Customer" : "Save Customer")}
                </button>
                {editingCustomer && (
                  <button type="button" onClick={handleCancel} className="btn-secondary" style={{ width: "fit-content" }}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      {loading || importing ? (
        <LoadingScreen inline message={importing ? "Processing CSV..." : "Loading customers..."} />
      ) : customers.length === 0 ? (
        <div className="card shadow-sm border border-[var(--border-light)]" style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4 opacity-50"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <div className="font-bold text-lg mb-2 text-[var(--text-main)]">No customers found</div>
          Add your first customer by clicking above or Bulk Importing a CSV to start invoicing effortlessly.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customers.map(c => (
            <div key={c.id} className="card border border-[var(--border-light)] shadow-sm hover:shadow-md transition-shadow" style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "4px solid var(--primary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text-main)" }}>{c.CustomerName}</span>
                  <span className="badge" style={{ background: "rgba(14, 165, 233, 0.1)", color: "var(--secondary)", border: "1px solid rgba(14, 165, 233, 0.2)", width: "fit-content" }}>{c.BuyerType}</span>
                </div>
                <button 
                  onClick={() => handleEdit(c)}
                  className="btn-secondary" 
                  style={{ fontSize: "12px", padding: "6px 16px" }}
                >
                  Edit
                </button>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                <div style={{ marginBottom: "6px" }}>NTN/CNIC: <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{c.NTN_CNIC || "N/A"}</span></div>
                <div>Address: {c.Address || "No address provided"}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
