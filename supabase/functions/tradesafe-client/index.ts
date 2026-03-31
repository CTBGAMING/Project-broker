// supabase/functions/tradesafe-client/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const TRADESAFE_API_URL = Deno.env.get("TRADESAFE_API_URL");
const CLIENT_ID = Deno.env.get("TRADESAFE_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("TRADESAFE_CLIENT_SECRET");

if (!TRADESAFE_API_URL || !CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Missing TradeSafe environment variables");
}

// ---------------------------------------------
// FETCH OAUTH ACCESS TOKEN (CLIENT CREDENTIALS)
// ---------------------------------------------
async function getAccessToken(): Promise<string> {
  const response = await fetch(
    "https://api-sandbox.tradesafe.dev/oauth/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TradeSafe OAuth failed: ${text}`);
  }

  const json = await response.json();
  return json.access_token;
}

// ---------------------------------------------
// EXECUTE GRAPHQL REQUEST
// ---------------------------------------------
async function executeGraphQL(query: string, variables?: any) {
  const token = await getAccessToken();

  const response = await fetch(TRADESAFE_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      `TradeSafe GraphQL error: ${JSON.stringify(result.errors)}`
    );
  }

  return result.data;
}

// ---------------------------------------------
// HTTP HANDLER
// ---------------------------------------------
serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { query, variables } = await req.json();

    if (!query) {
      return new Response("Missing GraphQL query", { status: 400 });
    }

    const data = await executeGraphQL(query, variables);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
