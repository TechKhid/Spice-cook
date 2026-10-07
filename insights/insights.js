/* ==========================================================================
   Spice N Cook — visitor insights dashboard
   Reads visits through the passphrase-protected snc_read() function in
   Supabase (see supabase/insights.sql). ?demo=1 shows sample data.
   ========================================================================== */

(function () {
  "use strict";

  const C = (window.SNC && window.SNC.insights) || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const DEMO = new URLSearchParams(location.search).has("demo");
  const BASE = (C.supabaseUrl || "").replace(/\/+$/, "");
  const PAGE = 25;
  const lastSeen = Number(ls.get("snc-insights-seen")) || 0;

  let pass = ls.get("snc-insights-pass") || "";
  let range = Number(ls.get("snc-insights-range")) || 7;
  let sessions = [];
  let shown = PAGE;
  let fetchedAt = 0;
  let map = null, dots = null;

  /* ---------------------------------------------------------- helpers */
  const nf = new Intl.NumberFormat("en-GB");
  const plural = (n, w) => `${nf.format(n)} ${w}${n === 1 ? "" : "s"}`;
  const flag = (cc) => (cc && /^[A-Za-z]{2}$/.test(cc) ? String.fromCodePoint(...cc.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0))) : "📍");
  function dur(s) {
    if (!s) return "—";
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60), r = s % 60;
    return m < 60 ? `${m}m ${String(r).padStart(2, "0")}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
  }
  function ago(t) {
    const s = Math.round((Date.now() - t) / 1000);
    if (s < 45) return "just now";
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    return `${Math.round(s / 86400)} d ago`;
  }
  const when = (t) => new Date(t).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const place = (v) => (v ? [v.city, v.region, v.country].filter(Boolean).join(", ") || (v.tz ? `${v.tz.replace(/_/g, " ")} (time zone)` : "") : "") || "Unknown location";
  function source(s) {
    const v = s.view || {};
    if (v.tag) return `Your link: ${v.tag}`;
    if (v.app) return `${v.app} app`;
    if (v.ref) return v.ref;
    return "Direct or shared link";
  }

  /* ------------------------------------------------------------ views */
  function show(id) {
    ["setup", "login", "dash"].forEach((k) => ($(`#${k}`).hidden = k !== id));
    $("#topActions").hidden = id !== "dash";
  }
  function status(html) { $("#status").innerHTML = html; }

  /* ------------------------------------------------------------- data */
  async function fetchEvents() {
    const since = new Date(Date.now() - range * 86400000).toISOString();
    if (DEMO) return sample().filter((e) => e.at >= since);
    const res = await fetch(`${BASE}/rest/v1/rpc/snc_read`, {
      method: "POST",
      headers: { apikey: C.supabaseKey, "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase: pass, since }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const err = new Error(j.message || `HTTP ${res.status}`);
      err.auth = /passphrase/i.test(j.message || "") || j.code === "28P01";
      throw err;
    }
    return res.json();
  }

  function build(events) {
    const by = new Map();
    events
      .slice()
      .sort((a, b) => (a.at < b.at ? -1 : 1))
      .forEach((e) => {
        let s = by.get(e.sid);
        if (!s) {
          s = { sid: e.sid, vid: e.vid, start: Date.parse(e.at), end: Date.parse(e.at), view: null, steps: [], sections: [], adds: 0, checkout: false, pay: false, paid: null, wa: 0, bulk: false, secs: 0 };
          by.set(e.sid, s);
        }
        s.end = Date.parse(e.at);
        switch (e.type) {
          case "view": if (!s.view) s.view = e; break;
          case "section": if (e.detail && !s.sections.includes(e.detail)) { s.sections.push(e.detail); s.steps.push({ k: "sec", t: e.detail }); } break;
          case "add": s.adds++; s.steps.push({ k: "act", t: `Added ${e.detail || "an item"}` }); break;
          case "checkout": s.checkout = true; s.steps.push({ k: "act", t: "Started checkout" }); break;
          case "pay": s.pay = true; s.steps.push({ k: "act", t: "Reached payment" }); break;
          case "paid": s.paid = e.detail || "yes"; s.steps.push({ k: "paid", t: `Paid ${e.detail || ""}`.trim() }); break;
          case "whatsapp": s.wa++; s.steps.push({ k: "act", t: "Tapped WhatsApp" }); break;
          case "bulk": s.bulk = true; s.steps.push({ k: "act", t: "Asked for a bulk quote" }); break;
          case "leave": s.secs = Math.max(s.secs, e.secs || 0); break;
        }
      });
    const list = [...by.values()].sort((a, b) => b.start - a.start);
    const seenVid = new Set();
    list.slice().reverse().forEach((s) => { if (seenVid.has(s.vid)) s.returning = true; else seenVid.add(s.vid); });
    return list;
  }

  async function load(firstTime) {
    try {
      const events = await fetchEvents();
      sessions = build(events);
      fetchedAt = Date.now();
      if (firstTime) {
        show("dash");
        if (!DEMO) ls.set("snc-insights-seen", String(Date.now()));
      }
      render();
      return true;
    } catch (err) {
      if (err.auth) {
        ls.del("snc-insights-pass");
        pass = "";
        show("login");
        const e = $("#loginError");
        e.textContent = "That passphrase didn't work.";
        e.hidden = false;
      } else if (firstTime) {
        show("login");
        const e = $("#loginError");
        e.textContent = `Couldn't reach the database (${err.message}). Check the Supabase URL and key in js/menu.js.`;
        e.hidden = false;
      } else {
        status(`<span>Couldn't refresh: ${esc(err.message)}. Showing the last data.</span>`);
      }
      return false;
    }
  }

  /* ----------------------------------------------------------- render */
  function render() {
    $("#demoBanner").hidden = !DEMO;
    $$(".range button").forEach((b) => b.setAttribute("aria-selected", String(Number(b.dataset.range) === range)));
    tiles();
    chart();
    mapView();
    lists();
    feed();
    tick();
  }

  function tiles() {
    const n = sessions.length;
    const people = new Set(sessions.map((s) => s.vid)).size;
    const timed = sessions.filter((s) => s.secs > 0);
    const avg = timed.length ? Math.round(timed.reduce((a, s) => a + s.secs, 0) / timed.length) : 0;
    const co = sessions.filter((s) => s.checkout).length;
    const paid = sessions.filter((s) => s.paid).length;
    const wa = sessions.filter((s) => s.wa).length;
    const label = range === 1 ? "last 24 hours" : `last ${range} days`;
    const t = (cls, l, v, sub) => `<div class="tile ${cls}"><p class="tile__label">${l}</p><p class="tile__value">${v}</p><p class="tile__sub">${sub}</p></div>`;
    $("#tiles").innerHTML =
      t("tile--hero", "Visits", nf.format(n), label) +
      t("", "Visitors", nf.format(people), plural(sessions.filter((s) => s.returning).length, "return visit")) +
      t("", "Average time", dur(avg), "per visit, tab in view") +
      t("", "Started checkout", nf.format(co), n ? `${Math.round((co / n) * 100)}% of visits` : "—") +
      t("", "Payments", nf.format(paid), "demo and real") +
      t("", "WhatsApp taps", nf.format(wa), "visits that tapped WhatsApp");
  }

  // Visits over time: one series, columns with rounded data-ends, hover tooltip
  function chart() {
    const box = $("#chart");
    const hourly = range === 1;
    const buckets = [];
    const now = new Date();
    if (hourly) {
      const h0 = new Date(now); h0.setMinutes(0, 0, 0);
      for (let i = 23; i >= 0; i--) buckets.push({ t: h0.getTime() - i * 3600000, span: 3600000 });
    } else {
      const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
      for (let i = range - 1; i >= 0; i--) { const d = new Date(d0); d.setDate(d.getDate() - i); buckets.push({ t: d.getTime(), span: 86400000 }); }
    }
    buckets.forEach((b) => { b.n = sessions.filter((s) => s.start >= b.t && s.start < b.t + b.span).length; });
    const fmt = (t) => hourly ? new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : new Date(t).toLocaleDateString("en-GB", { weekday: range <= 7 ? "short" : undefined, day: "numeric", month: "short" });
    $("#chartTitle").textContent = hourly ? "Visits per hour" : "Visits per day";

    const W = Math.max(280, box.clientWidth), H = 240, L = 34, R = 6, T = 12, B = 26;
    const max = Math.max(1, ...buckets.map((b) => b.n));
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((s) => max / s <= 4) || Math.ceil(max / 4);
    const top = Math.ceil(max / step) * step;
    const y = (v) => T + (H - T - B) * (1 - v / top);
    const slot = (W - L - R) / buckets.length;
    const bw = Math.max(2, Math.min(24, slot * 0.7));
    const every = Math.ceil(buckets.length / Math.floor((W - L) / 56));
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc($("#chartTitle").textContent)}"><g class="grid axis">`;
    for (let v = 0; v <= top; v += step) svg += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${nf.format(v)}</text>`;
    svg += `</g><g class="axis">`;
    buckets.forEach((b, i) => {
      if (i % every === 0 || i === buckets.length - 1) svg += `<text x="${L + slot * i + slot / 2}" y="${H - 6}" text-anchor="middle">${esc(fmt(b.t))}</text>`;
    });
    svg += `</g>`;
    buckets.forEach((b, i) => {
      const x = L + slot * i + (slot - bw) / 2;
      const h = (H - T - B) * (b.n / top);
      const r = Math.min(4, bw / 2, h);
      const yb = H - B;
      const path = h > 0 ? `M${x},${yb}V${yb - h + r}Q${x},${yb - h} ${x + r},${yb - h}H${x + bw - r}Q${x + bw},${yb - h} ${x + bw},${yb - h + r}V${yb}Z` : "";
      svg += `<g class="col" tabindex="0" data-i="${i}" aria-label="${esc(fmt(b.t))}: ${plural(b.n, "visit")}"><rect class="hit" x="${L + slot * i}" y="${T}" width="${slot}" height="${H - T - B}"/>${path ? `<path class="bar" d="${path}"/>` : ""}</g>`;
    });
    svg += `</svg>`;
    svg += `<table class="sr-only"><caption>${esc($("#chartTitle").textContent)}</caption><tr><th>Period</th><th>Visits</th></tr>${buckets.map((b) => `<tr><td>${esc(fmt(b.t))}</td><td>${b.n}</td></tr>`).join("")}</table>`;
    box.innerHTML = svg;

    const tip = $("#tip");
    const card = box.closest(".card");
    const showTip = (g) => {
      const b = buckets[g.dataset.i];
      const r = g.querySelector(".hit").getBoundingClientRect();
      const c = card.getBoundingClientRect();
      tip.innerHTML = `<b>${plural(b.n, "visit")}</b>${esc(hourly ? `${fmt(b.t)}, ${new Date(b.t).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}` : new Date(b.t).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }))}`;
      tip.style.left = `${Math.min(Math.max(r.left - c.left + r.width / 2, 70), c.width - 70)}px`;
      tip.style.top = `${y(b.n) + (box.getBoundingClientRect().top - c.top)}px`;
      tip.hidden = false;
    };
    $$(".col", box).forEach((g) => {
      g.addEventListener("pointerenter", () => showTip(g));
      g.addEventListener("focus", () => showTip(g));
      g.addEventListener("pointerleave", () => (tip.hidden = true));
      g.addEventListener("blur", () => (tip.hidden = true));
    });
  }

  function mapView() {
    const note = $("#mapNote");
    if (!window.L) { $("#map").innerHTML = `<p class="muted" style="padding:16px">Map unavailable.</p>`; return; }
    if (!map) {
      map = L.map("map", { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView([5.65, -0.17], 10);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18, subdomains: "abcd",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);
      dots = L.layerGroup().addTo(map);
    }
    dots.clearLayers();
    const groups = new Map();
    sessions.forEach((s) => {
      const v = s.view;
      if (!v || v.lat == null || v.lon == null) return;
      const k = `${v.lat},${v.lon}`;
      const g = groups.get(k) || { lat: Number(v.lat), lon: Number(v.lon), name: place(v), n: 0 };
      g.n++;
      groups.set(k, g);
    });
    const pts = [...groups.values()];
    pts.forEach((g) => {
      L.circleMarker([g.lat, g.lon], { radius: 6 + Math.sqrt(g.n) * 4, color: "#fbf8f2", weight: 2, fillColor: "#1d6b34", fillOpacity: 0.7 })
        .bindPopup(`<b>${esc(g.name)}</b><br>${plural(g.n, "visit")}`)
        .addTo(dots);
    });
    note.textContent = pts.length ? `${plural(pts.length, "place")}` : "No locations yet";
    setTimeout(() => {
      map.invalidateSize();
      if (pts.length === 1) map.setView([pts[0].lat, pts[0].lon], 10);
      else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lon])), { padding: [30, 30], maxZoom: 11 });
    }, 50);
  }

  function barList(el, rows, total) {
    el.innerHTML = rows.length
      ? rows.map(([name, n]) => `<li><span class="name" title="${esc(name)}">${esc(name)}</span><span class="val">${nf.format(n)}</span><span class="track"><span class="fill" style="width:${Math.max(2, Math.round((n / total) * 100))}%"></span></span></li>`).join("")
      : `<li class="empty">No visits in this period yet.</li>`;
  }
  function lists() {
    const count = (fn) => {
      const m = new Map();
      sessions.forEach((s) => { const k = fn(s); m.set(k, (m.get(k) || 0) + 1); });
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    const n = sessions.length || 1;
    const loc = count((s) => { const v = s.view; return v && (v.city || v.country) ? [v.city, v.country].filter(Boolean).join(", ") : place(v); });
    barList($("#locations"), loc.slice(0, 8), loc.length ? loc[0][1] : 1);
    const src = count(source);
    barList($("#sources"), src.slice(0, 6), src.length ? src[0][1] : 1);
    const has = (k) => sessions.filter((s) => s.sections.includes(k)).length;
    const funnel = sessions.length ? [
      ["Opened the site", sessions.length],
      ["Weekly lunch menu", has("Weekly lunch")],
      ["Melanin Box", has("Melanin Box")],
      ["Gifting", has("Gifting")],
      ["Bulk orders", has("Bulk orders")],
      ["Added to order", sessions.filter((s) => s.adds).length],
      ["Started checkout", sessions.filter((s) => s.checkout).length],
      ["Paid", sessions.filter((s) => s.paid).length],
    ] : [];
    barList($("#funnel"), funnel, n);
  }

  function feed() {
    const list = sessions.slice(0, shown);
    $("#sessions").innerHTML = list.length
      ? list.map((s) => {
          const v = s.view || {};
          const how = [v.device, v.os, v.app ? `opened in ${v.app}` : v.browser].filter(Boolean).join(" · ");
          const from = v.tag ? `<span class="tag">Your link: ${esc(v.tag)}</span>` : v.ref ? `from ${esc(v.ref)}` : "";
          return `<li class="s">
            <div class="s__where"><span class="s__flag" aria-hidden="true">${flag(v.cc)}</span>${esc(place(s.view))}
              ${!DEMO && s.start > lastSeen ? '<span class="s__new">New</span>' : ""}${s.returning ? '<span class="s__ret">Returning</span>' : ""}</div>
            <div class="s__when"><b>${esc(when(s.start))}</b>${ago(s.start)} · stayed ${dur(s.secs)}</div>
            <p class="s__meta">${[esc(how), from].filter(Boolean).join(" · ") || "Device unknown"}</p>
            ${s.steps.length ? `<div class="s__path">${s.steps.map((p) => `<span class="chip ${p.k === "act" ? "chip--act" : p.k === "paid" ? "chip--paid" : ""}">${esc(p.t)}</span>`).join("")}</div>` : ""}
          </li>`;
        }).join("")
      : `<li class="s"><p class="muted">No visits in this period yet. Share the site link and they'll appear here within seconds.</p></li>`;
    $("#more").hidden = sessions.length <= shown;
  }

  function tick() {
    if (!fetchedAt) return;
    status(`<span class="live" aria-hidden="true"></span> ${DEMO ? "Sample data" : "Live"} · updated ${ago(fetchedAt)}`);
  }

  /* -------------------------------------------------------- CSV export */
  function csv() {
    const cols = ["started", "location", "country_code", "device", "os", "browser", "in_app", "source", "seconds", "returning", "journey"];
    const rows = sessions.map((s) => {
      const v = s.view || {};
      return [new Date(s.start).toISOString(), place(s.view), v.cc || "", v.device || "", v.os || "", v.browser || "", v.app || "", source(s), s.secs, s.returning ? "yes" : "no", s.steps.map((p) => p.t).join(" > ")];
    });
    const out = [cols, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([out], { type: "text/csv" }));
    a.download = `spicencook-visits-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ------------------------------------------------------ sample data */
  function sample() {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const places = [
      ["Accra", "Greater Accra", "Ghana", "GH", 5.6, -0.2, 9], ["East Legon", "Greater Accra", "Ghana", "GH", 5.6, -0.1, 7],
      ["Tema", "Greater Accra", "Ghana", "GH", 5.7, 0.0, 3], ["Kumasi", "Ashanti", "Ghana", "GH", 6.7, -1.6, 2],
      ["Takoradi", "Western", "Ghana", "GH", 4.9, -1.8, 1], ["London", "England", "United Kingdom", "GB", 51.5, -0.1, 1],
      ["Lagos", "Lagos", "Nigeria", "NG", 6.5, 3.4, 1],
    ];
    const weighted = places.flatMap((p) => Array(p[6]).fill(p));
    const devs = [["Phone", "Android", "Chrome", null], ["Phone", "iOS", "Safari", null], ["Phone", "iOS", "Safari", "Instagram"], ["Phone", "Android", "Chrome", "TikTok"], ["Computer", "Windows", "Chrome", null], ["Phone", "Android", "Chrome", "Instagram"]];
    const sections = ["Weekly lunch", "Melanin Box", "Gifting", "Bulk orders", "From the kitchen"];
    const items = ["1 × Garifotor (Peppered goat & juice)", "2 × Jollof (Peppered chicken & juice)", "1 × Melanin Box", "1 × Mini Melanin Box", "1 × Coconut Milk Pepper Rice (Peppered chicken & juice)"];
    const ev = [];
    const vids = Array.from({ length: 30 }, (_, i) => `v${1000 + i}`);
    const now = Date.now();
    for (let i = 0; i < 46; i++) {
      const sid = `s${5000 + i}`;
      const vid = i === 0 ? "v-owner" : pick(vids);
      const t0 = i === 0 ? now - 9 * 60000 : now - Math.floor(rnd() * 7 * 86400000);
      const p = i === 0 ? places[1] : pick(weighted);
      const d = i === 0 ? devs[2] : pick(devs);
      const at = (off) => new Date(t0 + off * 1000).toISOString();
      ev.push({ at: at(0), sid, vid, type: "view", city: p[0], region: p[1], country: p[2], cc: p[3], lat: p[4], lon: p[5], tz: "Africa/Accra", device: d[0], os: d[1], browser: d[2], app: d[3], tag: i === 0 ? "ig-dm" : rnd() < 0.08 ? "tiktok-bio" : null, ref: !d[3] && rnd() < 0.3 ? pick(["google.com", "l.instagram.com", "wa.me"]) : null });
      const depth = i === 0 ? 5 : Math.floor(rnd() * 6);
      let off = 6;
      for (let k = 0; k < Math.min(depth, sections.length); k++) { off += 8 + Math.floor(rnd() * 30); ev.push({ at: at(off), sid, vid, type: "section", detail: sections[k] }); }
      const added = i === 0 || rnd() < 0.3;
      const checkedOut = added && (i === 0 || rnd() < 0.55);
      if (added) { off += 20; ev.push({ at: at(off), sid, vid, type: "add", detail: i === 0 ? "1 × Mini Melanin Box" : pick(items) }); }
      if (checkedOut) { off += 25; ev.push({ at: at(off), sid, vid, type: "checkout" }); off += 30; ev.push({ at: at(off), sid, vid, type: "pay" }); }
      if (checkedOut && (i === 0 || rnd() < 0.4)) { off += 12; ev.push({ at: at(off), sid, vid, type: "paid", detail: i === 0 ? "GHS 470 (demo) · 1 item" : "GHS 220 (demo) · 1 item" }); }
      if (rnd() < 0.12) { off += 5; ev.push({ at: at(off), sid, vid, type: "whatsapp", detail: "link" }); }
      off += 10 + Math.floor(rnd() * 120);
      ev.push({ at: at(off), sid, vid, type: "leave", secs: i === 0 ? 312 : off });
    }
    return ev;
  }

  /* -------------------------------------------------------------- boot */
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target;
    pass = f.pass.value.trim();
    $("#loginError").hidden = true;
    const btn = $("button[type=submit]", f);
    btn.disabled = true;
    btn.textContent = "Checking…";
    const ok = await load(true);
    btn.disabled = false;
    btn.textContent = "Show insights";
    if (ok) {
      if (f.remember.checked) ls.set("snc-insights-pass", pass);
      if (ls.get("snc-nt") == null) ls.set("snc-nt", "1"); // don't count the owner by default
      $("#excludeMe").checked = ls.get("snc-nt") === "1";
    }
  });
  $$(".range button").forEach((b) =>
    b.addEventListener("click", () => {
      range = Number(b.dataset.range);
      ls.set("snc-insights-range", String(range));
      shown = PAGE;
      load(false);
    })
  );
  $("#more").addEventListener("click", () => { shown += PAGE; feed(); });
  $("#exportCsv").addEventListener("click", csv);
  $("#excludeMe").checked = ls.get("snc-nt") === "1";
  $("#excludeMe").addEventListener("change", (e) => ls.set("snc-nt", e.target.checked ? "1" : "0"));
  $("#signOut").addEventListener("click", () => { ls.del("snc-insights-pass"); location.href = location.pathname; });
  addEventListener("resize", () => { if (!$("#dash").hidden) chart(); });
  setInterval(tick, 5000);
  setInterval(() => { if (!$("#dash").hidden && document.visibilityState === "visible" && !DEMO) load(false); }, 30000);

  if (DEMO) load(true);
  else if (!BASE || !C.supabaseKey) show("setup");
  else if (pass) load(true);
  else show("login");
})();
