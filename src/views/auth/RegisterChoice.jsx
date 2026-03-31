import { useNavigate } from "react-router-dom";

export default function RegisterChoice() {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="card">
        <h1 className="auth-title">Create an Account</h1>

        <p className="muted" style={{ marginBottom: 28 }}>
          Choose which part of Project Broker you want to use.
        </p>

        <button
          className="button-gold"
          style={{ width: "100%", marginBottom: 14 }}
          onClick={() => navigate("/auth/register?division=construction")}
        >
          Construction Projects
        </button>

        <button
          className="button-outline"
          style={{ width: "100%" }}
          onClick={() => navigate("/auth/register?division=events")}
        >
          Event Planning
        </button>

        <hr />

        <p className="muted" style={{ textAlign: "center" }}>
          Already have an account?{" "}
          <a href="/auth/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}
