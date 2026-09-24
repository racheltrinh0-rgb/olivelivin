import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(() => {
  return new Response("DEPLOY TEST OK", {
    headers: {
      "Content-Type": "text/plain",
    },
  });
});
