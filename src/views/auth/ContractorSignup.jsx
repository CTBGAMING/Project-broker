import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";

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

export default function ContractorSignup() {
  const navigate = useNavigate();

  const [companyName, setCompanyName] = useState("");
  const [repName, setRepName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState([]);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function toggleSkill(skill) {
    setSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!repName || !email || !password || skills.length === 0) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);

    // 1️⃣ Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setError("Account creation failed.");
      setLoading(false);
      return;
    }

    // 2️⃣ Update profile (LOWERCASE ROLE)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: repName,
        phone,
        skills,
        role: "contractor",
        verification_status: "pending",
        verification_notes: notes || null,
        verification_checklist: {
          company_name: companyName || null,
        },
      })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      navigate("/auth/login");
    }, 2500);
  }

  return (
    <div className="auth-container">
      <div className="card">
        <h1 className="auth-title">Contractor Application</h1>

        {error && <div style={{ color: "red" }}>{error}</div>}

        {success ? (
          <p style={{ color: "green" }}>
            Application submitted successfully.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              placeholder="Company Name (optional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            <input
              placeholder="Company Representative Name *"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="Email Address *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password *"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <div style={{ marginTop: 18 }}>
              <strong>Skills *</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {SKILLS.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Experience / background"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <button type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        )}

        <p>
          Already have an account? <Link to="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
