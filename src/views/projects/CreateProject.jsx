import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Tiling",
  "Painting",
  "Carpentry",
  "Roofing",
];

export default function CreateProject() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function toggleCategory(cat) {
    setCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      if (!title || categories.length === 0) {
        throw new Error("Project title and at least one category are required");
      }

      // 1️⃣ Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title,
          description,
          location,
          is_emergency: isEmergency,
          customer_id: user.id,
          status: "open",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2️⃣ Create project items (one per category)
      const items = categories.map((cat, index) => ({
        project_id: project.id,
        category: cat,
        sequence_order: index + 1,
        status: "pending",
      }));

      const { error: itemsError } = await supabase
        .from("project_items")
        .insert(items);

      if (itemsError) throw itemsError;

      // 3️⃣ Done
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2>Create Project</h2>

      <form onSubmit={handleSubmit}>
        <label>Project Name</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 12 }}
        />

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ width: "100%", marginBottom: 12 }}
        />

        <label>Location</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />

        <label>
          <input
            type="checkbox"
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
          />{" "}
          Emergency job
        </label>

        <hr />

        <strong>Select categories</strong>
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <label>
              <input
                type="checkbox"
                checked={categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />{" "}
              {cat}
            </label>
          </div>
        ))}

        <br />

        <button disabled={loading}>
          {loading ? "Creating…" : "Create Project"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}
