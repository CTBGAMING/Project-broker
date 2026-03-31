import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminInspectionFees() {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFees();
  }, []);

  async function loadFees() {
    setLoading(true);
    const { data } = await supabase
      .from("inspection_fees")
      .select("*")
      .order("category");

    setFees(data || []);
    setLoading(false);
  }

  async function updateFee(id, newFee) {
    await supabase
      .from("inspection_fees")
      .update({ fee: newFee, updated_at: new Date() })
      .eq("id", id);

    loadFees();
  }

  async function toggleActive(id, active) {
    await supabase
      .from("inspection_fees")
      .update({ active: !active })
      .eq("id", id);

    loadFees();
  }

  return (
    <div>
      <h2 style={{ fontSize: 28, marginBottom: 20 }}>
        🔍 Inspection Fees (Paid After Job Completion)
      </h2>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table style={{ width: "100%", background: "#fff", borderRadius: 12 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={th}>Category</th>
              <th style={th}>Fee (ZAR)</th>
              <th style={th}>Active</th>
            </tr>
          </thead>

          <tbody>
            {fees.map(f => (
              <tr key={f.id}>
                <td style={td}>{f.category}</td>

                <td style={td}>
                  <input
                    type="number"
                    value={f.fee}
                    style={input}
                    onChange={(e) =>
                      updateFee(f.id, parseFloat(e.target.value))
                    }
                  />
                </td>

                <td style={td}>
                  <input
                    type="checkbox"
                    checked={f.active}
                    onChange={() => toggleActive(f.id, f.active)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th = { padding: 12, borderBottom: "1px solid #eee" };
const td = { padding: 12 };
const input = {
  padding: 6,
  borderRadius: 6,
  border: "1px solid #ccc",
  width: 100,
};
