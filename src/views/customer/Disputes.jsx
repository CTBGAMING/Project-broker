import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CustomerDisputes() {
  const [user, setUser] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setLoading(false);
        return;
      }

      setUser(user);

      const { data, error } = await supabase
        .from("pricing_disputes")
        .select(`
          *,
          projects (
            id,
            project_name,
            status
          )
        `)
        .eq("customer_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
      } else {
        setDisputes(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function approveDispute(dispute) {
    if (
      !window.confirm(
        "Approving this dispute means you agree to pay the additional amount."
      )
    )
      return;

    setProcessing(true);

    const { data: paymentId, error } = await supabase.rpc(
      "approve_pricing_dispute",
      { dispute_uuid: dispute.id }
    );

    if (error) {
      alert(error.message);
      setProcessing(false);
      return;
    }

    alert("Dispute approved. Redirecting to payment…");

    // later: navigate(`/payments/checkout/${paymentId}`)
    setDisputes((d) => d.filter((x) => x.id !== dispute.id));
    setProcessing(false);
  }

  async function rejectDispute(dispute) {
    if (
      !window.confirm(
        `Rejecting this dispute will result in a R${dispute.callout_fee} call-out fee being charged.`
      )
    )
      return;

    setProcessing(true);

    const { error } = await supabase.rpc(
      "reject_pricing_dispute",
      { dispute_uuid: dispute.id }
    );

    if (error) {
      alert(error.message);
      setProcessing(false);
      return;
    }

    alert(
      "Dispute rejected. The job has been cancelled and a refund will be processed."
    );

    setDisputes((d) => d.filter((x) => x.id !== dispute.id));
    setProcessing(false);
  }

  if (loading) return <p>Loading disputes…</p>;

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <h2>Pricing Disputes</h2>

      {disputes.length === 0 && (
        <p>No disputes awaiting your decision.</p>
      )}

      {disputes.map((d) => (
        <div key={d.id} style={card}>
          <strong>{d.projects?.project_name || "Project"}</strong>

          <p>
            <strong>Original amount:</strong> R{d.original_amount}
          </p>
          <p>
            <strong>Revised amount:</strong> R{d.revised_amount}
          </p>

          <p>
            <strong>Reason provided:</strong>
            <br />
            {d.reason}
          </p>

          {Array.isArray(d.media_urls) && d.media_urls.length > 0 && (
            <>
              <strong>Evidence photos:</strong>
              <div style={photoGrid}>
                {d.media_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="evidence"
                    style={photo}
                  />
                ))}
              </div>
            </>
          )}

          <div style={actions}>
            <button
              style={approveBtn}
              disabled={processing}
              onClick={() => approveDispute(d)}
            >
              Approve & Pay Difference
            </button>

            <button
              style={rejectBtn}
              disabled={processing}
              onClick={() => rejectDispute(d)}
            >
              Reject (Call-out Fee Applies)
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= STYLES ================= */

const card = {
  background: "#fff",
  padding: 24,
  borderRadius: 16,
  marginBottom: 24,
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const photoGrid = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 8,
};

const photo = {
  width: 100,
  height: 100,
  objectFit: "cover",
  borderRadius: 8,
};

const actions = {
  display: "flex",
  gap: 12,
  marginTop: 20,
};

const approveBtn = {
  flex: 1,
  background: "#16a34a",
  color: "#fff",
  padding: 14,
  border: "none",
  borderRadius: 12,
  fontWeight: "bold",
};

const rejectBtn = {
  flex: 1,
  background: "#dc2626",
  color: "#fff",
  padding: 14,
  border: "none",
  borderRadius: 12,
  fontWeight: "bold",
};
