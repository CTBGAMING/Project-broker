import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminSettings() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");

  const CATEGORIES = {
    fixed: "Global Fees (Applied to all ads)",
    inspection: "Work Category Fees (Applied based on trade)",
    service: "Optional Service Fees (Scoper, etc.)"
  };

  useEffect(() => {
    loadFees();
  }, []);

  async function loadFees() {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_fees")
      .select("*")
      .order("category");
    
    if (error) {
      console.error("Error loading fees:", error);
    } else {
      setFees(data || []);
    }
    setLoading(false);
  }

  async function updateFee(id, amount) {
    setSaveStatus("Saving...");
    const { error } = await supabase
      .from("platform_fees")
      .update({ 
        amount: Number(amount), 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) {
      alert("Update failed: " + error.message);
      setSaveStatus("Error!");
    } else {
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(""), 2000);
      loadFees();
    }
  }

  if (loading) return <div style={centerMsg}>Syncing Fees...</div>;

  return (
    <div style={container}>
      <header style={headerStyle}>
        <div>
          <h1 style={title}>Platform Financials</h1>
          <p style={subtitle}>Configure pricing for listings and inspections.</p>
        </div>
        {saveStatus && <div style={statusToast}>{saveStatus}</div>}
      </header>

      {fees.length === 0 ? (
        <div style={emptyState}>
          <h3>No Records Found</h3>
          <p>The table is empty. Please run the Repair SQL in Supabase.</p>
          <button onClick={loadFees} style={refreshBtn}>Refresh</button>
        </div>
      ) : (
        Object.entries(CATEGORIES).map(([key, label]) => {
          const categoryItems = fees.filter(f => f.category === key);
          if (categoryItems.length === 0) return null;

          return (
            <section key={key} style={section}>
              <h2 style={sectionTitle}>{label}</h2>
              <div style={listStack}>
                {categoryItems.map(f => (
                  <div key={f.id} style={feeCard}>
                    <div style={infoSide}>
                      <span style={feeName}>{f.label}</span>
                      <code style={feeCode}>{f.identifier}</code>
                    </div>
                    
                    <div style={inputSide}>
                      <span style={currencyLabel}>ZAR</span>
                      <input
                        type="number"
                        defaultValue={f.amount}
                        onBlur={(e) => updateFee(f.id, e.target.value)}
                        style={feeInput}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

/* ======================= 
   STYLES 
======================= */
const container = { maxWidth: 800, margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 };
const title = { fontSize: 28, fontWeight: 800, margin: 0 };
const subtitle = { color: "#666", fontSize: 14, marginTop: 4 };
const statusToast = { background: "#dcfce7", color: "#166534", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700 };
const section = { marginBottom: 35 };
const sectionTitle = { fontSize: 11, fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 15 };
const listStack = { display: "flex", flexDirection: "column", gap: 10 };
const feeCard = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", background: "#fff", borderRadius: 12, border: "1px solid #eee" };
const infoSide = { display: "flex", flexDirection: "column" };
const feeName = { fontSize: 15, fontWeight: 600 };
const feeCode = { fontSize: 10, color: "#999", marginTop: 2 };
const inputSide = { display: "flex", alignItems: "center", gap: 10 };
const currencyLabel = { fontSize: 12, fontWeight: 700, color: "#999" };
const feeInput = { width: 80, padding: "8px", borderRadius: 8, border: "1px solid #ddd", textAlign: "right", fontWeight: 700 };
const centerMsg = { padding: 100, textAlign: "center", color: "#666" };
const emptyState = { padding: 40, textAlign: "center", background: "#f9fafb", borderRadius: 16 };
const refreshBtn = { marginTop: 15, padding: "8px 20px", background: "#000", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };