import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_value: 100,
    discount_type: "percentage"
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) setCoupons(data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newCoupon.code) return alert("Please enter a code");
    
    const { error } = await supabase.from("coupons").insert([
      {
        code: newCoupon.code.toUpperCase().trim(),
        discount_value: Number(newCoupon.discount_value),
        discount_type: newCoupon.discount_type,
        active: true
      }
    ]);

    if (error) {
      alert(error.message);
    } else {
      setNewCoupon({ code: "", discount_value: 100, discount_type: "percentage" });
      loadCoupons();
    }
  }

  async function toggleStatus(id, currentStatus) {
    await supabase.from("coupons").update({ active: !currentStatus }).eq("id", id);
    loadCoupons();
  }

  async function deleteCoupon(id) {
    if (window.confirm("Delete this coupon?")) {
      await supabase.from("coupons").delete().eq("id", id);
      loadCoupons();
    }
  }

  return (
    <div style={container}>
      <h1 style={title}>Coupon Manager</h1>
      <p style={subtitle}>Generate codes for free ad listings or custom discounts.</p>

      <div style={formCard}>
        <div style={formRow}>
          <input
            style={input}
            placeholder="CODE (e.g. FREEAD)"
            value={newCoupon.code}
            onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
          />
          <input
            style={{ ...input, width: 80 }}
            type="number"
            value={newCoupon.discount_value}
            onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })}
          />
          <select
            style={input}
            value={newCoupon.discount_type}
            onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
          >
            <option value="percentage">% Off</option>
            <option value="fixed">ZAR Off</option>
          </select>
          <button onClick={handleCreate} style={btn}>Create</button>
        </div>
      </div>

      <div style={list}>
        {loading ? <p>Loading...</p> : coupons.map(c => (
          <div key={c.id} style={c.active ? card : inactiveCard}>
            <div>
              <div style={codeTxt}>{c.code}</div>
              <div style={metaTxt}>
                {c.discount_value}{c.discount_type === 'percentage' ? '%' : ' R'} Discount
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => toggleStatus(c.id, c.active)} style={secBtn}>
                {c.active ? "Disable" : "Enable"}
              </button>
              <button onClick={() => deleteCoupon(c.id)} style={delBtn}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const container = { padding: "20px", maxWidth: "800px" };
const title = { fontSize: 28, fontWeight: 800, margin: 0 };
const subtitle = { color: "#666", marginBottom: 30 };
const formCard = { background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #eee", marginBottom: 20 };
const formRow = { display: "flex", gap: 10 };
const input = { padding: "10px", borderRadius: "8px", border: "1px solid #ddd" };
const btn = { background: "#000", color: "#fff", border: "none", padding: "0 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" };
const list = { display: "flex", flexDirection: "column", gap: 10 };
const card = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #eee" };
const inactiveCard = { ...card, opacity: 0.5 };
const codeTxt = { fontWeight: 800, fontSize: 18 };
const metaTxt = { fontSize: 12, color: "#666" };
const secBtn = { padding: "5px 10px", borderRadius: "6px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const delBtn = { padding: "5px 10px", borderRadius: "6px", border: "none", background: "#fee2e2", color: "#b91c1c", cursor: "pointer" };