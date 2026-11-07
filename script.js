(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Theme (dark / light) ---------- */
  const root = document.documentElement;
  const savedTheme = (() => { try { return localStorage.getItem("theme"); } catch { return null; } })();
  root.setAttribute("data-theme", savedTheme || "dark");

  $("#themeToggle").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
  });

  /* ---------- Navbar: scroll style + mobile menu + active link ---------- */
  const navbar = $("#navbar");
  const navLinks = $("#navLinks");
  const menuBtn = $("#menuBtn");

  const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const closeMenu = () => {
    navLinks.classList.remove("open");
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  };
  menuBtn.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });
  $$("a", navLinks).forEach(a => a.addEventListener("click", closeMenu));

  const sections = $$("main section[id]");
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$("a", navLinks).forEach(a =>
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => spy.observe(s));

  /* ---------- Typing effect ---------- */
  const phrases = [
    "mobile app development",
    "clean UI/UX design",
    "web development",
    "solving real-life scenarios",
    "app development in Java"
  ];
  const typedEl = $("#typed");
  let p = 0, c = 0, deleting = false;

  function type() {
    const word = phrases[p];
    typedEl.textContent = word.slice(0, c);
    let delay = deleting ? 40 : 85;

    if (!deleting && c === word.length) { deleting = true; delay = 1400; }
    else if (deleting && c === 0) { deleting = false; p = (p + 1) % phrases.length; delay = 400; }
    else { c += deleting ? -1 : 1; }

    setTimeout(type, delay);
  }
  type();

  /* ---------- Reveal on scroll ---------- */
  const revealObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        el.classList.add("visible");
        obs.unobserve(el);
        // The stagger delay is only for the entrance; drop it so hover bounces instantly
        setTimeout(() => { el.style.transitionDelay = "0ms"; }, 1000);
      }
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 90}ms`;
    revealObs.observe(el);
  });

  /* ---------- Animated counters ---------- */
  const counterObs = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const start = performance.now();
      const dur = 1200;
      const tick = now => {
        const t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = target + "+";
      };
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(el => counterObs.observe(el));

  /* ---------- Skill filters ---------- */
  const filterBtns = $$(".filter-btn");
  const skills = $$(".skill");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      skills.forEach(card => {
        const match = f === "all" || card.dataset.cat === f;
        card.classList.toggle("hide", !match);
        card.classList.toggle("show", match);
      });
    });
  });

  /* ---------- SweetAlert2 helpers (falls back to the simple toast if the CDN is blocked) ---------- */
  const hasSwal = typeof Swal !== "undefined";
  const swalBase = { confirmButtonText: "OK", buttonsStyling: true };
  const Toast = hasSwal && Swal.mixin({
    toast: true, position: "bottom", showConfirmButton: false,
    timer: 2200, timerProgressBar: true
  });

  const toast = $("#toast");
  let toastTimer;
  function showToast(msg, icon = "success") {
    if (hasSwal) { Toast.fire({ icon, title: msg }); return; }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  /* ---------- Click-to-copy contact cards ---------- */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }
  $$(".contact-card").forEach(card =>
    card.addEventListener("click", async () => {
      await copyText(card.dataset.copy);
      const label = card.dataset.label || "Info";
      if (hasSwal) {
        Swal.fire({
          icon: "success",
          title: "Copied to clipboard!",
          text: `${label}: ${card.dataset.copy}`,
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      } else {
        showToast("Copied to clipboard!");
      }
    }));

  /* ---------- Contact form ---------- */
  const form = $("#contactForm");
  const alertBox = (opts) => hasSwal
    ? Swal.fire({ ...swalBase, ...opts })
    : (window.alert(opts.text || opts.title), Promise.resolve());

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const message = $("#message").value.trim();

    if (!name || !email || !message) {
      alertBox({ icon: "warning", title: "Missing information", text: "Please fill in all fields." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alertBox({ icon: "error", title: "Invalid email", text: "Please enter a valid email address." });
      return;
    }

    // OPTION A (recommended, really sends the message): paste a Formspree endpoint here,
    // e.g. "https://formspree.io/f/xxxxxxx". Leave empty to use the email-app (mailto) method.
    const FORM_ENDPOINT = "";

    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, message })
      })
        .then(res => {
          if (!res.ok) throw new Error("Request failed");
          alertBox({ icon: "success", title: "Message sent!", text: "Your message has successfully been sent. Please wait for a response." });
          form.reset();
        })
        .catch(() => alertBox({ icon: "error", title: "Oops!", text: "Something went wrong. Please try again." }));
      return;
    }

    // OPTION B: opens the visitor's email app with the message pre-filled.
    // Replace the address below with your own email.
    const to = "gerongcorandolph@email.com";
    const subject = encodeURIComponent(`Portfolio message from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);

    alertBox({
      icon: "success",
      title: "Message sent!",
      text: "Your message has been successfully sent. Please wait for a response."
    });
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    form.reset();
  });

  /* ---------- Fast scroll with a bounce at the destination ---------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let scrollRaf = null;

  const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function bounceScrollTo(target) {
    cancelAnimationFrame(scrollRaf);
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    target = Math.max(0, Math.min(target, maxScroll));

    const start = window.scrollY;
    const distance = target - start;
    if (Math.abs(distance) < 2) return;
    if (reduceMotion) { window.scrollTo(0, target); return; }

    const dir = Math.sign(distance);
    // How far we overshoot the section before bouncing back (px)
    const overshoot = dir * Math.min(70, Math.max(24, Math.abs(distance) * 0.08));
    const FLY = 450;      // ms: fast travel to the section
    const BOUNCE = 700;   // ms: damped bounce back into place
    const t0 = performance.now();

    function frame(now) {
      const elapsed = now - t0;
      let y;
      if (elapsed < FLY) {
        // Phase 1: rush toward (and slightly past) the target
        y = start + (distance + overshoot) * easeInOutCubic(elapsed / FLY);
      } else {
        // Phase 2: damped spring settling back onto the target
        const t = Math.min((elapsed - FLY) / BOUNCE, 1);
        const offset = overshoot * Math.exp(-5 * t) * Math.cos(2 * Math.PI * 1.25 * t);
        y = target + offset * (1 - t * t * 0.0);
        if (t >= 1) { window.scrollTo(0, target); scrollRaf = null; return; }
      }
      window.scrollTo(0, y);
      scrollRaf = requestAnimationFrame(frame);
    }
    scrollRaf = requestAnimationFrame(frame);
  }

  // Let the user take over: any manual scroll input cancels the animation
  ["wheel", "touchstart", "keydown"].forEach(evt =>
    window.addEventListener(evt, () => { cancelAnimationFrame(scrollRaf); scrollRaf = null; }, { passive: true }));

  $$('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const id = link.getAttribute("href");
      const el = id.length > 1 ? $(id) : null;
      if (!el) return;
      e.preventDefault();
      const navH = navbar.offsetHeight;
      const top = el.id === "hero" ? 0 : el.getBoundingClientRect().top + window.scrollY - navH + 1;
      bounceScrollTo(top);
      history.pushState(null, "", id);
    });
  });

  /* ---------- Binary rain background ---------- */
  (function binaryRain() {
    const canvas = $("#binary-rain");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1, rafId = null, last = 0;
    let fs = 16, GAP = 20, COL = 26, R = 100;
    let digits = [];
    let rgb = "61, 220, 151";
    const mouse = { x: null, y: null, speed: 0 };

    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp = (v, m) => Math.max(-m, Math.min(m, v));

    const readColor = () => {
      rgb = getComputedStyle(root).getPropertyValue("--glow").trim() || rgb;
      if (reduce) draw();
    };
    // Re-colour the digits when the theme is toggled
    new MutationObserver(readColor).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    // Each column holds a "stream": a run of digits falling together, head (idx 0) at the bottom
    function build() {
      digits = [];
      const cols = Math.max(6, Math.floor(w / COL));
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.6) continue;               // leave some columns empty
        const len = Math.floor(rand(6, 14)), speed = rand(0.9, 2.1), sx = c * COL + COL / 2;
        const headY = rand(-h * 0.5, h);
        for (let i = 0; i < len; i++) {
          digits.push({ sx, x: sx, y: headY - i * GAP, vx: 0, vy: speed, base: speed,
                        idx: i, len, ch: Math.random() < 0.5 ? "0" : "1", glow: 0 });
        }
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const small = w < 600;
      fs = small ? 14 : 16; GAP = fs + 4; COL = small ? 22 : 26; R = small ? 70 : 100;
      build();
      draw();
    }

    // Push every digit within `radius` of (x, y) away from that point
    function scatter(x, y, radius, power) {
      for (const d of digits) {
        const dx = d.x - x, dy = d.y - y, dist = Math.hypot(dx, dy);
        if (dist >= radius) continue;
        const nx = dist > 1 ? dx / dist : Math.random() - 0.5;
        const ny = dist > 1 ? dy / dist : Math.random() - 0.5;
        const f = (1 - dist / radius) * power;
        d.vx = clamp(d.vx + nx * f + rand(-0.6, 0.6), 9);
        d.vy = clamp(d.vy + ny * f * 0.8 + rand(-0.6, 0.6), 9);
        d.glow = 1;
      }
    }

    function step(k) {
      mouse.speed *= Math.pow(0.9, k);
      if (mouse.x !== null) scatter(mouse.x, mouse.y, R, 2.5 + Math.min(mouse.speed, 40) * 0.12);

      const cycle = h + 2 * GAP;
      for (const d of digits) {
        d.x += d.vx * k; d.y += d.vy * k;
        d.vx *= Math.pow(0.95, k);                         // scattered digits slow down...
        d.vy += (d.base - d.vy) * Math.min(1, 0.03 * k);   // ...and settle back to falling
        d.glow *= Math.pow(0.97, k);
        if (Math.random() < 0.004 * k) d.ch = d.ch === "0" ? "1" : "0";
        if (d.y > h + GAP) { d.y -= cycle + d.len * GAP; d.x = d.sx; d.vx = 0; }   // wrap to the top
        else if (d.x < -40 || d.x > w + 40) { d.x = d.sx; d.vx = 0; }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.font = `600 ${fs}px "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const d of digits) {
        if (d.y < -GAP || d.y > h + GAP) continue;
        const base = d.idx === 0 ? 0.75 : Math.max(0.08, 0.5 * (1 - d.idx / d.len));   // bright head, fading tail
        const a = Math.min(1, base + d.glow * 0.5);
        ctx.fillStyle = `rgba(${rgb}, ${a.toFixed(2)})`;
        ctx.fillText(d.ch, d.x, d.y);
      }
    }

    function loop(t) {
      const k = Math.min((t - last) / 16.67, 3);   // keep speed steady across refresh rates
      last = t;
      step(k); draw();
      rafId = requestAnimationFrame(loop);
    }
    const start = () => { if (!reduce && rafId === null) { last = performance.now(); rafId = requestAnimationFrame(loop); } };
    const stop = () => { if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; } };

    let lx = null, ly = null;
    window.addEventListener("pointermove", e => {
      if (lx !== null) mouse.speed = Math.max(mouse.speed, Math.hypot(e.clientX - lx, e.clientY - ly));
      lx = mouse.x = e.clientX; ly = mouse.y = e.clientY;
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => { mouse.x = mouse.y = lx = ly = null; });
    window.addEventListener("pointerup", e => { if (e.pointerType === "touch") mouse.x = mouse.y = lx = ly = null; }, { passive: true });
    // Clicking or tapping bursts the digits outward
    window.addEventListener("click", e => { if (!reduce) scatter(e.clientX, e.clientY, 160, 7); });
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });

    readColor();
    resize();
    start();
  })();

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();
})();