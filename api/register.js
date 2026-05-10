// Vercel serverless function — POST /api/register
// Creates/updates an Ontraport contact and subscribes them to the
// "Apr 2026 Coherent Wealth Welcome" campaign (ID 255).
//
// Required env vars (set in Vercel project settings):
//   ONTRAPORT_API_KEY  — Ontraport → Admin → Ontraport API → New API Key
//   ONTRAPORT_APP_ID   — Same screen as the key
//   ONTRAPORT_CAMPAIGN_ID  — defaults to 255

const ONTRAPORT_BASE = "https://api.ontraport.com/1";
const CAMPAIGN_ID = process.env.ONTRAPORT_CAMPAIGN_ID || "255";

function ontraportHeaders() {
  return {
    "Api-Key": process.env.ONTRAPORT_API_KEY,
    "Api-Appid": process.env.ONTRAPORT_APP_ID,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

async function ontraport(path, params, method = "POST") {
  const isGet = method === "GET";
  const qs = isGet && params ? "?" + new URLSearchParams(params).toString() : "";
  const body = isGet ? undefined : new URLSearchParams(params || {}).toString();
  const res = await fetch(`${ONTRAPORT_BASE}${path}${qs}`, {
    method,
    headers: ontraportHeaders(),
    ...(isGet ? {} : { body }),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`Ontraport ${path} ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.ONTRAPORT_API_KEY || !process.env.ONTRAPORT_APP_ID) {
    return res.status(500).json({ error: "Server is missing Ontraport credentials" });
  }

  try {
    const { firstName, lastName, email, referrer, optin } = req.body || {};

    if (!email || !firstName || !lastName) {
      return res.status(400).json({ error: "First name, last name and email are required" });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    // 1) Create or update the contact
    const noteParts = [];
    if (referrer)             noteParts.push(`Referred by: ${referrer}`);
    if (optin === true || optin === "on" || optin === "true") noteParts.push("Opted in to ongoing content");
    noteParts.push(`Source: Coherent Wealth landing page · ${new Date().toISOString()}`);

    const saveRes = await ontraport("/objects/saveorupdate", {
      objectID: 0,
      email,
      firstname: firstName,
      lastname: lastName,
      notes: noteParts.join(" · "),
    });

    const contactId =
      saveRes?.data?.id ||
      saveRes?.data?.attrs?.id ||
      saveRes?.data?.unique_id;

    if (!contactId) {
      console.error("Ontraport saveorupdate returned no id", saveRes);
      return res.status(502).json({ error: "Could not create contact" });
    }

    // 2) Fetch all campaign builder items across pages to find the Coherent Wealth campaign
    const [page1, page2, page3] = await Promise.all([
      ontraport("/CampaignBuilderItems", { objectID: 0, start: 0,  range: 50 }, "GET").catch(e => ({ error: e.message })),
      ontraport("/CampaignBuilderItems", { objectID: 0, start: 50, range: 50 }, "GET").catch(e => ({ error: e.message })),
      ontraport("/CampaignBuilderItems", { objectID: 0, start: 100, range: 50 }, "GET").catch(e => ({ error: e.message })),
    ]);
    const allItems = [
      ...(page1?.data || []),
      ...(page2?.data || []),
      ...(page3?.data || []),
    ];
    const cwItems = allItems.filter(i => i.name && i.name.toLowerCase().includes("coherent"));
    const item255 = allItems.find(i => i.id === "255");

    return res.status(200).json({ ok: true, contactId, cwItems, item255, totalFound: allItems.length });
  } catch (err) {
    console.error("Register handler failed", err, err.body);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
};
