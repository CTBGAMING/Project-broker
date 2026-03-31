import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CustomerProjectBids({ projectId }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBids();
  }, []);

  async function fetchBids() {
    setLoading(true);

    const { data, error } = await supabase
      .from("bids")
      .select(`
        id,
        price,
        notes,
        status,
        created_at,
        profiles (
          full_name,
          email
        )
      `)
      .eq("project_item_id", projectId);

    if (!error) setBids(data || []);
    setLoading(false);
  }

  if (loading) return <p>Loading bids…</p>;

  if (!bids.length) return <p>No bids yet.</p>;

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Bids</h3>

      {bids.map((bid) => (
        <div
          key={bid.id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 10,
          }}
        >
          <strong>Contractor:</strong>{" "}
          {bid.profiles?.full_name || bid.profiles?.email}
          <br />
          <strong>Price:</strong> R{bid.price}
          <br />
          <strong>Notes:</strong> {bid.notes || "—"}
        </div>
      ))}
    </div>
  );
}
