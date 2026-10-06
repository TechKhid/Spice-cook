/* ==========================================================================
   SPICE N COOK — app
   No framework, no build step. Content comes from js/menu.js.
   ========================================================================== */

(function () {
  "use strict";

  const D = window.SNC;
  const B = D.business;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const money = (n) => `${B.currency} ${Number(n).toLocaleString("en-GH")}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const waLink = (text) => `https://wa.me/${B.whatsapp}?text=${encodeURIComponent(text)}`;
  const icon = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  document.documentElement.classList.remove("no-js");

  /* ---------------------------------------------------------------- Dates
     ?day=wed (or thu, fri, sun…) previews the site as if it were that day */
  const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const today = (() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    const q = new URLSearchParams(location.search).get("day");
    const want = q ? DAYS.indexOf(q.slice(0, 3).toLowerCase()) : -1;
    if (want >= 0) d.setDate(d.getDate() + ((want - d.getDay() + 7) % 7));
    return d;
  })();
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const daysUntil = (wd) => (wd - today.getDay() + 7) % 7;
  const nextDate = (wd) => addDays(today, daysUntil(wd));
  const fmtDate = (d) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const fmtShort = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromIso = (s) => { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd, 12); };
  const nextSpecial = () => D.specials.slice().sort((a, b) => daysUntil(a.day) - daysUntil(b.day))[0];

  /* --------------------------------------------------------- Static links */
  function wireLinks() {
    $$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-link]").forEach((a) => { const k = a.dataset.link; a.href = k === "tel" ? `tel:+${B.whatsapp}` : B[k]; });
    $("#year").textContent = new Date().getFullYear();
  }

  function previewBar() {
    let dismissed = false;
    try { dismissed = sessionStorage.getItem("snc-preview") === "x"; } catch (e) {}
    if (!D.showPreviewBar || dismissed) return;
    const bar = $("#previewBar");
    bar.hidden = false;
    $("#previewClose").addEventListener("click", () => {
      bar.hidden = true;
      try { sessionStorage.setItem("snc-preview", "x"); } catch (e) {}
    });
  }

  /* ----------------------------------------------------------------- Hero
     The headline lists the three specials; the next one to be served is
     highlighted, and a line underneath says what's on. */
  function hero() {
    const s = nextSpecial();
    const n = daysUntil(s.day);
    $$("#days [data-day]").forEach((el) => el.classList.toggle("on", Number(el.dataset.day) === s.day));
    const from = money(Math.min(...s.options.map((o) => o.price)));
    let line;
    if (today.getDay() === 0) line = `We're closed on Sundays. Order ahead: <b>${esc(s.name.toLowerCase())}</b> is on ${s.dayName}, from ${from}.`;
    else if (n === 0) line = `It's ${s.dayName}: <b>${esc(s.name.toLowerCase())}</b> is on today, from ${from}.`;
    else if (n === 1) line = `Tomorrow is ${s.dayName}: <b>${esc(s.name.toLowerCase())}</b>, from ${from}. Order ahead tonight.`;
    else line = `Next up: <b>${esc(s.name.toLowerCase())}</b> on ${s.dayName} ${fmtShort(nextDate(s.day))}, from ${from}. Melanin Boxes and bulk orders any day.`;
    $("#heroToday").innerHTML = `${line} <button type="button" id="heroGo">Order it</button>`;
    $("#heroGo").addEventListener("click", () => {
      const card = $(`.dish[data-id="${s.id}"]`);
      (card || $("#lunch")).scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ----------------------------------------------------------- Lunch menu */
  function menu() {
    const first = nextSpecial().id;
    $("#menu").innerHTML = D.specials
      .map((s) => {
        const d = nextDate(s.day);
        const isToday = daysUntil(s.day) === 0;
        return `
        <article class="dish rv${s.id === first ? " today" : ""}" data-id="${s.id}">
          <div class="dish__img"><img src="${s.photo}" alt="${esc(s.name)}" loading="lazy" width="600" height="450"></div>
          <div class="dish__body">
            <p class="dish__day">${s.dayName}s <small>next: ${fmtDate(d)}</small>${isToday ? "<em>TODAY</em>" : s.id === first ? "<em>UP NEXT</em>" : ""}</p>
            <h3>${esc(s.name)}</h3>
            <p class="dish__sides">${esc(s.sides)}</p>
            <ul class="prices">
              ${s.options
                .map(
                  (o) => `<li><button type="button" data-sp="${s.id}" data-opt="${o.id}" aria-label="Add ${esc(s.name)} with ${esc(o.label.toLowerCase())}, ${money(o.price)}, for ${fmtDate(d)}">
                    <span>${esc(o.label)}</span><i aria-hidden="true"></i><b>${o.price}</b><span class="add" aria-hidden="true">+</span>
                  </button></li>`
                )
                .join("")}
            </ul>
          </div>
        </article>`;
      })
      .join("");

    $$("#menu [data-sp]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const s = D.specials.find((x) => x.id === btn.dataset.sp);
        const o = s.options.find((x) => x.id === btn.dataset.opt);
        const d = iso(nextDate(s.day));
        addToCart({ key: `${s.id}|${o.id}|${d}`, name: s.name, detail: `${o.label} & juice`, price: o.price, qty: 1, date: d, photo: s.photo });
        btn.classList.add("added");
        setTimeout(() => btn.classList.remove("added"), 900);
      })
    );
  }

  /* ---------------------------------------------------------------- Boxes */
  let boxId = D.boxes[0].id;
  let boxQty = 1;
  function boxes() {
    const form = $("#boxForm");
    const minDate = iso(addDays(today, 1));
    form.date.min = minDate;
    $("#boxNotice").textContent = D.boxNotice;
    $("#boxTabs").innerHTML = D.boxes
      .map((b) => `<button type="button" role="tab" data-box="${b.id}" aria-selected="${b.id === boxId}">${esc(b.tab)}<b>${b.price}</b></button>`)
      .join("");
    $$("#boxTabs button").forEach((t) => t.addEventListener("click", () => { boxId = t.dataset.box; renderBox(); }));

    $$(".stepper button", form).forEach((b) =>
      b.addEventListener("click", () => {
        boxQty = Math.max(1, Math.min(30, boxQty + Number(b.dataset.q)));
        renderBox();
      })
    );
    form.date.addEventListener("input", () => form.date.classList.remove("invalid"));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const b = D.boxes.find((x) => x.id === boxId);
      if (!form.date.value || form.date.value < minDate) {
        form.date.classList.add("invalid");
        form.date.focus();
        toast(`Pick a delivery date for your ${b.name}.`);
        return;
      }
      const msg = form.msg.value.trim();
      addToCart({ key: `${b.id}|${form.date.value}|${msg}`, name: b.name, detail: "", price: b.price, qty: boxQty, date: form.date.value, msg, photo: b.photo });
      boxQty = 1;
      form.msg.value = "";
      renderBox();
    });
    renderBox();
  }
  function renderBox() {
    const b = D.boxes.find((x) => x.id === boxId);
    $$("#boxTabs button").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.box === boxId)));
    $("#boxTitle").textContent = b.id === "melanin-box" ? "The Melanin Box" : b.name;
    $("#boxPrice").innerHTML = `<small>${B.currency}</small>${b.price}<span>per box</span>`;
    $("#boxContents").innerHTML = b.contents.map((c) => `<li>${esc(c)}</li>`).join("");
    $("#boxForm output").textContent = boxQty;
    $("#boxTotal").textContent = money(b.price * boxQty);
  }

  /* ------------------------------------------------------------ Gifting */
  function gifting() {
    $("#writeCard").addEventListener("click", () => {
      $("#boxes").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => $("#boxForm textarea").focus({ preventScroll: true }), 650);
    });
  }

  /* ----------------------------------------------------------------- Cart */
  const cart = store.get("snc-cart-v2", { items: [], mode: "delivery", name: "", where: "", notes: "" });
  let sentRef = null;
  const save = () => store.set("snc-cart-v2", cart);
  const count = () => cart.items.reduce((n, i) => n + i.qty, 0);
  const total = () => cart.items.reduce((n, i) => n + i.qty * i.price, 0);

  function addToCart(item) {
    sentRef = null;
    const found = cart.items.find((i) => i.key === item.key);
    if (found) found.qty += item.qty;
    else cart.items.push(item);
    save();
    renderCart();
    const btn = $("#cartBtn");
    btn.classList.remove("bump");
    void btn.offsetWidth;
    btn.classList.add("bump");
    toast(`${item.qty} × ${item.name} added for ${fmtDate(fromIso(item.date))}.`, true);
  }

  function renderCart() {
    const n = count();
    $("#cartCount").textContent = n;
    $("#cartBtn").classList.toggle("has", n > 0);
    $("#cartBtn").setAttribute("aria-label", `Your order, ${n} item${n === 1 ? "" : "s"}`);
    $("#orderBar").hidden = n === 0;
    document.body.classList.toggle("has-order", n > 0);
    $("#orderBarCount").textContent = `${n} item${n === 1 ? "" : "s"}`;
    $("#orderBarTotal").textContent = money(total());
    renderDrawer();
  }

  function renderDrawer() {
    const body = $("#drawerBody");
    if (sentRef) {
      body.innerHTML = `
        <div class="sent">
          <span class="sent__ref">${sentRef}</span>
          <h3>Your order is in WhatsApp.</h3>
          <p>If you haven't pressed send yet, do that now. We'll reply with payment details, and your payment confirms the order.</p>
          <a class="btn btn--wa btn--block" id="reopenWa" target="_blank" rel="noopener">${icon("wa")} Open WhatsApp again</a>
          <button class="btn btn--line btn--block" type="button" id="newOrder">Start a new order</button>
        </div>`;
      $("#reopenWa").href = waLink(orderMessage(sentRef));
      $("#newOrder").addEventListener("click", () => { cart.items = []; sentRef = null; save(); renderCart(); });
      return;
    }
    if (!cart.items.length) {
      body.innerHTML = `
        <div class="empty">
          <img src="assets/img/jollof.jpg" alt="" loading="lazy">
          <h3>Nothing here yet.</h3>
          <p>Tap a price on the weekly lunch menu, or add a Melanin Box.</p>
          <button class="btn btn--ink" type="button" id="browse">See this week's lunch</button>
        </div>`;
      $("#browse").addEventListener("click", () => { closeDrawer(); $("#lunch").scrollIntoView({ behavior: "smooth" }); });
      return;
    }
    body.innerHTML = `
      ${cart.items
        .map(
          (i, idx) => `
        <div class="line">
          <img src="${i.photo}" alt="" loading="lazy">
          <div>
            <p class="line__name">${esc(i.name)}</p>
            <p class="line__meta">${i.detail ? esc(i.detail) + "<br>" : ""}For ${fmtDate(fromIso(i.date))}${i.msg ? `<br>Card: “${esc(i.msg)}”` : ""}</p>
          </div>
          <div class="line__side">
            <span class="line__price">${money(i.price * i.qty)}</span>
            <div class="stepper stepper--sm"><button type="button" data-idx="${idx}" data-q="-1" aria-label="One fewer">−</button><output>${i.qty}</output><button type="button" data-idx="${idx}" data-q="1" aria-label="One more">+</button></div>
            <button class="line__rm" type="button" data-rm="${idx}">Remove</button>
          </div>
        </div>`
        )
        .join("")}
      <div class="seg" role="radiogroup" aria-label="Delivery or pickup">
        <label><input type="radio" name="mode" value="delivery" ${cart.mode === "delivery" ? "checked" : ""}> Delivery</label>
        <label><input type="radio" name="mode" value="pickup" ${cart.mode === "pickup" ? "checked" : ""}> Pickup</label>
      </div>
      <label class="field"><span>Your name</span><input name="name" autocomplete="name" value="${esc(cart.name)}"></label>
      ${cart.mode === "delivery" ? `<label class="field"><span>Deliver to</span><input name="where" autocomplete="street-address" placeholder="e.g. Lakeside Estate, near the mall" value="${esc(cart.where)}"></label>` : ""}
      <label class="field"><span>Notes <em>optional</em></span><textarea name="notes" rows="2" placeholder="Extra pepper, call on arrival…">${esc(cart.notes)}</textarea></label>
      <div class="totals">
        ${cart.mode === "delivery" ? `<div><span>Delivery</span><span>Confirmed on WhatsApp</span></div>` : ""}
        <div class="grand"><span>Total</span><b>${money(total())}</b></div>
      </div>
      <p class="form-error" id="cartError" role="alert" hidden></p>
      <button class="btn btn--wa btn--block" type="button" id="sendOrder">${icon("wa")} Send order on WhatsApp</button>
      <p class="drawer__fine">Payment validates order. We'll reply with payment details.</p>`;

    $$("[data-q]", body).forEach((b) =>
      b.addEventListener("click", () => {
        const it = cart.items[b.dataset.idx];
        it.qty += Number(b.dataset.q);
        if (it.qty < 1) cart.items.splice(b.dataset.idx, 1);
        save();
        renderCart();
      })
    );
    $$("[data-rm]", body).forEach((b) => b.addEventListener("click", () => { cart.items.splice(b.dataset.rm, 1); save(); renderCart(); }));
    $$("input[name=mode]", body).forEach((r) => r.addEventListener("change", () => { cart.mode = r.value; save(); renderDrawer(); }));
    ["name", "where", "notes"].forEach((k) => {
      const el = $(`[name=${k}]`, body);
      if (!el) return;
      el.addEventListener("input", () => { cart[k] = el.value; el.classList.remove("invalid"); $("#cartError").hidden = true; save(); });
    });
    $("#sendOrder").addEventListener("click", sendOrder);
  }

  function orderMessage(ref) {
    const lines = cart.items.map((i, n) => {
      let s = `${n + 1}) ${i.qty} × ${i.name}${i.detail ? `, ${i.detail}` : ""}\n    📅 ${fmtDate(fromIso(i.date))} · ${money(i.price * i.qty)}`;
      if (i.msg) s += `\n    💌 Card message: "${i.msg}"`;
      return s;
    });
    return [
      `Hello Spice N Cook! 👋`,
      `I'd like to place an order (Ref: ${ref})`,
      ``,
      ...lines,
      ``,
      `💰 Total: ${money(total())}`,
      cart.mode === "delivery" ? `🛵 Deliver to: ${cart.where.trim()}` : `🛍️ I'll pick up`,
      `👤 Name: ${cart.name.trim()}`,
      cart.notes.trim() ? `📝 Notes: ${cart.notes.trim()}` : null,
      ``,
      `I understand payment validates my order. Please send payment details. Thank you! 🙏`,
    ]
      .filter((l) => l !== null)
      .join("\n");
  }

  function sendOrder() {
    const body = $("#drawerBody");
    const missing = [];
    if (!cart.name.trim()) missing.push("name");
    if (cart.mode === "delivery" && !cart.where.trim()) missing.push("where");
    if (missing.length) {
      missing.forEach((k) => $(`[name=${k}]`, body).classList.add("invalid"));
      $(`[name=${missing[0]}]`, body).focus();
      const err = $("#cartError");
      err.textContent = missing[0] === "name" ? "Add your name so we know who's ordering." : "Where should we deliver to?";
      err.hidden = false;
      return;
    }
    const ref = `SNC-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    window.open(waLink(orderMessage(ref)), "_blank", "noopener");
    sentRef = ref;
    renderDrawer();
  }

  /* --------------------------------------------------------------- Drawer */
  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    $("#toast").classList.remove("show");
    const scrim = $("#scrim");
    scrim.hidden = false;
    requestAnimationFrame(() => scrim.classList.add("show"));
    const dr = $("#drawer");
    dr.classList.add("open");
    dr.setAttribute("aria-hidden", "false");
    document.body.classList.add("locked");
    setTimeout(() => dr.focus(), 60);
  }
  function closeDrawer() {
    const scrim = $("#scrim");
    scrim.classList.remove("show");
    setTimeout(() => (scrim.hidden = true), 300);
    const dr = $("#drawer");
    dr.classList.remove("open");
    dr.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    if (lastFocus) lastFocus.focus();
  }

  /* ----------------------------------------------------------------- Bulk */
  function bulk() {
    $("#bulkChips").innerHTML = D.bulk
      .map((b) => `<label class="chip"><input type="checkbox" name="items" value="${esc(b)}"><span>${esc(b)}</span></label>`)
      .join("");
    const form = $("#bulkForm");
    form.date.min = iso(addDays(today, 1));
    form.addEventListener("input", (e) => e.target.classList && e.target.classList.remove("invalid"));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const items = $$("input[name=items]:checked", form).map((i) => i.value);
      const err = $("#bulkError");
      const bad = [form.date, form.guests, form.name].filter((f) => !f.value.trim());
      $$(".invalid", form).forEach((x) => x.classList.remove("invalid"));
      if (bad.length || (!items.length && !form.notes.value.trim())) {
        bad.forEach((x) => x.classList.add("invalid"));
        err.textContent = bad.length ? "Add the date, how many people, and your name." : "Pick at least one dish, or tell us what you need.";
        err.hidden = false;
        (bad[0] || form.notes).focus();
        return;
      }
      err.hidden = true;
      const msg = [
        `Hello Spice N Cook! 👋 I'd like a quote for a bulk order.`,
        ``,
        `📅 Date: ${fmtDate(fromIso(form.date.value))}`,
        `👥 People: ${form.guests.value}`,
        items.length ? `🍲 Dishes: ${items.join(", ")}` : null,
        form.notes.value.trim() ? `📝 Details: ${form.notes.value.trim()}` : null,
        `👤 Name: ${form.name.value.trim()}`,
        ``,
        `Thank you!`,
      ]
        .filter((l) => l !== null)
        .join("\n");
      window.open(waLink(msg), "_blank", "noopener");
      toast("Opening WhatsApp with your request…");
    });
  }

  /* -------------------------------------------------------- Gallery, hire */
  function gallery() {
    $("#gallery").innerHTML = D.gallery
      .map((g) => `<a class="rv" href="${B.tiktok}" target="_blank" rel="noopener"><img src="${g.src}" alt="${esc(g.label)}" loading="lazy"><span>${esc(g.label)}</span></a>`)
      .join("");
  }
  function hiring() {
    const h = D.hiring;
    if (!h || !h.open) { $("#hiring").remove(); return; }
    $("#hiringRole").textContent = h.role;
    $("#hiringReqs").innerHTML = h.requirements.map((r) => `<li>${esc(r)}</li>`).join("");
    const a = $("#hiringBtn");
    a.href = waLink(`Hello Spice N Cook! I'm interested in the ${h.role} role. My name is …`);
    a.target = "_blank";
    a.rel = "noopener";
  }

  /* ---------------------------------------------------------------- Toast */
  let toastTimer;
  function toast(text, withView) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(text)}</span>${withView ? '<button type="button">View order</button>' : ""}`;
    if (withView) $("button", t).addEventListener("click", openDrawer);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3200);
  }

  /* --------------------------------------------------------------- Motion */
  function motion() {
    $$(".head, .boxes__body, .gift__text, .bulk__panel, .how__list li, .hero__media").forEach((el) => el.classList.add("rv"));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );
    $$(".rv").forEach((el) => {
      const sib = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.classList.contains("rv")).indexOf(el) : 0;
      el.style.transitionDelay = `${Math.min(sib, 4) * 70}ms`;
      io.observe(el);
    });
    const bar = $("#bar");
    const onScroll = () => bar.classList.toggle("stuck", scrollY > 40);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------------- Boot */
  wireLinks();
  previewBar();
  hero();
  menu();
  boxes();
  gifting();
  bulk();
  gallery();
  hiring();
  renderCart();
  motion();

  $("#cartBtn").addEventListener("click", openDrawer);
  $("#orderBar").addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#scrim").addEventListener("click", closeDrawer);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#drawer").classList.contains("open")) closeDrawer(); });
})();
