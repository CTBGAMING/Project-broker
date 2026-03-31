import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const { email, full_name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email" }),
        { status: 400 }
      );
    }

    // 🔹 Replace with your email provider later
    // For now this logs + confirms flow works
    console.log("Sending approval email to:", email);

    // MOCK EMAIL SEND (SAFE FOR NOW)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Approval email sent",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Email function error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send email" }),
      { status: 500 }
    );
  }
});
