/* ==========================================================================
   SPICE N COOK — app
   No framework, no build step. Reads content from js/menu.js.
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
    get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  document.documentElement.classList.remove("no-js");

  /* ---------------------------------------------------------------- Dates
     ?day=wed (or thu, fri…) simulates another weekday: handy when demoing */
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
  const nextDate = (weekday) => addDays(today, (weekday - today.getDay() + 7) % 7);
  const fmtDate = (d) => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromIso = (s) => { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd, 12); };

  const specialByDay = (n) => D.specials.find((s) => s.day === n);
  const upcomingSpecial = () =>
    D.specials.slice().sort((a, b) => ((a.day - today.getDay() + 7) % 7) - ((b.day - today.getDay() + 7) % 7))[0];

  /* --------------------------------------------------------------- Photos
     Every .photo[data-art] gets an illustration immediately; if the real
     photo at data-photo exists, it fades in and replaces the illustration. */
  const photoCache = {};
  function hydrate(root = document) {
    $$(".photo[data-art]:not([data-done])", root).forEach((el) => {
      el.dataset.done = "1";
      const src = el.dataset.photo;
      const showArt = () => { el.classList.add("photo--art"); el.innerHTML = window.SNCArt(el.dataset.art); };
      const showImg = () => {
        el.classList.remove("photo--art");
        el.classList.add("photo--real");
        el.innerHTML = `<img src="${src}" alt="${esc(el.getAttribute("aria-label") || "")}" loading="lazy" decoding="async">`;
      };
      if (!src || photoCache[src] === false) return showArt();
      if (photoCache[src] === true) return showImg();
      showArt();
      const img = new Image();
      img.onload = () => { photoCache[src] = true; showImg(); };
      img.onerror = () => { photoCache[src] = false; };
      img.src = src;
    });
  }

  /* ---------------------------------------------------------- Static links */
  function wireLinks() {
    $$("[data-wa]").forEach((a) => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-link]").forEach((a) => {
      const k = a.dataset.link;
      a.href = k === "tel" ? `tel:+${B.whatsapp}` : B[k];
    });
    $("#year").textContent = new Date().getFullYear();
  }

  /* --------------------------------------------------------- Preview bar */
  function previewBar() {
    const bar = $("#previewBar");
    let dismissed = false;
    try { dismissed = sessionStorage.getItem("snc-preview") === "x"; } catch (e) {}
    if (!D.showPreviewBar || dismissed) return;
    bar.hidden = false;
    $("#previewClose").addEventListener("click", () => {
      bar.hidden = true;
      try { sessionStorage.setItem("snc-preview", "x"); } catch (e) {}
    });
  }

  /* ----------------------------------------------------------------- Hero */
  function hero() {
    const sunday = today.getDay() === 0;
    $("#statusText").textContent = sunday ? "Resting today · orders open again Monday" : "Taking orders today · Mon – Sat";
    if (sunday) $(".pulse").classList.add("off");

    const t = specialByDay(today.getDay());
    const tm = specialByDay(addDays(today, 1).getDay());
    const s = t || tm || upcomingSpecial();
    const label = t ? "Today's special" : tm ? "Tomorrow's special" : `Next up · ${s.dayName}`;
    const d = nextDate(s.day);
    $("#todayCard").innerHTML = `
      <div class="today-card__day"><small>${s.short}</small><b>${d.getDate()}</b></div>
      <span class="today-card__label">${label}</span>
      <span class="today-card__name">${esc(s.name)}</span>
      <button class="today-card__cta" type="button" data-goto="${s.id}">From ${money(Math.min(...s.options.map((o) => o.price)))} · Order ${icon("arrow")}</button>`;
    $("#todayCard [data-goto]").addEventListener("click", () => {
      selectSpecial(s.id);
      $("#specials").scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ------------------------------------------------------------- Specials */
  let current = (specialByDay(today.getDay()) || upcomingSpecial()).id;
  const choice = {}; // special id -> option id
  const qtys = {};

  function renderWeek() {
    const start = today.getDay() === 0 ? 1 : 0;
    const cells = [];
    for (let i = start; cells.length < 6; i++) {
      const d = addDays(today, i);
      if (d.getDay() === 0) continue; // closed Sundays
      const sp = specialByDay(d.getDay());
      cells.push({ d, sp, isToday: i === 0 });
    }
    $("#week").innerHTML = cells
      .map(({ d, sp, isToday }) => {
        const cls = ["day", sp ? "day--special" : "day--off", isToday ? "day--today" : ""].join(" ");
        const inner = `<small>${d.toLocaleDateString("en-GB", { weekday: "short" })}</small><b>${d.getDate()}</b><em>${sp ? esc(sp.name.replace("Coconut Milk ", "")) : "Boxes & bulk"}</em>`;
        return sp
          ? `<button type="button" role="tab" class="${cls}" data-sp="${sp.id}" aria-selected="${sp.id === current}" aria-controls="specialPanel">${inner}</button>`
          : `<div class="${cls}" aria-hidden="true">${inner}</div>`;
      })
      .join("");
    $$("#week [data-sp]").forEach((b) => b.addEventListener("click", () => selectSpecial(b.dataset.sp)));
  }

  function selectSpecial(id) {
    current = id;
    $$("#week [data-sp]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.sp === id)));
    renderSpecial();
  }

  function renderSpecial() {
    const s = D.specials.find((x) => x.id === current);
    const opt = choice[s.id] || s.options[0].id;
    const qty = qtys[s.id] || 1;
    const price = s.options.find((o) => o.id === opt).price;
    const d = nextDate(s.day);
    const isToday = d.getDay() === today.getDay();
    const panel = $("#specialPanel");
    panel.innerHTML = `
      <div class="special__media">
        <span class="day-badge">${icon("spark")} Every ${s.dayName}</span>
        <div class="photo" data-photo="${s.photo}" data-art="${s.art}" aria-label="${esc(s.name)}"></div>
      </div>
      <div class="special__body">
        <p class="special__when">${icon("clock")} ${isToday ? "On the menu today!" : `Next serving: ${fmtDate(d)}`}</p>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.blurb)}</p>
        <ul class="includes">${s.sides.map((x) => `<li>${icon("check")}${esc(x)}</li>`).join("")}</ul>
        <p class="opt-title">Choose your protein</p>
        <div class="options" role="radiogroup" aria-label="Protein">
          ${s.options
            .map(
              (o) => `<label class="opt">
                <input type="radio" name="opt-${s.id}" value="${o.id}" ${o.id === opt ? "checked" : ""}>
                <span class="opt__dot"></span>
                <span class="opt__label">${esc(o.label)}<small>with ${esc(s.sides.slice(0, -1).join(", ").toLowerCase())} & juice</small></span>
                <span class="opt__price"><small>${B.currency}</small>${o.price}</span>
              </label>`
            )
            .join("")}
        </div>
        <div class="buy">
          <div class="qty" aria-label="Quantity">
            <button type="button" data-q="-1" aria-label="One less">−</button>
            <output aria-live="polite">${qty}</output>
            <button type="button" data-q="1" aria-label="One more">+</button>
          </div>
          <button class="btn btn--primary btn--lg" type="button" id="addSpecial">${icon("bag")} Add to order · <span id="addPrice">${money(price * qty)}</span></button>
        </div>
        <p class="fineprint">${icon("cash")} For ${fmtDate(d)} · Payment validates order</p>
      </div>`;
    hydrate(panel);

    $$("input[type=radio]", panel).forEach((r) =>
      r.addEventListener("change", () => { choice[s.id] = r.value; updatePrice(); })
    );
    $$(".qty button", panel).forEach((b) =>
      b.addEventListener("click", () => {
        qtys[s.id] = Math.max(1, Math.min(50, (qtys[s.id] || 1) + Number(b.dataset.q)));
        $(".qty output", panel).textContent = qtys[s.id];
        updatePrice();
      })
    );
    function updatePrice() {
      const o = s.options.find((x) => x.id === (choice[s.id] || s.options[0].id));
      $("#addPrice").textContent = money(o.price * (qtys[s.id] || 1));
    }
    $("#addSpecial").addEventListener("click", (e) => {
      const o = s.options.find((x) => x.id === (choice[s.id] || s.options[0].id));
      const q = qtys[s.id] || 1;
      addToCart(
        {
          key: `${s.id}|${o.id}|${isoDate(d)}`,
          name: s.name,
          detail: `${o.label} + juice`,
          price: o.price,
          qty: q,
          date: isoDate(d),
          art: s.art,
          photo: s.photo,
        },
        e.currentTarget
      );
      qtys[s.id] = 1;
      $(".qty output", panel).textContent = 1;
      updatePrice();
    });
  }

  /* ---------------------------------------------------------------- Boxes */
  function renderBoxes() {
    const minDate = isoDate(addDays(today, 1));
    $("#boxesGrid").innerHTML = D.boxes
      .map(
        (b) => `
      <article class="box reveal" data-box="${b.id}">
        <div class="box__media">
          <div class="box__price"><small>${B.currency}</small><b>${b.price}</b><span>per box</span></div>
          <div class="photo" data-photo="${b.photo}" data-art="${b.art}" aria-label="${esc(b.name)}"></div>
        </div>
        <div class="box__body">
          <span class="box__kicker">${esc(b.kicker)}</span>
          <h3>${esc(b.name)}</h3>
          <ul class="contents">${b.contents.map((c) => `<li class="${b.exclusive.includes(c) ? "excl" : ""}">${icon("check")}<span>${esc(c)}</span></li>`).join("")}</ul>
          <form class="box__form" novalidate>
            <div class="box__row">
              <label class="field"><span>Delivery date</span><input type="date" name="date" min="${minDate}" required></label>
              <div class="field"><span>Boxes</span>
                <div class="qty"><button type="button" data-q="-1" aria-label="One less">−</button><output>1</output><button type="button" data-q="1" aria-label="One more">+</button></div>
              </div>
            </div>
            <label class="field"><span>${icon("gift")} Thank-you card message <small>(optional, we'll write it for you)</small></span>
              <textarea name="msg" rows="2" maxlength="160" placeholder="Happy birthday Esi! Love, the team 💛"></textarea></label>
            <button class="btn btn--gold btn--lg btn--block" type="submit">${icon("bag")} Pre-order · <span class="box__total">${money(b.price)}</span></button>
          </form>
        </div>
      </article>`
      )
      .join("");

    $$("#boxesGrid .box").forEach((card) => {
      const b = D.boxes.find((x) => x.id === card.dataset.box);
      const form = $("form", card);
      let q = 1;
      $$(".qty button", card).forEach((btn) =>
        btn.addEventListener("click", () => {
          q = Math.max(1, Math.min(30, q + Number(btn.dataset.q)));
          $(".qty output", card).textContent = q;
          $(".box__total", card).textContent = money(b.price * q);
        })
      );
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const date = form.date.value;
        if (!date || date < minDate) {
          form.date.classList.add("invalid");
          form.date.focus();
          toast(`Pick a date for your ${b.name}`, "clock");
          return;
        }
        form.date.classList.remove("invalid");
        const msg = form.msg.value.trim();
        addToCart(
          { key: `${b.id}|${date}|${msg}`, name: b.name, detail: "", price: b.price, qty: q, date, msg, art: b.art, photo: b.photo },
          $("button[type=submit]", form)
        );
        q = 1;
        $(".qty output", card).textContent = 1;
        $(".box__total", card).textContent = money(b.price);
        form.msg.value = "";
      });
      form.date.addEventListener("input", () => form.date.classList.remove("invalid"));
    });
    hydrate($("#boxesGrid"));

    $("#compareToggle").addEventListener("change", (e) => $("#boxesGrid").classList.toggle("compare", e.target.checked));
  }

  /* ----------------------------------------------------------------- Cart */
  const cart = store.get("snc-cart", { items: [], mode: "delivery", name: "", where: "", notes: "" });
  let sentRef = null;

  function saveCart() { store.set("snc-cart", cart); }
  const cartCount = () => cart.items.reduce((n, i) => n + i.qty, 0);
  const cartTotal = () => cart.items.reduce((n, i) => n + i.qty * i.price, 0);

  function addToCart(item, fromEl) {
    sentRef = null;
    const found = cart.items.find((i) => i.key === item.key);
    if (found) found.qty += item.qty;
    else cart.items.push(item);
    saveCart();
    flyToCart(fromEl, item.art, () => {
      renderCart();
      const btn = $("#cartBtn");
      btn.classList.remove("bump");
      void btn.offsetWidth;
      btn.classList.add("bump");
    });
    toast(`Added ${item.qty} × ${item.name} to your order`, "check");
  }

  function flyToCart(fromEl, art, done) {
    const target = $("#cartBtn").getBoundingClientRect();
    if (!fromEl || !Element.prototype.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
    const r = fromEl.getBoundingClientRect();
    const fly = document.createElement("div");
    fly.className = "flyer";
    fly.innerHTML = window.SNCArt(art);
    fly.style.left = "0"; fly.style.top = "0";
    document.body.appendChild(fly);
    const sx = r.left + r.width / 2 - 23, sy = r.top + r.height / 2 - 23;
    const ex = target.left + target.width / 2 - 23, ey = target.top + target.height / 2 - 23;
    const anim = fly.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) scale(1)`, opacity: 1 },
        { transform: `translate(${(sx + ex) / 2}px, ${Math.min(sy, ey) - 120}px) scale(1.3) rotate(180deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${ex}px, ${ey}px) scale(0.3) rotate(360deg)`, opacity: 0.4 },
      ],
      { duration: 800, easing: "cubic-bezier(.5,0,.3,1)" }
    );
    anim.onfinish = () => { fly.remove(); done(); };
  }

  function renderCart() {
    const n = cartCount();
    const c = $("#cartCount");
    c.textContent = n;
    c.classList.toggle("show", n > 0);
    $("#cartBtn").setAttribute("aria-label", `Open your order (${n} item${n === 1 ? "" : "s"})`);
    const bar = $("#orderBar");
    bar.hidden = n === 0;
    document.body.classList.toggle("has-cart", n > 0);
    $("#orderBarCount").textContent = `${n} item${n === 1 ? "" : "s"}`;
    $("#orderBarTotal").textContent = money(cartTotal());
    renderDrawer();
  }

  function renderDrawer() {
    const body = $("#drawerBody");
    if (sentRef) {
      body.innerHTML = `
        <div class="sent">
          <div class="sent__tick">${icon("check")}</div>
          <h3>Order sent to WhatsApp!</h3>
          <p>Hit <b>send</b> in WhatsApp if you haven't yet. We'll reply with payment details, and your payment confirms the order.</p>
          <span class="ref">${sentRef}</span>
          <a class="btn btn--wa btn--block" id="reopenWa" target="_blank" rel="noopener">${icon("wa")} Open WhatsApp again</a>
          <button class="btn btn--ghost btn--block" type="button" id="newOrder">Start a new order</button>
        </div>`;
      $("#reopenWa").href = waLink(buildOrderMessage(sentRef));
      $("#newOrder").addEventListener("click", () => { cart.items = []; sentRef = null; saveCart(); renderCart(); });
      return;
    }
    if (!cart.items.length) {
      body.innerHTML = `
        <div class="empty">
          <div class="photo" data-art="jollof"></div>
          <h3>Your order is empty</h3>
          <p>The jollof is waiting. Pick a weekly special or a Melanin Box to get started.</p>
          <button class="btn btn--primary" type="button" id="browse">Browse the menu ${icon("arrow")}</button>
        </div>`;
      hydrate(body);
      $("#browse").addEventListener("click", () => { closeDrawer(); $("#specials").scrollIntoView({ behavior: "smooth" }); });
      return;
    }
    body.innerHTML = `
      <div class="lines">${cart.items
        .map(
          (i, idx) => `
        <div class="line">
          <div class="photo" data-art="${i.art}"></div>
          <div>
            <div class="line__name">${esc(i.name)}</div>
            <div class="line__meta">${i.detail ? esc(i.detail) + "<br>" : ""}<i>${fmtDate(fromIso(i.date))}</i>${i.msg ? `<br>💌 “${esc(i.msg)}”` : ""}</div>
          </div>
          <div class="line__side">
            <span class="line__price">${money(i.price * i.qty)}</span>
            <div class="qty qty--sm"><button type="button" data-idx="${idx}" data-q="-1" aria-label="One less">−</button><output>${i.qty}</output><button type="button" data-idx="${idx}" data-q="1" aria-label="One more">+</button></div>
            <button class="line__remove" type="button" data-rm="${idx}">Remove</button>
          </div>
        </div>`
        )
        .join("")}</div>
      <div class="seg" role="radiogroup" aria-label="Delivery or pickup">
        <label><input type="radio" name="mode" value="delivery" ${cart.mode === "delivery" ? "checked" : ""}> 🛵 Delivery</label>
        <label><input type="radio" name="mode" value="pickup" ${cart.mode === "pickup" ? "checked" : ""}> 🛍️ Pickup</label>
      </div>
      <label class="field"><span>Your name</span><input name="name" autocomplete="name" placeholder="Ama Mensah" value="${esc(cart.name)}"></label>
      <label class="field" id="whereField" ${cart.mode === "pickup" ? "hidden" : ""}><span>Delivery location</span><input name="where" autocomplete="street-address" placeholder="e.g. Lakeside Estate, near the mall" value="${esc(cart.where)}"></label>
      <label class="field"><span>Notes <small>(optional)</small></span><textarea name="notes" rows="2" placeholder="Extra pepper, no gizzard, call on arrival…">${esc(cart.notes)}</textarea></label>
      <div class="summary">
        <div><span>Subtotal</span><span>${money(cartTotal())}</span></div>
        ${cart.mode === "delivery" ? `<div><span>Delivery</span><span>Confirmed on WhatsApp</span></div>` : ""}
        <div class="total"><span>Total</span><b>${money(cartTotal())}</b></div>
      </div>
      <p class="form-error" id="cartError" role="alert" hidden></p>
      <button class="btn btn--wa btn--lg btn--block" type="button" id="sendOrder">${icon("wa")} Send order on WhatsApp</button>
      <p class="drawer__fine">${icon("cash")} Payment validates order · we'll reply with payment details</p>`;
    hydrate(body);

    $$("[data-q]", body).forEach((b) =>
      b.addEventListener("click", () => {
        const it = cart.items[b.dataset.idx];
        it.qty += Number(b.dataset.q);
        if (it.qty < 1) cart.items.splice(b.dataset.idx, 1);
        saveCart();
        renderCart();
      })
    );
    $$("[data-rm]", body).forEach((b) =>
      b.addEventListener("click", () => { cart.items.splice(b.dataset.rm, 1); saveCart(); renderCart(); })
    );
    $$("input[name=mode]", body).forEach((r) =>
      r.addEventListener("change", () => { cart.mode = r.value; saveCart(); renderDrawer(); })
    );
    ["name", "where", "notes"].forEach((k) => {
      const el = $(`[name=${k}]`, body);
      el.addEventListener("input", () => { cart[k] = el.value; el.classList.remove("invalid"); $("#cartError").hidden = true; saveCart(); });
    });
    $("#sendOrder").addEventListener("click", sendOrder);
  }

  function buildOrderMessage(ref) {
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
      `💰 Total: ${money(cartTotal())}`,
      cart.mode === "delivery" ? `🛵 Delivery to: ${cart.where.trim()}` : `🛍️ I'll pick up`,
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
    const err = $("#cartError");
    const missing = [];
    if (!cart.name.trim()) missing.push("name");
    if (cart.mode === "delivery" && !cart.where.trim()) missing.push("where");
    if (missing.length) {
      missing.forEach((k) => $(`[name=${k}]`, body).classList.add("invalid"));
      $(`[name=${missing[0]}]`, body).focus();
      err.textContent = missing.includes("name") ? "Please add your name so we know who's ordering." : "Where should we deliver to?";
      err.hidden = false;
      return;
    }
    const ref = `SNC-${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;
    window.open(waLink(buildOrderMessage(ref)), "_blank", "noopener");
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
    setTimeout(() => dr.focus(), 50);
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
    form.date.min = isoDate(addDays(today, 1));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const items = $$("input[name=items]:checked", form).map((i) => i.value);
      const err = $("#bulkError");
      const bad = [];
      if (!form.date.value) bad.push(form.date);
      if (!form.guests.value) bad.push(form.guests);
      if (!form.name.value.trim()) bad.push(form.name);
      $$(".invalid", form).forEach((x) => x.classList.remove("invalid"));
      if (bad.length || (!items.length && !form.notes.value.trim())) {
        bad.forEach((x) => x.classList.add("invalid"));
        err.textContent = bad.length ? "Please fill in the date, number of people and your name." : "Pick at least one dish or tell us what you need.";
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
      toast("Opening WhatsApp with your request…", "wa");
    });
    form.addEventListener("input", (e) => e.target.classList && e.target.classList.remove("invalid"));
  }

  /* --------------------------------------------------------------- Hiring */
  function hiring() {
    const h = D.hiring;
    if (!h || !h.open) { $("#hiring").remove(); return; }
    $("#hiringRole").textContent = h.role;
    $("#hiringReqs").innerHTML = h.requirements.map((r) => `<li>${esc(r)}</li>`).join("");
    $("#hiringBtn").href = waLink(`Hello Spice N Cook! I'm interested in the ${h.role} role. My name is …`);
    $("#hiringBtn").target = "_blank";
  }

  /* ---------------------------------------------------------------- Toast */
  let toastTimer;
  function toast(text, ic = "check") {
    const t = $("#toast");
    t.innerHTML = `${icon(ic)}<span>${esc(text)}</span>`;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* --------------------------------------------------------------- Motion */
  function motion() {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    $$(".reveal").forEach((el, i) => {
      el.style.transitionDelay = `${Math.min((i % 4) * 80, 240)}ms`;
      io.observe(el);
    });

    const fmt = (n, k) => (k && n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : Math.round(n).toLocaleString("en-GH"));
    const counter = new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        counter.unobserve(e.target);
        const el = e.target, end = Number(el.dataset.count), k = el.dataset.format === "k";
        const t0 = performance.now();
        const step = (t) => {
          const p = Math.min(1, (t - t0) / 1600);
          el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)), k);
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = fmt(end, k) + "+";
        };
        requestAnimationFrame(step);
      })
    );
    $$("[data-count]").forEach((el) => counter.observe(el));

    const nav = $("#nav");
    const onScroll = () => nav.classList.toggle("scrolled", scrollY > 10);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------------- Boot */
  wireLinks();
  previewBar();
  hero();
  renderWeek();
  renderSpecial();
  renderBoxes();
  bulk();
  hiring();
  hydrate();
  renderCart();
  motion();

  $("#cartBtn").addEventListener("click", openDrawer);
  $("#orderBar").addEventListener("click", openDrawer);
  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#scrim").addEventListener("click", closeDrawer);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#drawer").classList.contains("open")) closeDrawer(); });
})();
