const API_URL = "https://api.sandbox.tradesafe.co.za";

/**
 * Gets the OAuth2 token from TradeSafe Sandbox
 */
async function getAuthToken() {
  const response = await fetch(`${API_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: import.meta.env.VITE_TRADESAFE_CLIENT_ID,
      client_secret: import.meta.env.VITE_TRADESAFE_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || "Failed to authenticate with TradeSafe");
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Initiates the Escrow transaction for the full project budget
 */
export async function initiateEscrow(project, user) {
  try {
    const token = await getAuthToken();

    // Calculate the total (Bid + Commission + Inspector Fee)
    const totalAmount = (project.bid_amount || 0) + (project.commission_amount || 0);

    const payload = {
      title: project.project_name,
      industry: "GENERAL_GOODS_SERVICES",
      currency: "ZAR",
      value: totalAmount,
      parties: [
        {
          role: "BUYER",
          email: user.email,
          name: user.user_metadata?.full_name || "Client",
        }
      ],
      settings: {
        workflow: "STANDARD",
        fee_allocation: "BUYER_PAYS"
      }
    };

    const response = await fetch(`${API_URL}/transaction`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return result.redirect_url; // The URL to send the customer to
  } catch (error) {
    console.error("TradeSafe Error:", error);
    return null;
  }
}