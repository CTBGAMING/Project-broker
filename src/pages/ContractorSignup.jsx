import { useState } from "react";
import { supabase } from "../lib/supabase";

const CATEGORIES = [
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function toggleCategory(cat) {
    setCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError(null);

    if (
      !fullName ||
      !email ||
      !password ||
      !location ||
      categories.length === 0
    ) {
      setError("Please complete all fields.");
      return;
    }

    setLoading(true);

    // 1️⃣ Create auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2️⃣ Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        role: "Contractor",
        skills: categories,
        location,
        verification_status: "pending",
      })
      .eq("id", data.user.id);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
        <h2>Application Received ✅</h2>

        <p>
          Thanks for signing up, <strong>{fullName}</strong>.
        </p>

        <p>
          Your contractor account has been created. Before you can receive jobs,
          we need to verify your details.
        </p>

        <h4>Next steps:</h4>
        <ol>
          <li>Log in to your dashboard</li>
          <li>Upload verification documents</li>
          <li>Wait for approval (usually 24–48 hours)</li>
        </ol>

        <p style={{ marginTop: 16, fontWeight: "bold" }}>
          Contractors are approved manually to protect quality and payment
          security.
        </p>

        <a href="/login">
          <button style={{ marginTop: 20 }}>Go to Login</button>
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
      <h1>Join Project Broker</h1>
      <p>
        We’re onboarding verified service providers ahead of public launch.
      </p>

      <hr />

      <form onSubmit={handleSignup}>
        <label>Full Name</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <label>City / Area</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        />

        <strong>Trade Categories</strong>
        <div style={{ marginBottom: 12 }}>
          {CATEGORIES.map((cat) => (
            <label key={cat} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={categories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />{" "}
              {cat}
            </label>
          ))}
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Apply as Contractor"}
        </button>
      </form>

      <hr />

      <h4>Why contractors choose Project Broker</h4>
      <ul>
        <li>Escrow-protected payments</li>
        <li>Jobs inspected before funds are released</li>
        <li>No hidden fees</li>
        <li>Dispute protection</li>
      </ul>
    </div>
  );
}
