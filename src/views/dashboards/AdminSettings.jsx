import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminSettings() {
  const [inspectionFee, setInspectionFee] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "inspection_fee")
      .single();

    if (data) setInspectionFee(data.value);
  }

  async function save() {
    await supabase
      .from("platform_settings")
      .update({ value: inspectionFee })
      .eq("key", "inspection_fee");

    alert("Settings saved");
  }

  return (
    <>
      <h1>Platform Settings</h1>
      <p>Control platform-wide fees</p>

      <div style={card}>
        <label>Inspection Fee (R)</label>
        <input
          type="number"
          value={inspectionFee}
          onChange={(e) => setInspectionFee(Number(e.target.value))}
        />

        <button onClick={save}>Save</button>
      </div>
    </>
  );
}

const card = {
  background: "#fff",
  padding: "30px",
  borderRadius: "16px",
  maxWidth: "400px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
};
