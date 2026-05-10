/* Thank-you page — countdown, calendar links, reveals */

// ── Sessions data (single source of truth for calendar links) ─────────────
const SESSIONS = [
  {
    title: "Coherent Wealth · Session 1: The Hidden Cost of Contraction",
    startUTC: "20260427T110000Z", // Mon 27 Apr 7am ET
    endUTC:   "20260427T120000Z",
  },
  {
    title: "Coherent Wealth · Session 2: The Identity Reset",
    startUTC: "20260428T110000Z",
    endUTC:   "20260428T120000Z",
  },
  {
    title: "Coherent Wealth · Session 3: The Wealth Ecology",
    startUTC: "20260429T110000Z",
    endUTC:   "20260429T120000Z",
  },
  {
    title: "Coherent Wealth · Bonus Session: The Timeline Collapse",
    startUTC: "20260430T110000Z",
    endUTC:   "20260430T120000Z",
  },
];

const EVENT_DESC =
  "A four-session live experience with Louisa Havers. " +
  "Identity, nervous-system & frequency mastery for leaders ready to thrive in the new economy. " +
  "Replay link will be sent to your inbox after each session.";

// ── Countdown ──────────────────────────────────────────────────────────────
const TARGET = new Date("2026-04-27T11:00:00Z").getTime();

function pad(n) { return String(n).padStart(2, "0"); }

function tickCountdown() {
  const diff = Math.max(0, TARGET - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  document.getElementById("cd-days").textContent  = pad(d);
  document.getElementById("cd-hours").textContent = pad(h);
  document.getElementById("cd-mins").textContent  = pad(m);
  document.getElementById("cd-secs").textContent  = pad(s);
}
tickCountdown();
setInterval(tickCountdown, 1000);

// ── Reveal on scroll ───────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".reveal:not(.in)").forEach(el => revealObserver.observe(el));

// ── Google Calendar — one-click multi-day event with all sessions ─────────
// Google Calendar's add link only takes one event at a time, so we link to
// the first session and embed the full schedule into the description.
function googleCalendarLink() {
  const first = SESSIONS[0];
  const last  = SESSIONS[SESSIONS.length - 1];
  const lines = SESSIONS.map((s, i) => {
    const day = ["Mon 27 Apr", "Tue 28 Apr", "Wed 29 Apr", "Thu 30 Apr"][i];
    return `${day} · 7am ET / 12pm UK / 6pm ICT — ${s.title.split(": ")[1]}`;
  });
  const desc = EVENT_DESC + "\n\nFull schedule:\n" + lines.join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Coherent Wealth · Live with Louisa Havers (4 sessions)",
    dates: `${first.startUTC}/${last.endUTC}`,
    details: desc,
    location: "Online · Zoom",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const googleBtn = document.getElementById("add-google");
if (googleBtn) googleBtn.href = googleCalendarLink();

// ── Apple / Outlook — generate ICS file with all 4 sessions ───────────────
function buildICS() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const events = SESSIONS.map((s, i) => [
    "BEGIN:VEVENT",
    `UID:coherent-wealth-${i + 1}@louisahavers.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${s.startUTC}`,
    `DTEND:${s.endUTC}`,
    `SUMMARY:${s.title}`,
    `DESCRIPTION:${EVENT_DESC.replace(/\n/g, "\\n")}`,
    "LOCATION:Online · Zoom",
    "END:VEVENT",
  ].join("\r\n"));

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Louisa Havers//Coherent Wealth//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

const icsBtn = document.getElementById("add-ics");
if (icsBtn) {
  icsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const blob = new Blob([buildICS()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "coherent-wealth.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
