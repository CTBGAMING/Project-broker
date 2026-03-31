import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function ScoperAssignments() {
  const [projects, setProjects] = useState([]);
  const [scopers, setScopers] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data: p } = await supabase.from("projects").select("*").eq("category", "Construction");
    const { data: s } = await supabase.from("profiles").select("*").ilike("role", "scoper");
    setProjects(p || []);
    setScopers(s || []);
  }

  async function assign(projectId, scoperId) {
    await supabase.from("projects").update({ scoper_id: scoperId }).eq("id", projectId);
    alert("Scoper assigned");
  }

  return (
    <>
      <h1>Scoper Assignments</h1>

      {projects.map(p => (
        <div key={p.id} style={card}>
          <strong>{p.project_name}</strong>
          <select onChange={(e) => assign(p.id, e.target.value)}>
            <option>Select scoper</option>
            {scopers.map(s => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
        </div>
      ))}
    </>
  );
}

const card = { padding: 16, background: "#fff", borderRadius: 12, marginBottom: 12 };
