import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function BidsView() {
  const [bids, setBids] = useState([]);

  useEffect(() => {
    supabase
      .from("bids")
      .select(`
        id,
        price,
        notes,
        profiles ( full_name ),
        project_items ( category )
      `)
      .then(({ data }) => setBids(data || []));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Review Bids</h2>

      {bids.map(b => (
        <div key={b.id}>
          <strong>{b.project_items.category}</strong>
          <p>Contractor: {b.profiles.full_name}</p>
          <p>Price: R{b.price}</p>
        </div>
      ))}
    </div>
  );
}
