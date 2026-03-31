import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { user } = await req.json();

  if (!user?.id || !user?.email) {
    return new Response("Invalid user payload", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.name ?? "",
    role: user.user_metadata?.role ?? "Customer",
    reputation_score: 0,
    reputation_count: 0,
    is_verified: false,
  });

  if (error) {
    return new Response(JSON.stringify(error), { status: 500 });
  }

  return new Response("Profile created", { status: 200 });
});
