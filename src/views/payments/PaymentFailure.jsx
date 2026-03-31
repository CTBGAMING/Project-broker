import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, LayoutDashboard } from "lucide-react";

function getStoredDashboardFallback() {
  const last = localStorage.getItem("pb_last_dashboard");
  if (last === "/customer/events" || last === "/customer/construction") return last;
  return "/customer/construction";
}

export default function PaymentFailure() {
  const navigate = useNavigate();
  const dashboardPath = useMemo(() => getStoredDashboardFallback(), []);

  return (
    <div style={container}>
      <div style={card}>
        <AlertTriangle size={60} color="#ef4444" />
        <h2 style={{ color: "#fff", marginTop: 20 }}>Payment Failed</h2>
        <p style={{ color: "#94a3b8", marginBottom: 30 }}>
          Your payment could not be completed. Please try again or use a different payment method.
        </p>

        <button style={btn} onClick={() => navigate(`${dashboardPath}?tab=progress`)}>
          <LayoutDashboard size={18} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}

const container = {
  minHeight: "100vh",
  background: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const card = {
  background: "#1e293b",
  padding: "50px",
  borderRadius: "35px",
  textAlign: "center",
  maxWidth: "420px",
  border: "1px solid rgba(255,255,255,0.1)",
};

const btn = {
  width: "100%",
  padding: "16px",
  borderRadius: "18px",
  background: "linear-gradient(135deg,#ffe08a,#f5c451)",
  color: "#1a0b2e",
  border: "none",
  fontWeight: "900",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};