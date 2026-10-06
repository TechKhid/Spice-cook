/* ==========================================================================
   SPICE N COOK — motion
   GSAP + ScrollTrigger + SplitText (bundled in js/vendor). Only runs when
   the visitor allows motion; otherwise the page is fully static and usable.
   Listens to events from app.js: snc:add, snc:count, snc:box, snc:step,
   snc:drawer, snc:paid.
   ========================================================================== */

(function () {
  "use strict";

  const root = document.documentElement;
  const g = window.gsap;
  if (!g || !window.ScrollTrigger || !window.SplitText || !root.classList.contains("anim")) {
    root.classList.remove("anim", "intro-on");
    return;
  }
  window.SNC_ANIM = true;
  g.registerPlugin(ScrollTrigger, SplitText);
  g.defaults({ ease: "expo.out", duration: 1 });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const once = (trigger, start = "top 86%") => ({ trigger, start, once: true });
  const words = (el) => SplitText.create(el, { type: "words", mask: "words", wordsClass: "w" }).words;

  /* ----------------------------------------------------- Intro + hero */
  function intro() {
    const tl = g.timeline();
    if (root.classList.contains("intro-on")) {
      try { sessionStorage.setItem("snc-intro", "1"); } catch (e) {}
      tl.fromTo("#intro img", { autoAlpha: 0, y: 24, scale: 0.86 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.8 })
        .to("#intro img", { autoAlpha: 0, y: -24, duration: 0.35, ease: "power2.in" }, "+=0.2")
        .to("#intro", { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "expo.inOut" }, "-=0.1")
        .add(() => root.classList.remove("intro-on"))
        .addLabel("hero", "-=0.55");
    } else {
      root.classList.remove("intro-on");
      tl.addLabel("hero", 0.05);
    }

    const days = $(".days");
    const w = words(days);
    g.set([days, ".hero .kicker", ".lede", ".hero__cta", ".hero__today", ".hero__media"], { autoAlpha: 1 });
    tl.from(".hero .kicker", { y: 16, autoAlpha: 0, duration: 0.8 }, "hero")
      .from(w, { yPercent: 115, rotate: 4, duration: 1.2, stagger: 0.045 }, "hero+=0.05")
      .add(() => $$(".days span.on em").forEach((em) => em.classList.add("go")), "hero+=0.75")
      .from([".lede", ".hero__cta > *", ".hero__today"], { y: 26, autoAlpha: 0, duration: 1, stagger: 0.08 }, "hero+=0.45")
      .fromTo(".hero__main", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" }, "hero")
      .from(".hero__main", { scale: 1.25, duration: 2.2, ease: "power3.out" }, "hero")
      .from(".hero__inset", { y: 90, rotate: -7, autoAlpha: 0, duration: 1.4 }, "hero+=0.6")
      .from(".hero__media figcaption", { autoAlpha: 0, x: -14, duration: 0.9 }, "hero+=1.1");

    // gentle parallax as the hero scrolls away
    g.to(".hero__main", { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    g.to(".hero__inset", { yPercent: -18, rotate: -3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }

  /* --------------------------------------------------- Scroll reveals */
  function headings() {
    $$(".head h2, .boxes h2, .bulk h2, .gift h2, .how__title, .hire h2").forEach((h) => {
      g.from(words(h), { yPercent: 110, duration: 1.1, stagger: 0.05, scrollTrigger: once(h) });
    });
    $$(".head").forEach((h) => {
      g.fromTo(h, { "--line": 0 }, { "--line": 1, duration: 1.4, ease: "expo.inOut", scrollTrigger: once(h) });
      g.from($$("p, .feed__links a", h), { y: 18, autoAlpha: 0, stagger: 0.08, delay: 0.25, scrollTrigger: once(h) });
    });
    $$(".kicker").forEach((k) => {
      if (k.closest(".hero")) return;
      g.from(k, { autoAlpha: 0, x: -16, duration: 0.8, scrollTrigger: once(k) });
    });
  }

  // Image wipes: the frame opens from the bottom while the photo settles
  function wipe(frame, img, opts = {}) {
    const tl = g.timeline({ scrollTrigger: once(frame, opts.start || "top 85%") });
    tl.fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut", delay: opts.delay || 0 })
      .from(img, { scale: 1.3, duration: 1.8, ease: "power3.out" }, "<");
    return tl;
  }

  function menu() {
    $$(".dish").forEach((d, i) => {
      g.from(d, { y: 70, autoAlpha: 0, duration: 1.1, delay: (i % 3) * 0.12, scrollTrigger: once($(".menu"), "top 82%") });
      wipe($(".dish__img", d), $(".dish__img img", d), { delay: 0.15 + (i % 3) * 0.12, start: "top 92%" });
      g.from($$(".prices li", d), { x: -18, autoAlpha: 0, stagger: 0.07, duration: 0.8, delay: 0.5 + (i % 3) * 0.12, scrollTrigger: once($(".menu"), "top 75%") });
    });
    const today = $(".dish.today");
    if (today) g.fromTo(today, { outlineColor: "rgba(217,200,30,0)" }, { outlineColor: "rgba(217,200,30,1)", duration: 0.6, repeat: 3, yoyo: true, ease: "sine.inOut", delay: 1.2, scrollTrigger: once(today, "top 70%") });
  }

  function boxes() {
    const media = $(".boxes__media");
    wipe(media, $("img", media));
    const price = $("#boxPrice b");
    if (price) {
      const end = Number(price.textContent);
      const o = { v: 0 };
      g.to(o, { v: end, duration: 1.6, ease: "power3.out", scrollTrigger: once($("#boxPrice")), onUpdate: () => { price.textContent = Math.round(o.v); } });
    }
    g.from("#boxContents li", { x: -14, autoAlpha: 0, stagger: 0.035, duration: 0.7, scrollTrigger: once("#boxContents") });
    g.from([".tabs", ".boxform"], { y: 30, autoAlpha: 0, stagger: 0.12, scrollTrigger: once(".tabs") });
  }

  function sections() {
    const gm = $(".gift__media");
    wipe(gm, $("img", gm));
    g.fromTo($("img", gm), { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: gm, start: "top bottom", end: "bottom top", scrub: true } });
    g.from([".gift__text > p:not(.kicker)", "#writeCard"], { y: 24, autoAlpha: 0, stagger: 0.1, scrollTrigger: once(".gift__text") });

    const bm = $(".bulk__media");
    wipe(bm, $("img", bm));
    g.fromTo($("img", bm), { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: ".bulk", start: "top bottom", end: "bottom top", scrub: true } });
    g.from([".bulk__panel > p:not(.kicker)", ".bulkform > *"], { y: 26, autoAlpha: 0, stagger: 0.06, scrollTrigger: once(".bulk__panel", "top 75%") });
    g.from(".chip", { scale: 0.85, autoAlpha: 0, stagger: 0.03, duration: 0.6, ease: "back.out(2)", scrollTrigger: once("#bulkChips") });

    $$(".how__list li").forEach((li, i) => {
      g.from(li, { y: 40, autoAlpha: 0, delay: i * 0.12, scrollTrigger: once(".how__list") });
      g.from($("b", li), { yPercent: 60, autoAlpha: 0, rotate: -8, duration: 1.2, delay: 0.1 + i * 0.12, scrollTrigger: once(".how__list") });
    });

    $$(".grid a").forEach((a, i) => {
      g.timeline({ scrollTrigger: once("#gallery", "top 80%") })
        .fromTo(a, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "expo.inOut", delay: i * 0.09 })
        .from($("img", a), { scale: 1.35, duration: 1.6, ease: "power3.out" }, "<")
        .from($("span", a), { y: 14, autoAlpha: 0, duration: 0.6 }, "-=0.9");
    });

    const tag = $(".hire__tag");
    if (tag) g.from(tag, { scale: 0.4, rotate: -24, autoAlpha: 0, duration: 1, ease: "elastic.out(1, 0.5)", scrollTrigger: once(tag, "top 92%") });
    g.from(".foot__grid > *", { y: 30, autoAlpha: 0, stagger: 0.08, scrollTrigger: once(".foot", "top 90%") });

    // reading progress, a thin lime line along the top
    g.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });
  }

  /* ------------------------------------------------------- Magnetic UI */
  function magnetic() {
    if (!finePointer) return;
    $$(".btn--ink, .btn--lime, .btn--line, .order-btn").forEach((el) => {
      if (el.closest(".drawer")) return;
      const xTo = g.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = g.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
    // menu photos lean toward the cursor
    $$(".dish").forEach((d) => {
      const img = $(".dish__img img", d);
      const xTo = g.quickTo(img, "xPercent", { duration: 0.8, ease: "power3.out" });
      const yTo = g.quickTo(img, "yPercent", { duration: 0.8, ease: "power3.out" });
      d.addEventListener("pointermove", (e) => {
        const r = d.getBoundingClientRect();
        xTo(((e.clientX - r.left) / r.width - 0.5) * -4);
        yTo(((e.clientY - r.top) / r.height - 0.5) * -4);
      });
      d.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------------------------------------------- Order interactions */
  function cartTarget() {
    const bar = $("#orderBar");
    if (bar && !bar.hidden && getComputedStyle(bar).display !== "none") return $("#orderBarTotal");
    return $("#cartCount");
  }
  function bump(el) {
    g.fromTo(el, { scale: 1 }, { scale: 1.25, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1, overwrite: "auto" });
  }

  // The dish photo arcs from the price you tapped into the order button
  document.addEventListener("snc:add", (e) => {
    const from = e.detail.from;
    const target = cartTarget();
    if (!from || !target) return bump($("#cartBtn"));
    const a = from.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const size = 64;
    const fly = document.createElement("img");
    fly.src = e.detail.photo;
    fly.alt = "";
    fly.className = "flyer";
    document.body.appendChild(fly);
    const x0 = a.right - size, y0 = a.top + a.height / 2 - size / 2;
    const x1 = b.left + b.width / 2 - size / 2, y1 = b.top + b.height / 2 - size / 2;
    g.set(fly, { x: x0, y: y0, scale: 0.4, autoAlpha: 0 });
    g.timeline({ onComplete: () => { fly.remove(); bump(target.closest("button") || target); } })
      .to(fly, { scale: 1, autoAlpha: 1, duration: 0.25, ease: "back.out(2)" })
      .to(fly, { x: x1, duration: 0.85, ease: "power2.inOut" })
      .to(fly, { y: y1, duration: 0.85, ease: y1 < y0 ? "back.in(1.4)" : "power2.in" }, "<")
      .to(fly, { scale: 0.3, rotate: 200, duration: 0.85, ease: "power2.in" }, "<")
      .to(fly, { autoAlpha: 0, duration: 0.15 }, "-=0.12");
  });

  // The order count rolls like an odometer
  document.addEventListener("snc:count", (e) => {
    const up = e.detail.to > e.detail.from;
    g.fromTo("#cartCount", { yPercent: up ? 100 : -100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(2)", delay: up ? 0.85 : 0, overwrite: "auto" });
    g.fromTo("#orderBarTotal", { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, delay: up ? 0.85 : 0, overwrite: "auto" });
  });

  // Switching Melanin Box sizes rolls the price and re-deals the contents
  document.addEventListener("snc:box", (e) => {
    const price = $("#boxPrice b");
    const o = { v: e.detail.from };
    g.to(o, { v: e.detail.to, duration: 0.9, ease: "power3.out", onUpdate: () => { price.textContent = Math.round(o.v); } });
    g.from("#boxContents li", { x: 22, autoAlpha: 0, stagger: 0.03, duration: 0.6, overwrite: true });
    g.from(words($("#boxTitle")), { yPercent: 110, stagger: 0.05, duration: 0.8 });
  });

  // Drawer content glides in on open and on every checkout step
  function dealDrawer() {
    const body = $("#drawerBody");
    const host = body.firstElementChild;
    const kids = host && host.children.length ? Array.from(host.children) : Array.from(body.children);
    g.from(kids, { x: 28, autoAlpha: 0, stagger: 0.04, duration: 0.7, overwrite: true, clearProps: "transform,opacity,visibility" });
  }
  document.addEventListener("snc:drawer", () => setTimeout(dealDrawer, 120));
  document.addEventListener("snc:step", dealDrawer);

  /* -------------------------------------------- Payment success party */
  document.addEventListener("snc:paid", () => {
    const slip = $("#slip");
    if (slip) {
      g.fromTo(slip, { clipPath: "inset(0% 0% 100% 0%)", y: -30 }, { clipPath: "inset(0% 0% -10% 0%)", y: 0, duration: 1.4, ease: "power3.out", delay: 0.5 });
      g.from(".receipt h3, .receipt > p", { y: 20, autoAlpha: 0, stagger: 0.1, delay: 0.3 });
      g.from(".receipt .btn, .receipt .back-btn", { y: 20, autoAlpha: 0, stagger: 0.08, delay: 1.3 });
    }
    confetti();
  });

  function confetti() {
    const c = document.createElement("canvas");
    c.className = "confetti";
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = (c.width = innerWidth * dpr), H = (c.height = innerHeight * dpr);
    const colors = ["#d9c81e", "#1d6b34", "#c2381f", "#c9a574", "#f4eee3", "#153f24"];
    const drawer = $("#drawer").getBoundingClientRect();
    const ox = (drawer.left + drawer.width / 2) * dpr, oy = drawer.top * dpr + 120 * dpr;
    const P = Array.from({ length: 160 }, () => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
      const sp = (6 + Math.random() * 11) * dpr;
      return {
        x: ox, y: oy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        w: (5 + Math.random() * 7) * dpr, h: (8 + Math.random() * 10) * dpr,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.35,
        c: colors[(Math.random() * colors.length) | 0], round: Math.random() < 0.25, life: 0,
      };
    });
    let frame = 0;
    (function tick() {
      frame++;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      P.forEach((p) => {
        p.vy += 0.32 * dpr;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        if (p.y < H + 40) alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.globalAlpha = Math.max(0, 1 - frame / 180);
        ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.r * 2)), p.w, p.h * Math.abs(Math.cos(p.r * 2)));
        ctx.restore();
      });
      if (alive && frame < 180) requestAnimationFrame(tick);
      else c.remove();
    })();
  }

  /* -------------------------------------------------------------- Boot */
  intro();
  headings();
  menu();
  boxes();
  sections();
  magnetic();
  addEventListener("load", () => ScrollTrigger.refresh());
})();
