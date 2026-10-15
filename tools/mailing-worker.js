/* Mailing in a Bottle: Cloudflare Worker that adds a signup to Sender.net.
   The site is static, so the Sender API token can't live in the page (anyone could read it and
   take over the list). The site's forms post here instead, and this Worker holds the token as a secret.

   Cloudflare settings (Worker > Settings > Variables and Secrets):
     SENDER_API_TOKEN  secret  Sender > Settings > API access tokens
     SENDER_GROUP_ID   text    the group signups join (the ID in the group's page address)
     ALLOWED_ORIGINS   text    optional, comma-separated; defaults to the voidsailors.com origins below

   The site sends a normal form post (field "email", plus the "website" bot trap) and reads back
   JSON: {ok: true} or {ok: false, error: "..."} with a reader-friendly message. */

const DEFAULT_ORIGINS = "https://voidsailors.com,https://www.voidsailors.com";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",").map((o) => o.trim());
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    const reply = (status, body) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return reply(405, { ok: false, error: "Use the signup form on voidsailors.com." });
    if (!allowed.includes(origin)) return reply(403, { ok: false, error: "Please sign up on voidsailors.com." });

    let fields;
    try {
      const type = request.headers.get("Content-Type") || "";
      fields = type.includes("application/json")
        ? await request.json()
        : Object.fromEntries(await request.formData());
    } catch {
      return reply(400, { ok: false, error: "That didn’t go through. Please try again." });
    }
    if (fields.website) return reply(200, { ok: true }); // bot trap: look successful, add nothing

    const email = String(fields.email || "").trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 254) {
      return reply(400, { ok: false, error: "Please enter a valid email address." });
    }
    if (!env.SENDER_API_TOKEN || !env.SENDER_GROUP_ID) {
      return reply(503, { ok: false, error: "Mailing in a Bottle opens soon. Please try again later." });
    }

    const sender = await fetch("https://api.sender.net/v2/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.SENDER_API_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // trigger_automation lets the group's welcome (confirmation) email go out.
      body: JSON.stringify({ email, groups: [env.SENDER_GROUP_ID], trigger_automation: true }),
    });
    if (sender.ok) return reply(200, { ok: true });

    const text = await sender.text();
    if (/already|exist/i.test(text)) return reply(200, { ok: true, existing: true });
    console.log("Sender refused the signup", sender.status, text.slice(0, 500));
    return reply(502, { ok: false, error: "That didn’t go through. Please try again." });
  },
};
