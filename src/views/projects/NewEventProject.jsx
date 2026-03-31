import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function NewEventProject() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    project_name: "",
    location: "",
    budget: "",
    description: "",

    transport_needed: false,
    transport_notes: "",

    attire_style: "",
    attire_colors: "",

    decor_style: "",
    decor_notes: "",
  });

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  async function handleSubmit() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("You must be logged in");

      const fullDescription = `
${form.description}

--- EVENT DETAILS ---
Transport: ${form.transport_needed ? form.transport_notes : "Not required"}
Attire: ${form.attire_style || "Not specified"}
Colors: ${form.attire_colors || "Not specified"}
Decor: ${form.decor_style || "Not specified"}
Decor Notes: ${form.decor_notes || "None"}
      `;

      const { error } = await supabase.from("projects").insert([
        {
          owner_id: user.id,            // ✅ REQUIRED
          project_type: "events",       // ✅ REQUIRED (NOT NULL)
          project_name: form.project_name,
          location: form.location,
          budget: Number(form.budget),
          description: fullDescription,
          category: "Events",
          status: "open",
        },
      ]);

      if (error) throw error;

      navigate("/customer/events", { replace: true });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={page}>
      <div style={card}>
        <div style={stepLabel}>Step {step} of 5</div>
        <h2>🥂 Create Event</h2>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <input
              style={input}
              placeholder="Event name"
              value={form.project_name}
              onChange={(e) =>
                setForm({ ...form, project_name: e.target.value })
              }
            />
            <input
              style={input}
              placeholder="Location"
              value={form.location}
              onChange={(e) =>
                setForm({ ...form, location: e.target.value })
              }
            />
            <input
              style={input}
              type="number"
              placeholder="Budget (R)"
              value={form.budget}
              onChange={(e) =>
                setForm({ ...form, budget: e.target.value })
              }
            />
            <button style={goldBtn} onClick={next}>
              Next
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <h4>🚗 Transport</h4>
            <select
              style={input}
              onChange={(e) =>
                setForm({
                  ...form,
                  transport_needed: e.target.value === "yes",
                })
              }
            >
              <option value="no">No transport required</option>
              <option value="yes">Transport required</option>
            </select>

            {form.transport_needed && (
              <textarea
                style={input}
                placeholder="Transport details"
                onChange={(e) =>
                  setForm({ ...form, transport_notes: e.target.value })
                }
              />
            )}

            <nav style={nav}>
              <button onClick={back}>Back</button>
              <button onClick={next}>Next</button>
            </nav>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <h4>👗 Attire</h4>
            <input
              style={input}
              placeholder="Style (e.g. Formal, Traditional)"
              onChange={(e) =>
                setForm({ ...form, attire_style: e.target.value })
              }
            />
            <input
              style={input}
              placeholder="Color palette"
              onChange={(e) =>
                setForm({ ...form, attire_colors: e.target.value })
              }
            />

            <nav style={nav}>
              <button onClick={back}>Back</button>
              <button onClick={next}>Next</button>
            </nav>
          </>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <>
            <h4>🎨 Decor</h4>
            <input
              style={input}
              placeholder="Decor style"
              onChange={(e) =>
                setForm({ ...form, decor_style: e.target.value })
              }
            />
            <textarea
              style={input}
              placeholder="Decor notes"
              onChange={(e) =>
                setForm({ ...form, decor_notes: e.target.value })
              }
            />

            <nav style={nav}>
              <button onClick={back}>Back</button>
              <button onClick={next}>Next</button>
            </nav>
          </>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <>
            <h4>📋 Final Notes</h4>
            <textarea
              style={input}
              placeholder="Additional details"
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <nav style={nav}>
              <button onClick={back}>Back</button>
              <button
                style={goldBtn}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Submitting…" : "Post Event"}
              </button>
            </nav>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  maxWidth: "800px",
  margin: "40px auto",
};

const card = {
  background: "#fff",
  padding: "40px",
  borderRadius: "24px",
  border: "1px solid #eee",
};

const stepLabel = {
  color: "#B8860B",
  fontWeight: "bold",
};

const input = {
  width: "100%",
  padding: "12px",
  margin: "12px 0",
  borderRadius: "10px",
  border: "1px solid #ddd",
};

const goldBtn = {
  background: "#B8860B",
  color: "#fff",
  border: "none",
  padding: "14px",
  borderRadius: "12px",
  fontWeight: "bold",
};

const nav = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "10px",
};
