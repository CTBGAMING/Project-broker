import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

const SKILLS = [
  "Plumbing",
  "Electrical",
  "Tiling",
  "Painting",
  "Carpentry",
  "Roofing",
  "Waterproofing",
  "Renovations",
];

export default function ContractorOnboarding() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("skills, verification_status, verification_notes")
        .eq("id", user.id)
        .single();

      setSkills(profile?.skills || []);
      setStatus(profile?.verification_status || "pending");
      setNotes(profile?.verification_notes || null);

      if (profile?.verification_status === "approved") {
        navigate("/dashboard");
      }
    }

    load();
  }, [navigate]);

  function toggleSkill(skill) {
    setSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  }

  async function uploadFile(file, name) {
    if (!file || !user) return;

    setUploading(true);

    const path = `${user.id}/${name}`;

    const { error } = await supabase.storage
      .from("contractor_documents")
      .upload(path, file, { upsert: true });

    setUploading(false);

    if (error) throw error;
  }

  async function submitForReview() {
    setError(null);

    if (skills.length === 0) {
      setError("Select at least one skill");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        skills,
        verification_status: "pending",
        verification_notes: null,
      })
      .eq("id", user.id);

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    alert("Submitted for review");
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Contractor Onboarding</h2>

      {status === "pending" && (
        <p style={{ color: "orange" }}>
          Your application is pending review.
        </p>
      )}

      {status === "rejected" && (
        <p style={{ color: "red" }}>
          Application rejected: {notes || "No notes provided"}
        </p>
      )}

      <hr />

      <h3>Select Your Skills</h3>

      {SKILLS.map((skill) => (
        <label key={skill} style={{ display: "block" }}>
          <input
            type="checkbox"
            checked={skills.includes(skill)}
            onChange={() => toggleSkill(skill)}
          />{" "}
          {skill}
        </label>
      ))}

      <hr />

      <h3>Upload Documents</h3>

      <input
        type="file"
        onChange={(e) => uploadFile(e.target.files[0], "id_document")}
      />
      <br />
      <input
        type="file"
        onChange={(e) => uploadFile(e.target.files[0], "proof_of_address")}
      />

      {uploading && <p>Uploading…</p>}

      <hr />

      <button onClick={submitForReview} disabled={submitting}>
        {submitting ? "Submitting…" : "Submit for Verification"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
