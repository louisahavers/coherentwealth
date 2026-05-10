/* Coherent Wealth — interactive behaviours */

// ── Countdown ──────────────────────────────────────────────────────────────
const TARGET = new Date("2026-04-27T11:00:00Z").getTime();

function getTimeLeft() {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

function pad(n) { return String(n).padStart(2, "0"); }

function tickCountdown() {
  const t = getTimeLeft();
  document.getElementById("cd-days").textContent  = pad(t.d);
  document.getElementById("cd-hours").textContent = pad(t.h);
  document.getElementById("cd-mins").textContent  = pad(t.m);
  document.getElementById("cd-secs").textContent  = pad(t.s);
}
tickCountdown();
setInterval(tickCountdown, 1000);

// ── Reveal on scroll ────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("in");
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll(".reveal:not(.in)").forEach(el => revealObserver.observe(el));

// ── Parallax: hero glow + portrait ─────────────────────────────────────────
const heroGlow     = document.querySelector(".hero__glow");
const heroPortrait = document.getElementById("hero-portrait");

window.addEventListener("scroll", () => {
  const y = window.scrollY;
  if (heroGlow)     heroGlow.style.transform = `translateY(${y * 0.25}px)`;
  if (heroPortrait && y < window.innerHeight)
    heroPortrait.style.transform = `translateY(${y * -0.04}px)`;
}, { passive: true });

// ── Session accordion ───────────────────────────────────────────────────────
document.querySelectorAll(".session").forEach(el => {
  el.addEventListener("click", () => {
    const isOpen = el.classList.contains("is-open");
    // close all
    document.querySelectorAll(".session.is-open").forEach(s => s.classList.remove("is-open"));
    // toggle clicked
    if (!isOpen) el.classList.add("is-open");
  });
});

// ── FAQ accordion ───────────────────────────────────────────────────────────
document.querySelectorAll(".faq__item").forEach(el => {
  el.addEventListener("click", () => {
    el.classList.toggle("is-open");
  });
});

// ── Testimonials auto-rotate ────────────────────────────────────────────────
const testimonials = Array.from(document.querySelectorAll(".testimonial"));
const dots         = Array.from(document.querySelectorAll(".testimonials__dot"));
let current = 0;

function goTo(idx) {
  testimonials[current].classList.remove("is-active");
  dots[current].classList.remove("is-active");
  current = idx;
  testimonials[current].classList.add("is-active");
  dots[current].classList.add("is-active");
}

dots.forEach(dot => {
  dot.addEventListener("click", () => {
    clearInterval(rotateTimer);
    goTo(Number(dot.dataset.dot));
    rotateTimer = setInterval(() => goTo((current + 1) % testimonials.length), 5500);
  });
});

let rotateTimer = setInterval(() => goTo((current + 1) % testimonials.length), 5500);

// ── Sticky CTA ──────────────────────────────────────────────────────────────
const stickyCta = document.getElementById("sticky-cta");

window.addEventListener("scroll", () => {
  stickyCta.classList.toggle("is-visible", window.scrollY > window.innerHeight * 0.9);
}, { passive: true });

// ── Registration modal ─────────────────────────────────────────────────────
const modal = document.getElementById("register-modal");

function openModal() {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setTimeout(() => {
    const first = modal.querySelector("input");
    if (first) first.focus();
  }, 350);
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

document.querySelectorAll(".js-open-modal").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });
});

modal.querySelectorAll("[data-close]").forEach(el => {
  el.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
});

const registerForm = document.getElementById("register-form");
const submitBtn    = document.getElementById("modal-submit");
const errorBox     = document.getElementById("modal-error");

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = false;
}
function clearError() {
  errorBox.hidden = true;
  errorBox.textContent = "";
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const fd = new FormData(e.target);
  const payload = {
    firstName: (fd.get("firstName") || "").trim(),
    lastName:  (fd.get("lastName")  || "").trim(),
    email:     (fd.get("email")     || "").trim(),
    referrer:  (fd.get("referrer")  || "").trim(),
    optin:     fd.get("optin") === "on",
  };

  if (!payload.firstName || !payload.lastName || !payload.email) {
    showError("Please fill in your name and email.");
    return;
  }

  submitBtn.classList.add("is-loading");

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Something went wrong. Please try again.");
    }

    registerForm.reset();
    window.location.href = "/thank-you.html";
    return;
  } catch (err) {
    showError(err.message || "Registration failed. Please try again.");
  } finally {
    submitBtn.classList.remove("is-loading");
  }
});

// Reset success state whenever the modal closes
const observer = new MutationObserver(() => {
  if (!modal.classList.contains("is-open")) {
    modal.classList.remove("is-success");
    clearError();
  }
});
observer.observe(modal, { attributes: true, attributeFilter: ["class"] });
