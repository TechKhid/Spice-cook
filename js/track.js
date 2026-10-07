/* ==========================================================================
   SPICE N COOK — visit insights
   Records anonymous visits: approximate city, device, where the visitor came
   from, how long they stayed and what they did (viewed boxes, started
   checkout…). No IP addresses, names or phone numbers are stored.

   Two outputs, each switched on in js/menu.js → insights:
   - ntfyTopic:   instant phone alerts through ntfy.sh (no account needed)
   - supabaseUrl/supabaseKey: full history for the /insights/ dashboard
   Open the site once with ?me on your own phone to stop counting yourself
   (?me=off undoes it).
   ========================================================================== */

(function () {
  "use strict";

  const C = (window.SNC && window.SNC.insights) || {};
  const hasDb = !!(C.supabaseUrl && C.supabaseKey);
  const topic = C.ntfyTopic || "";
  if (!hasDb && !topic) return;
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) || location.protocol === "file:") return;
  if (navigator.webdriver) return; // automated browsers and bots
  const q0 = new URLSearchParams(location.search);
  if (q0.has("me")) { try { localStorage.setItem("snc-nt", q0.get("me") === "off" ? "0" : "1"); } catch (e) {} }
  let optedOut = false;
  try { optedOut = localStorage.getItem("snc-nt") === "1"; } catch (e) {}
  if (optedOut) return; // your own device

  const endpoint = hasDb ? `${C.supabaseUrl.replace(/\/+$/, "")}/rest/v1/snc_events` : "";
  const id = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/-/g, "").slice(0, 20);
  const keep = (storage, k) => { try { let v = storage.getItem(k); if (!v) { v = id(); storage.setItem(k, v); } return v; } catch (e) { return id(); } };
  const vid = keep(localStorage, "snc-vid");
  const sid = keep(sessionStorage, "snc-sid");
  const cut = (s, n) => (s == null ? null : String(s).slice(0, n));

  function send(type, extra, keepalive) {
    extra = extra || {};
    if (hasDb) {
      fetch(endpoint, {
        method: "POST",
        keepalive: !!keepalive,
        headers: { apikey: C.supabaseKey, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(Object.assign({ vid, sid, type }, extra)),
      }).catch(() => {});
    }
    if (topic) alertFor(type, extra, keepalive);
  }

  /* ------------------------------------------- instant alerts (ntfy.sh) */
  const trip = { where: "", sections: [], adds: [], checkout: false, pay: false, wa: 0, bulk: false, told: false };
  const dur = (s) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);
  function notify(title, message, tags, priority, keepalive) {
    const qs = new URLSearchParams({ title, tags, priority: String(priority), click: location.origin + location.pathname });
    // A "simple" request (plain-text body, no custom headers) so no CORS preflight is needed
    fetch(`https://ntfy.sh/${encodeURIComponent(topic)}?${qs}`, { method: "POST", mode: "no-cors", keepalive: !!keepalive, body: message }).catch(() => {});
  }
  function alertFor(type, x, keepalive) {
    switch (type) {
      case "view": {
        trip.where = [x.city, x.country].filter(Boolean).join(", ") || (x.tz ? x.tz.replace(/_/g, " ") : "Unknown location");
        let first = true;
        try { first = sessionStorage.getItem("snc-told") !== "1"; sessionStorage.setItem("snc-told", "1"); } catch (e) {}
        if (!first) return; // a reload in the same visit
        const how = [x.device, x.os, x.app ? `opened in ${x.app}` : x.browser].filter(Boolean).join(" · ");
        const from = x.tag ? `Came from your link: ${x.tag}` : x.ref ? `Came from: ${x.ref}` : "Direct or shared link";
        const place = [x.city, x.region, x.country].filter(Boolean).join(", ") || trip.where;
        notify(`New visit · ${trip.where}`, `📍 ${place}\n📱 ${how}\n🔗 ${from}`, "eyes", 4);
        break;
      }
      case "section": if (x.detail && !trip.sections.includes(x.detail)) trip.sections.push(x.detail); break;
      case "add": trip.adds.push(x.detail); break;
      case "checkout": trip.checkout = true; break;
      case "pay": trip.pay = true; break;
      case "whatsapp": trip.wa++; break;
      case "bulk": trip.bulk = true; break;
      case "paid": notify(`Payment · ${trip.where}`, `💳 ${x.detail || "Order paid"}`, "moneybag", 4); break;
      case "leave": {
        if (trip.told) return;
        // Skip reloads and quick tab switches where nothing happened yet
        if (x.secs < 10 && !trip.sections.length && !trip.adds.length && !trip.checkout && !trip.wa) return;
        trip.told = true;
        const lines = [];
        lines.push(trip.sections.length ? `Saw: ${trip.sections.join(", ")}` : "Only looked at the top of the page");
        if (trip.adds.length) lines.push(`Added: ${trip.adds.join("; ")}`);
        if (trip.checkout) lines.push(trip.pay ? "Started checkout and reached payment" : "Started checkout");
        if (trip.wa) lines.push("Tapped WhatsApp");
        if (trip.bulk) lines.push("Asked for a bulk quote");
        notify(`Stayed ${dur(x.secs)} · ${trip.where || "visitor"}`, lines.join("\n"), "hourglass_flowing_sand", 2, keepalive);
        break;
      }
    }
  }

  /* ------------------------------------------------ who / where / how */
  function device() {
    const ua = navigator.userAgent;
    const os = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
    const kind = /iPad|Tablet/.test(ua) ? "Tablet" : /Mobi|iPhone|Android/.test(ua) ? "Phone" : "Computer";
    const app = /Instagram/.test(ua) ? "Instagram" : /FBAN|FBAV|FB_IAB/.test(ua) ? "Facebook" : /musical_ly|BytedanceWebview|TikTok/i.test(ua) ? "TikTok" : /Snapchat/.test(ua) ? "Snapchat" : /LinkedInApp/.test(ua) ? "LinkedIn" : /WhatsApp/.test(ua) ? "WhatsApp" : null;
    const browser = /EdgA?\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Brave/.test(ua) || navigator.brave ? "Brave" : /CriOS|Chrome\//.test(ua) ? "Chrome" : /FxiOS|Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
    return { device: kind, os, browser, app };
  }

  function source() {
    let ref = null;
    try { if (document.referrer) { const h = new URL(document.referrer).hostname.replace(/^www\./, ""); if (h !== location.hostname) ref = h; } } catch (e) {}
    const q = new URLSearchParams(location.search);
    return { ref, tag: cut(q.get("r") || q.get("ref") || q.get("utm_source"), 60) };
  }

  // Approximate location from the visitor's network (city level). Falls back to
  // the browser's time zone, which still says e.g. "Africa/Accra".
  function geo() {
    try { const g = sessionStorage.getItem("snc-geo"); if (g) return Promise.resolve(JSON.parse(g)); } catch (e) {}
    const ctl = window.AbortController ? new AbortController() : null;
    const t = setTimeout(() => ctl && ctl.abort(), 3000);
    return fetch("https://get.geojs.io/v1/ip/geo.json", { signal: ctl && ctl.signal })
      .then((r) => r.json())
      .then((j) => {
        const g = {
          city: cut(j.city, 80), region: cut(j.region, 80), country: cut(j.country, 80), cc: cut(j.country_code, 2),
          lat: j.latitude ? Math.round(parseFloat(j.latitude) * 10) / 10 : null,
          lon: j.longitude ? Math.round(parseFloat(j.longitude) * 10) / 10 : null,
        };
        try { sessionStorage.setItem("snc-geo", JSON.stringify(g)); } catch (e) {}
        return g;
      })
      .catch(() => ({}))
      .finally(() => clearTimeout(t));
  }

  /* ---------------------------------------------------------- the visit */
  geo().then((g) => {
    send("view", Object.assign(
      {
        path: cut(location.pathname, 200),
        tz: cut(Intl.DateTimeFormat().resolvedOptions().timeZone, 60),
        lang: cut(navigator.language, 20),
        screen: `${screen.width}x${screen.height}`,
      },
      source(),
      device(),
      g
    ));
  });

  // Which parts of the page they actually reached
  const seen = new Set();
  const names = { lunch: "Weekly lunch", boxes: "Melanin Box", gifting: "Gifting", bulk: "Bulk orders", kitchen: "From the kitchen" };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting || seen.has(e.target.id)) return;
        seen.add(e.target.id);
        io.unobserve(e.target);
        send("section", { detail: names[e.target.id] || e.target.id });
      }), { threshold: 0.35 });
    Object.keys(names).forEach((k) => { const el = document.getElementById(k); if (el) io.observe(el); });
  }

  // What they did, using the events the site already emits (js/app.js)
  const once = new Set();
  const first = (k, fn) => { if (!once.has(k)) { once.add(k); fn(); } };
  document.addEventListener("snc:add", (e) => {
    const d = e.detail || {};
    send("add", { detail: cut(`${d.qty || 1} × ${d.name || "item"}${d.option ? ` (${d.option})` : ""}`, 200) });
  });
  document.addEventListener("snc:step", (e) => {
    const s = e.detail && e.detail.step;
    if (s === "details") first("checkout", () => send("checkout", {}));
    if (s === "pay") first("pay", () => send("pay", {}));
  });
  document.addEventListener("snc:paid", (e) => {
    const o = e.detail && e.detail.order;
    send("paid", { detail: o ? cut(`GHS ${o.total}${o.demo ? " (demo)" : ""} · ${o.items.length} item${o.items.length === 1 ? "" : "s"}`, 200) : null });
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href*="wa.me"], #waInstead');
    if (a) send("whatsapp", { detail: cut(a.id || (a.closest("section") || {}).id || "link", 200) });
  }, true);
  document.addEventListener("submit", (e) => { if (e.target.id === "bulkForm") send("bulk", {}); }, true);

  // How long they actually looked (time the tab was visible)
  let active = 0, lastSent = -1, since = document.visibilityState === "visible" ? Date.now() : 0;
  function flush() {
    if (since) { active += Date.now() - since; since = 0; }
    const secs = Math.min(86400, Math.round(active / 1000));
    if (secs >= 2 && secs !== lastSent) { lastSent = secs; send("leave", { secs }, true); }
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
    else since = Date.now();
  });
  addEventListener("pagehide", flush);
})();
