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
        addToCart({ key: `${s.id}|${o.id}|${d}`, name: s.name, detail: `${o.label} & juice`, price: o.price, qty: 1, date: d, photo: s.photo }, btn);
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
    $$("#boxTabs button").forEach((t) =>
      t.addEventListener("click", () => {
        if (t.dataset.box === boxId) return;
        const from = D.boxes.find((x) => x.id === boxId).price;
        boxId = t.dataset.box;
        renderBox();
        document.dispatchEvent(new CustomEvent("snc:box", { detail: { from, to: D.boxes.find((x) => x.id === boxId).price } }));
      })
    );

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
      addToCart({ key: `${b.id}|${form.date.value}|${msg}`, name: b.name, detail: "", price: b.price, qty: boxQty, date: form.date.value, msg, photo: b.photo }, $("button[type=submit]", form));
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
    $("#boxPrice").innerHTML = `<small>${B.currency}</small><b>${b.price}</b><span>per box</span>`;
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

  /* ------------------------------------------------------ Cart & checkout
     Steps: cart → details → pay → processing → done.
     payments.mode "demo" simulates a Mobile Money approval (nothing is
     charged); "paystack" opens Paystack's secure popup for real payments. */
  const PAY = Object.assign({ mode: "demo", paystackPublicKey: "", verifyUrl: "", deliveryFee: null }, D.payments);
  const LIVE = PAY.mode === "paystack" && !!PAY.paystackPublicKey;
  const cart = Object.assign(
    { items: [], mode: "delivery", name: "", phone: "", email: "", where: "", notes: "" },
    store.get("snc-cart-v2", {})
  );
  const save = () => store.set("snc-cart-v2", cart);
  const count = () => cart.items.reduce((n, i) => n + i.qty, 0);
  const subtotal = () => cart.items.reduce((n, i) => n + i.qty * i.price, 0);
  const fee = () => (cart.mode === "delivery" && typeof PAY.deliveryFee === "number" ? PAY.deliveryFee : 0);
  const total = () => subtotal() + fee();
  const NETWORKS = { mtn: "MTN MoMo", telecel: "Telecel Cash", at: "AT Money" };
  const STEPS = ["cart", "details", "pay"];
  let step = "cart";
  let payState = { method: "momo", network: "mtn", number: "" };
  let lastOrder = store.get("snc-last-order", null);
  let sentRef = null;
  let timers = [];

  const newRef = () =>
    `SNC-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
  const normPhone = (v) => {
    let d = String(v).replace(/[^\d+]/g, "");
    if (d.startsWith("+233")) d = "0" + d.slice(4);
    else if (d.startsWith("233")) d = "0" + d.slice(3);
    return d;
  };
  const validPhone = (v) => /^0[2-5]\d{8}$/.test(normPhone(v));
  const maskPhone = (v) => { const d = normPhone(v); return `${d.slice(0, 3)} ••• ${d.slice(-4)}`; };
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));

  function addToCart(item, fromEl) {
    sentRef = null;
    if (step === "done" || step === "processing") step = "cart";
    const found = cart.items.find((i) => i.key === item.key);
    if (found) found.qty += item.qty;
    else cart.items.push(item);
    save();
    renderCart();
    emit("snc:add", { from: fromEl, photo: item.photo });
    toast(`${item.qty} × ${item.name} added for ${fmtDate(fromIso(item.date))}.`, true);
  }

  function renderCart() {
    const n = count();
    const prev = Number($("#cartCount").textContent) || 0;
    $("#cartCount").textContent = n;
    if (n !== prev) emit("snc:count", { from: prev, to: n });
    if (n > prev && !window.gsap) {
      const btn = $("#cartBtn");
      btn.classList.remove("bump");
      void btn.offsetWidth;
      btn.classList.add("bump");
    }
    $("#cartBtn").classList.toggle("has", n > 0);
    $("#cartBtn").setAttribute("aria-label", `Your order, ${n} item${n === 1 ? "" : "s"}`);
    $("#orderBar").hidden = n === 0;
    document.body.classList.toggle("has-order", n > 0);
    $("#orderBarCount").textContent = `${n} item${n === 1 ? "" : "s"}`;
    $("#orderBarTotal").textContent = money(subtotal());
    renderDrawer();
  }

  function go(s) {
    step = s;
    renderDrawer();
    $("#drawerBody").scrollTop = 0;
    emit("snc:step", { step: s });
  }

  function lineHtml(i, idx, editable) {
    return `
      <div class="line">
        <img src="${i.photo}" alt="" loading="lazy">
        <div>
          <p class="line__name">${esc(i.name)}</p>
          <p class="line__meta">${i.detail ? esc(i.detail) + "<br>" : ""}For ${fmtDate(fromIso(i.date))}${i.msg ? `<br>Card: “${esc(i.msg)}”` : ""}</p>
        </div>
        <div class="line__side">
          <span class="line__price">${money(i.price * i.qty)}</span>
          ${editable
            ? `<div class="stepper stepper--sm"><button type="button" data-idx="${idx}" data-q="-1" aria-label="One fewer">−</button><output>${i.qty}</output><button type="button" data-idx="${idx}" data-q="1" aria-label="One more">+</button></div>
               <button class="line__rm" type="button" data-rm="${idx}">Remove</button>`
            : `<span class="line__qty">× ${i.qty}</span>`}
        </div>
      </div>`;
  }

  function totalsHtml() {
    const delivery =
      cart.mode !== "delivery" ? "" :
      typeof PAY.deliveryFee === "number" ? `<div><span>Delivery</span><span>${money(PAY.deliveryFee)}</span></div>` :
      `<div><span>Delivery</span><span>Arranged after your order</span></div>`;
    return `<div class="totals">
      <div><span>Subtotal</span><span>${money(subtotal())}</span></div>
      ${delivery}
      <div class="grand"><span>Total</span><b>${money(total())}</b></div>
    </div>`;
  }

  function renderSteps() {
    const el = $("#dsteps");
    const idx = STEPS.indexOf(step);
    el.hidden = idx < 0 || !cart.items.length || !!sentRef;
    $$("li", el).forEach((li, i) => {
      li.classList.toggle("is-done", i < idx);
      li.classList.toggle("is-on", i === idx);
    });
    el.style.setProperty("--p", idx < 0 ? 0 : idx / (STEPS.length - 1));
    $("#drawerTitle").textContent =
      step === "done" ? "Receipt" : step === "pay" || step === "processing" ? "Payment" : step === "details" ? "Your details" : "Your order";
  }

  function renderDrawer() {
    const body = $("#drawerBody");
    if (step !== "processing") timers.forEach(clearTimeout);

    if (step === "done" && lastOrder) { renderSteps(); return renderReceipt(body); }
    if (sentRef) { renderSteps(); return renderWaSent(body); }
    if (!cart.items.length) {
      step = "cart";
      renderSteps();
      body.innerHTML = `
        <div class="empty">
          <img src="assets/img/jollof.jpg" alt="" loading="lazy">
          <h3>Nothing here yet.</h3>
          <p>Tap a price on the weekly lunch menu, or add a Melanin Box.</p>
          <button class="btn btn--ink" type="button" id="browse">See this week's lunch</button>
          ${lastOrder ? `<button class="link-btn" type="button" id="seeReceipt">View your last receipt (${esc(lastOrder.ref)})</button>` : ""}
        </div>`;
      $("#browse").addEventListener("click", () => { closeDrawer(); $("#lunch").scrollIntoView({ behavior: "smooth" }); });
      if (lastOrder) $("#seeReceipt").addEventListener("click", () => go("done"));
      return;
    }
    renderSteps();
    if (step === "details") return renderDetails(body);
    if (step === "pay") return renderPay(body);
    if (step === "processing") return;

    // Step 1: the order
    body.innerHTML = `
      <div class="pane">
        ${cart.items.map((i, idx) => lineHtml(i, idx, true)).join("")}
        ${totalsHtml()}
        <button class="btn btn--ink btn--block btn--big" type="button" id="toDetails">Checkout · ${money(total())} ${icon("arrow")}</button>
        <p class="drawer__fine">Pay securely with Mobile Money or card. Payment validates your order.</p>
      </div>`;
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
    $("#toDetails").addEventListener("click", () => go("details"));
  }

  // Step 2: who and where
  function renderDetails(body) {
    body.innerHTML = `
      <form class="pane" id="detailsForm" novalidate>
        <div class="seg" role="radiogroup" aria-label="Delivery or pickup">
          <label><input type="radio" name="mode" value="delivery" ${cart.mode === "delivery" ? "checked" : ""}> Delivery</label>
          <label><input type="radio" name="mode" value="pickup" ${cart.mode === "pickup" ? "checked" : ""}> Pickup</label>
        </div>
        <label class="field"><span>Your name</span><input name="name" autocomplete="name" value="${esc(cart.name)}"></label>
        <label class="field"><span>Phone number</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="024 123 4567" value="${esc(cart.phone)}"></label>
        <label class="field"><span>Email <em>${LIVE ? "for your receipt" : "optional, for your receipt"}</em></span><input name="email" type="email" autocomplete="email" value="${esc(cart.email)}"></label>
        ${cart.mode === "delivery" ? `<label class="field"><span>Deliver to</span><input name="where" autocomplete="street-address" placeholder="e.g. Lakeside Estate, near the mall" value="${esc(cart.where)}"></label>` : `<p class="note">Pickup from our kitchen in East Legon Hills. We'll send directions on WhatsApp.</p>`}
        <label class="field"><span>Notes <em>optional</em></span><textarea name="notes" rows="2" placeholder="Extra pepper, call on arrival…">${esc(cart.notes)}</textarea></label>
        <p class="form-error" id="detailsError" role="alert" hidden></p>
        <button class="btn btn--ink btn--block btn--big" type="submit">Continue to payment ${icon("arrow")}</button>
        <button class="link-btn" type="button" id="waInstead">${icon("wa")} Or send the order on WhatsApp and pay later</button>
        <button class="back-btn" type="button" data-back="cart">← Back to your order</button>
      </form>`;
    const form = $("#detailsForm");
    $$("input[name=mode]", form).forEach((r) => r.addEventListener("change", () => { cart.mode = r.value; save(); renderDetails(body); }));
    ["name", "phone", "email", "where", "notes"].forEach((k) => {
      const el = form.elements[k];
      if (el) el.addEventListener("input", () => { cart[k] = el.value; el.classList.remove("invalid"); $("#detailsError").hidden = true; save(); });
    });
    $("[data-back]", form).addEventListener("click", () => go("cart"));

    const check = (needPhone) => {
      const bad = [];
      if (!cart.name.trim()) bad.push(["name", "Add your name so we know who's ordering."]);
      if (needPhone && !validPhone(cart.phone)) bad.push(["phone", "Add a Ghana phone number, e.g. 024 123 4567."]);
      if (needPhone && LIVE && !/^\S+@\S+\.\S+$/.test(cart.email)) bad.push(["email", "Add an email address for your payment receipt."]);
      if (cart.mode === "delivery" && !cart.where.trim()) bad.push(["where", "Where should we deliver to?"]);
      if (!bad.length) return true;
      bad.forEach(([k]) => form.elements[k] && form.elements[k].classList.add("invalid"));
      form.elements[bad[0][0]].focus();
      const err = $("#detailsError");
      err.textContent = bad[0][1];
      err.hidden = false;
      return false;
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!check(true)) return;
      if (!payState.number) payState.number = cart.phone;
      go("pay");
    });
    $("#waInstead").addEventListener("click", () => {
      if (!check(false)) return;
      sentRef = newRef();
      window.open(waLink(orderMessage(sentRef)), "_blank", "noopener");
      renderDrawer();
    });
  }

  // Step 3: payment
  function renderPay(body) {
    const n = count();
    body.innerHTML = `
      <div class="pane">
        <div class="paysum">
          <span>${n} item${n === 1 ? "" : "s"} · ${cart.mode === "delivery" ? "Delivery" : "Pickup"}</span>
          <b>${money(total())}</b>
        </div>
        ${LIVE
          ? `<p class="note">You'll pay in Paystack's secure window with Mobile Money or card. Your details never touch this site.</p>`
          : `<div class="paytabs" role="tablist" aria-label="Payment method">
              <button type="button" role="tab" data-m="momo" aria-selected="${payState.method === "momo"}">Mobile Money</button>
              <button type="button" role="tab" data-m="card" aria-selected="${payState.method === "card"}">Card</button>
            </div>
            ${payState.method === "momo"
              ? `<fieldset class="field"><legend>Network</legend>
                  <div class="nets">${Object.entries(NETWORKS)
                    .map(([k, v]) => `<label class="net net--${k}"><input type="radio" name="net" value="${k}" ${payState.network === k ? "checked" : ""}><span>${v}</span></label>`)
                    .join("")}</div>
                </fieldset>
                <label class="field"><span>Mobile Money number</span><input name="momo" type="tel" inputmode="tel" value="${esc(payState.number)}" placeholder="024 123 4567"></label>`
              : `<p class="note">On the live site, card details are entered in Paystack's secure window, never on this page. In this demo the card payment is simulated.</p>`}`}
        <p class="form-error" id="payError" role="alert" hidden></p>
        <button class="btn btn--lime btn--block btn--big" type="button" id="payNow">Pay ${money(total())}</button>
        <p class="secure">${LIVE ? "Secured by Paystack" : "Demo mode · no money will be charged"}</p>
        <button class="back-btn" type="button" id="payBack">← Back to details</button>
      </div>`;
    $("#payBack").addEventListener("click", () => go("details"));
    $$("[data-m]", body).forEach((b) => b.addEventListener("click", () => { payState.method = b.dataset.m; renderPay(body); }));
    $$("input[name=net]", body).forEach((r) => r.addEventListener("change", () => { payState.network = r.value; }));
    const momo = $("input[name=momo]", body);
    if (momo) momo.addEventListener("input", () => { payState.number = momo.value; momo.classList.remove("invalid"); $("#payError").hidden = true; });
    $("#payNow").addEventListener("click", startPayment);
  }

  function startPayment() {
    const ref = newRef();
    if (LIVE) return payWithPaystack(ref);
    if (payState.method === "momo" && !validPhone(payState.number)) {
      const el = $("input[name=momo]");
      el.classList.add("invalid");
      el.focus();
      const err = $("#payError");
      err.textContent = "Enter the Mobile Money number to charge, e.g. 024 123 4567.";
      err.hidden = false;
      return;
    }
    simulatePayment(ref);
  }

  // Demo: walk through what a Mobile Money approval looks like
  function simulatePayment(ref) {
    step = "processing";
    renderSteps();
    const momo = payState.method === "momo";
    const body = $("#drawerBody");
    const stages = momo
      ? ["Sending payment prompt", "Waiting for your approval", "Confirming payment"]
      : ["Opening secure card window", "Authorising card", "Confirming payment"];
    body.innerHTML = `
      <div class="paying">
        <div class="paying__phone" aria-hidden="true">
          <span class="paying__ring"></span><span class="paying__ring paying__ring--2"></span>
          <div class="paying__screen"><b>${money(total())}</b><small>Spice N Cook</small><i></i></div>
        </div>
        <h3>${momo ? "Check your phone" : "Processing your card"}</h3>
        <p>${momo
          ? `Approve the ${money(total())} prompt from Spice N Cook on <b>${esc(maskPhone(payState.number))}</b> (${NETWORKS[payState.network]}).`
          : `Hold on while we confirm your ${money(total())} payment.`}</p>
        <ol class="paying__steps">${stages.map((s) => `<li>${s}</li>`).join("")}</ol>
        <p class="secure">Demo: the approval happens on its own in a few seconds.</p>
        <button class="back-btn" type="button" id="payCancel">Cancel payment</button>
      </div>`;
    emit("snc:step", { step: "processing" });
    const lis = $$(".paying__steps li", body);
    const at = [0, 1300, 3300, 4600];
    lis.forEach((li, i) => {
      timers.push(setTimeout(() => { li.classList.add("is-on"); if (i) lis[i - 1].classList.replace("is-on", "is-ok"); }, at[i]));
    });
    timers.push(setTimeout(() => {
      lis[lis.length - 1].classList.replace("is-on", "is-ok");
      completeOrder(ref, momo ? `${NETWORKS[payState.network]} · ${maskPhone(payState.number)}` : "Card");
    }, at[3]));
    $("#payCancel").addEventListener("click", () => { timers.forEach(clearTimeout); timers = []; go("pay"); toast("Payment cancelled. Nothing was charged."); });
  }

  // Live: Paystack's popup handles Mobile Money and cards
  function loadPaystack() {
    if (window.PaystackPop) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://js.paystack.co/v2/inline.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Could not load Paystack"));
      document.head.appendChild(s);
    });
  }
  function payWithPaystack(ref) {
    const btn = $("#payNow");
    btn.disabled = true;
    btn.textContent = "Opening secure payment…";
    loadPaystack()
      .then(() => {
        const popup = new window.PaystackPop();
        popup.newTransaction({
          key: PAY.paystackPublicKey,
          email: cart.email.trim(),
          amount: Math.round(total() * 100), // pesewas
          currency: "GHS",
          reference: ref,
          channels: ["mobile_money", "card"],
          metadata: {
            custom_fields: [
              { display_name: "Customer", variable_name: "customer", value: cart.name.trim() },
              { display_name: "Phone", variable_name: "phone", value: normPhone(cart.phone) },
              { display_name: "Fulfilment", variable_name: "fulfilment", value: cart.mode === "delivery" ? `Delivery: ${cart.where.trim()}` : "Pickup" },
              { display_name: "Items", variable_name: "items", value: cart.items.map((i) => `${i.qty}x ${i.name}${i.detail ? ` (${i.detail})` : ""} for ${i.date}`).join("; ") },
            ],
          },
          onSuccess: (tx) => completeOrder(ref, "Paystack", tx && tx.reference),
          onCancel: () => { renderPay($("#drawerBody")); toast("Payment cancelled. Nothing was charged."); },
        });
      })
      .catch(() => {
        renderPay($("#drawerBody"));
        const err = $("#payError");
        err.textContent = "We couldn't reach the payment service. Check your connection, or send the order on WhatsApp instead.";
        err.hidden = false;
      });
  }

  function completeOrder(ref, via, gatewayRef) {
    timers = [];
    lastOrder = {
      ref, via, gatewayRef: gatewayRef || null, demo: !LIVE, at: new Date().toISOString(),
      items: cart.items.map((i) => Object.assign({}, i)),
      subtotal: subtotal(), fee: fee(), total: total(),
      mode: cart.mode, name: cart.name.trim(), phone: normPhone(cart.phone), where: cart.where.trim(), notes: cart.notes.trim(),
      verified: null,
    };
    store.set("snc-last-order", lastOrder);
    cart.items = [];
    save();
    step = "done";
    renderCart();
    emit("snc:paid", { order: lastOrder });
    if (LIVE && PAY.verifyUrl) {
      fetch(`${PAY.verifyUrl}?reference=${encodeURIComponent(gatewayRef || ref)}`)
        .then((r) => r.json())
        .then((j) => { lastOrder.verified = j && j.status === "success"; store.set("snc-last-order", lastOrder); if (step === "done") renderDrawer(); })
        .catch(() => {});
    }
  }

  function receiptMessage(o) {
    return [
      `Hello Spice N Cook! 👋 I've just paid for an order on your website.`,
      ``,
      `🧾 Ref: ${o.ref}`,
      `✅ Paid: ${money(o.total)} via ${o.via}${o.demo ? " (demo)" : ""}`,
      ``,
      ...o.items.map((i, n) => `${n + 1}) ${i.qty} × ${i.name}${i.detail ? `, ${i.detail}` : ""} · ${fmtDate(fromIso(i.date))}${i.msg ? `\n    💌 Card message: "${i.msg}"` : ""}`),
      ``,
      o.mode === "delivery" ? `🛵 Deliver to: ${o.where}` : `🛍️ I'll pick up`,
      `👤 ${o.name} · ${o.phone}`,
      o.notes ? `📝 ${o.notes}` : null,
    ]
      .filter((l) => l !== null)
      .join("\n");
  }

  function renderReceipt(body) {
    const o = lastOrder;
    const when = new Date(o.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const days = [...new Set(o.items.map((i) => fmtDate(fromIso(i.date))))];
    body.innerHTML = `
      <div class="receipt">
        <div class="tick" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7.5 7.5L37.5 19"/></svg></div>
        <h3>Paid. Your order is in.</h3>
        <p>Thank you, ${esc(o.name.split(" ")[0])}. We'll have it ready for ${esc(days.join(", "))}.</p>
        <div class="slip" id="slip">
          <div class="slip__head"><img src="assets/img/logo.png" alt="Spice N Cook"><span>Receipt</span></div>
          <div class="slip__row"><span>Order</span><b>${esc(o.ref)}</b></div>
          <div class="slip__row"><span>Date</span><span>${when}</span></div>
          <div class="slip__row"><span>Paid with</span><span>${esc(o.via)}</span></div>
          ${o.gatewayRef ? `<div class="slip__row"><span>Payment ref</span><span>${esc(o.gatewayRef)}</span></div>` : ""}
          ${o.verified === true ? `<div class="slip__row"><span>Status</span><span>Verified ✓</span></div>` : ""}
          <div class="slip__items">${o.items
            .map((i) => `<div class="slip__row"><span>${i.qty} × ${esc(i.name)}${i.detail ? `<small>${esc(i.detail)} · ${fmtDate(fromIso(i.date))}</small>` : `<small>${fmtDate(fromIso(i.date))}</small>`}</span><span>${money(i.qty * i.price)}</span></div>`)
            .join("")}</div>
          ${o.fee ? `<div class="slip__row"><span>Delivery</span><span>${money(o.fee)}</span></div>` : ""}
          <div class="slip__row slip__total"><span>Total paid</span><b>${money(o.total)}</b></div>
          <div class="slip__row"><span>${o.mode === "delivery" ? "Deliver to" : "Pickup"}</span><span>${o.mode === "delivery" ? esc(o.where) : "East Legon Hills kitchen"}</span></div>
          ${o.demo ? `<p class="slip__demo">Demo payment · no money was charged</p>` : ""}
        </div>
        <a class="btn btn--wa btn--block" id="receiptWa" target="_blank" rel="noopener">${icon("wa")} Send receipt to Spice N Cook</a>
        <button class="btn btn--line btn--block" type="button" id="printReceipt">Save or print receipt</button>
        <button class="back-btn" type="button" id="doneBack">Back to the menu</button>
      </div>`;
    $("#receiptWa").href = waLink(receiptMessage(o));
    $("#printReceipt").addEventListener("click", () => window.print());
    $("#doneBack").addEventListener("click", () => { step = "cart"; closeDrawer(); renderDrawer(); });
  }

  function renderWaSent(body) {
    body.innerHTML = `
      <div class="sent">
        <span class="sent__ref">${sentRef}</span>
        <h3>Your order is in WhatsApp.</h3>
        <p>If you haven't pressed send yet, do that now. We'll reply with payment details, and your payment confirms the order.</p>
        <a class="btn btn--wa btn--block" id="reopenWa" target="_blank" rel="noopener">${icon("wa")} Open WhatsApp again</a>
        <button class="btn btn--line btn--block" type="button" id="newOrder">Start a new order</button>
      </div>`;
    $("#reopenWa").href = waLink(orderMessage(sentRef));
    $("#newOrder").addEventListener("click", () => { cart.items = []; sentRef = null; step = "cart"; save(); renderCart(); });
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
      `👤 Name: ${cart.name.trim()}${cart.phone ? ` · ${normPhone(cart.phone)}` : ""}`,
      cart.notes.trim() ? `📝 Notes: ${cart.notes.trim()}` : null,
      ``,
      `I understand payment validates my order. Please send payment details. Thank you! 🙏`,
    ]
      .filter((l) => l !== null)
      .join("\n");
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
    emit("snc:drawer", { open: true });
  }
  function closeDrawer() {
    const scrim = $("#scrim");
    scrim.classList.remove("show");
    setTimeout(() => (scrim.hidden = true), 300);
    const dr = $("#drawer");
    dr.classList.remove("open");
    dr.setAttribute("aria-hidden", "true");
    document.body.classList.remove("locked");
    if (step === "done") step = "cart";
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
    const bar = $("#bar");
    const onScroll = () => bar.classList.toggle("stuck", scrollY > 40);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    // The GSAP layer (js/anim.js) takes over when it's loaded and motion is allowed
    if (window.gsap && document.documentElement.classList.contains("anim")) {
      $$(".rv").forEach((el) => el.classList.remove("rv"));
      return;
    }
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
