/* ==========================================================================
   Illustrated food art: top-down plates and lunch boxes drawn as SVG.
   Used as the visual for every dish until a real photo is dropped into
   assets/photos/. Deterministic (seeded) so it renders the same every time.
   ========================================================================== */

(function () {
  function rng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  let uid = 0;

  // Grains scattered inside a circle
  function grains(r, cx, cy, rad, n, colors, size = 1) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * rad;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      const rot = Math.floor(r() * 180);
      s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(4.2 * size).toFixed(1)}" ry="${(1.9 * size).toFixed(1)}" fill="${pick(r, colors)}" transform="rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    return s;
  }

  function dots(r, cx, cy, rad, n, colors, min, max) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * rad;
      const sz = min + r() * (max - min);
      s += `<circle cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d).toFixed(1)}" r="${sz.toFixed(1)}" fill="${pick(r, colors)}"/>`;
    }
    return s;
  }

  function cubes(r, cx, cy, rad, n, colors, sz) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * rad;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      s += `<rect x="${(x - sz / 2).toFixed(1)}" y="${(y - sz / 2).toFixed(1)}" width="${sz}" height="${sz}" rx="1.6" fill="${pick(r, colors)}" transform="rotate(${Math.floor(r() * 90)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }
    return s;
  }

  function plantains(r, pts, scale = 1) {
    return pts
      .map(([x, y, rot]) => {
        const rx = 21 * scale, ry = 13 * scale;
        return `<g transform="translate(${x} ${y}) rotate(${rot})">
          <ellipse rx="${rx}" ry="${ry}" fill="#B9621C"/>
          <ellipse rx="${rx - 2.5}" ry="${ry - 2.5}" fill="#F0A33A"/>
          <ellipse rx="${rx - 8}" ry="${ry - 6}" fill="#F7C25B" opacity=".9"/>
          <ellipse cx="${-rx / 3}" cy="${-ry / 3}" rx="${rx / 4}" ry="${ry / 5}" fill="#fff" opacity=".35"/>
        </g>`;
      })
      .join("");
  }

  function chicken(x, y, rot, s = 1) {
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
      <path d="M-46 4c0-26 22-40 46-38 22 2 36 16 34 34-2 20-22 30-44 30-22 0-36-10-36-26z" fill="#6E2810"/>
      <path d="M-42 2c0-22 20-34 42-32 19 2 31 14 29 29-2 17-20 26-39 26-20 0-32-9-32-23z" fill="#A9431A"/>
      <path d="M-30-6c6-12 22-18 36-14" stroke="#D9772E" stroke-width="5" stroke-linecap="round" fill="none" opacity=".7"/>
      <path d="M28 10l26 14" stroke="#EADBC4" stroke-width="9" stroke-linecap="round"/>
      <circle cx="58" cy="26" r="7" fill="#F4EBDD"/><circle cx="52" cy="30" r="6" fill="#F4EBDD"/>
      ${[[-20, 6], [-6, -10], [8, 8], [-26, -8], [14, -4]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.6" fill="#3B7A2A"/>`).join("")}
      ${[[-12, 14], [2, 0], [-30, 2]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.4" fill="#D7392B"/>`).join("")}
    </g>`;
  }

  function meatChunks(r, cx, cy, n, color = "#7A2E12") {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = cx + (r() - 0.5) * 70;
      const y = cy + (r() - 0.5) * 50;
      const w = 22 + r() * 12, h = 18 + r() * 10;
      s += `<g transform="rotate(${Math.floor(r() * 60 - 30)} ${x} ${y})">
        <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="8" fill="#4A1A08"/>
        <rect x="${x - w / 2 + 2}" y="${y - h / 2 + 2}" width="${w - 4}" height="${h - 5}" rx="7" fill="${color}"/>
        <circle cx="${x - 3}" cy="${y - 2}" r="2.2" fill="#D7392B"/><circle cx="${x + 5}" cy="${y + 2}" r="2" fill="#3B7A2A"/>
      </g>`;
    }
    return s;
  }

  function egg(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <ellipse rx="30" ry="25" fill="#FFFDF6" stroke="#EADFC9" stroke-width="2"/>
      <circle r="13" fill="#F2A900"/><circle r="13" fill="url(#yolk)"/>
      <circle cx="-5" cy="-5" r="3.5" fill="#fff" opacity=".6"/>
    </g>`;
  }

  function sauce(x, y, rad, fill, hl) {
    return `<g><circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}"/><circle cx="${x - rad / 3}" cy="${y - rad / 3}" r="${rad / 4}" fill="${hl}" opacity=".5"/></g>`;
  }

  const DEFS = (id) => `<defs>
    <radialGradient id="yolk"><stop offset="0" stop-color="#FFD25A"/><stop offset="1" stop-color="#E89400"/></radialGradient>
    <radialGradient id="plate-${id}" cx=".45" cy=".4"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".8" stop-color="#F7F1E4"/><stop offset="1" stop-color="#EBE1CC"/></radialGradient>
    <radialGradient id="shade-${id}" cx=".5" cy=".5"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
    <filter id="soft-${id}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#1c1b17" flood-opacity=".28"/></filter>
  </defs>`;

  function plate(kind) {
    const id = ++uid;
    const r = rng(kind.length * 977 + 13);
    let food = "";

    if (kind === "jollof") {
      food += `<circle cx="168" cy="212" r="112" fill="#C8461E"/>`;
      food += grains(r, 168, 212, 108, 900, ["#E0602F", "#C9441C", "#EB7D45", "#D4522A", "#F09157"]);
      food += cubes(r, 168, 212, 95, 22, ["#F08A22", "#3E8E2E", "#F2C84B"], 7);
      food += dots(r, 168, 212, 95, 18, ["#59A83A"], 2.5, 4);
      food += plantains(r, [[270, 130, 20], [298, 168, 60], [252, 98, -10], [306, 210, 80]]);
      food += chicken(250, 288, -25, 1.05);
    } else if (kind === "pepperRice") {
      food += `<circle cx="172" cy="200" r="114" fill="#E9CF96"/>`;
      food += grains(r, 172, 200, 110, 950, ["#F7E9C8", "#EED7A1", "#FFF6DF", "#E3C27C", "#F4DFAE"]);
      food += cubes(r, 172, 200, 100, 40, ["#D7392B", "#E85A2C", "#3E8E2E", "#F2C84B"], 6);
      food += dots(r, 172, 200, 100, 30, ["#C8322A", "#2F6E22"], 1.6, 3);
      food += plantains(r, [[284, 150, 30], [300, 192, 70], [270, 112, -5]]);
      food += meatChunks(r, 250, 290, 5, "#6B2A10");
    } else if (kind === "garifotor") {
      food += `<circle cx="170" cy="205" r="116" fill="#D06A2E"/>`;
      food += dots(r, 170, 205, 112, 1300, ["#E08043", "#C55E25", "#EE9A5B", "#D9733A", "#F2AC6E"], 1.4, 2.6);
      food += cubes(r, 170, 205, 100, 20, ["#3E8E2E", "#D7392B"], 6);
      food += egg(150, 180, 1.1);
      food += egg(205, 240, 0.9);
      food += plantains(r, [[286, 128, 25], [304, 170, 65], [292, 214, 95]]);
      food += chicken(245, 298, -15, 0.95);
    }
    // green pepper sauce
    food += sauce(96, 300, 22, "#3D7A26", "#9CCB5B");
    // spring onion confetti
    food += dots(r, 170, 205, 120, 26, ["#5DAE3C", "#7CC456"], 1.8, 3);

    return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${DEFS(id)}
      <g filter="url(#soft-${id})"><circle cx="200" cy="200" r="190" fill="url(#plate-${id})"/></g>
      <circle cx="200" cy="200" r="190" fill="none" stroke="#E4D7BD" stroke-width="2"/>
      <circle cx="200" cy="200" r="160" fill="none" stroke="#EADFCB" stroke-width="2.5"/>
      ${food}
      <circle cx="200" cy="200" r="190" fill="url(#shade-${id})"/>
    </svg>`;
  }

  function box(kind) {
    const id = ++uid;
    const r = rng(kind === "boxBig" ? 4242 : 777);
    const big = kind === "boxBig";
    // Kraft box with a grid of compartments (top-down)
    const cells = big
      ? [
          [20, 20, 150, 120, "jollof"], [180, 20, 110, 120, "pasta"], [300, 20, 160, 120, "fruit"],
          [20, 150, 110, 110, "plantain"], [140, 150, 150, 110, "meat"], [300, 150, 80, 110, "drink"], [390, 150, 70, 110, "drink2"],
          [20, 270, 150, 90, "chops"], [180, 270, 110, 90, "eggs"], [300, 270, 160, 90, "treats"],
        ]
      : [
          [20, 20, 170, 130, "jollof"], [200, 20, 140, 130, "fruit"], [350, 20, 110, 130, "drink"],
          [20, 160, 130, 110, "plantain"], [160, 160, 180, 110, "chops"], [350, 160, 110, 110, "eggs"],
          [20, 280, 210, 80, "pasta"], [240, 280, 220, 80, "treats"],
        ];

    function fill(x, y, w, h, t) {
      const cx = x + w / 2, cy = y + h / 2, rad = Math.min(w, h) / 2 - 6;
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#F8F1E3"/>`;
      const clip = `c${id}${x}${y}`;
      s += `<clipPath id="${clip}"><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" rx="8"/></clipPath><g clip-path="url(#${clip})">`;
      if (t === "jollof") {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#C8461E"/>` + grains(r, cx, cy, Math.max(w, h) / 1.6, 520, ["#E0602F", "#C9441C", "#EB7D45", "#F09157"]) + cubes(r, cx, cy, rad, 10, ["#F08A22", "#3E8E2E"], 6);
      } else if (t === "pasta") {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#D8542C"/>`;
        for (let i = 0; i < 26; i++) {
          const px = x + r() * w, py = y + r() * h;
          s += `<path d="M${px} ${py}q${12 + r() * 14} ${-10 - r() * 10} ${26 + r() * 20} 0t${24} 0" stroke="${pick(r, ["#F3B25E", "#E9963F", "#F7C77B"])}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
        }
      } else if (t === "fruit") {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FBEFD8"/>`;
        for (let i = 0; i < 14; i++) {
          const px = x + 14 + r() * (w - 28), py = y + 14 + r() * (h - 28), c = pick(r, ["#F2A900", "#E2453A", "#7DBA3C", "#F27B35", "#9B2D5B"]);
          s += `<rect x="${px - 10}" y="${py - 10}" width="20" height="20" rx="5" fill="${c}" transform="rotate(${Math.floor(r() * 90)} ${px} ${py})"/>`;
        }
      } else if (t === "plantain") {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F6E6C6"/>`;
        const pts = [];
        for (let i = 0; i < 6; i++) pts.push([x + 22 + (i % 2) * (w - 44), y + 18 + Math.floor(i / 2) * ((h - 36) / 2), Math.floor(r() * 180)]);
        s += plantains(r, pts, 0.85);
      } else if (t === "meat") {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#5A220C"/>` + chicken(cx - 20, cy, -15, 0.8) + meatChunks(r, cx + 40, cy, 3, "#7A2E12");
      } else if (t === "drink" || t === "drink2") {
        const c = t === "drink" ? "#9E1B32" : "#E8A33A";
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F3EADA"/>
          <circle cx="${cx}" cy="${cy}" r="${rad}" fill="${c}"/><circle cx="${cx}" cy="${cy}" r="${rad * 0.55}" fill="#fff" opacity=".85"/>
          <circle cx="${cx}" cy="${cy}" r="${rad * 0.3}" fill="${c}" opacity=".6"/>`;
      } else if (t === "chops") {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F6E6C6"/>`;
        for (let i = 0; i < 9; i++) {
          const px = x + 18 + r() * (w - 36), py = y + 16 + r() * (h - 32);
          s += i % 3 === 0
            ? `<path d="M${px - 16} ${py + 10}L${px} ${py - 14}L${px + 16} ${py + 10}Z" fill="#D7953F" stroke="#A9661F" stroke-width="2" stroke-linejoin="round"/>`
            : `<circle cx="${px}" cy="${py}" r="11" fill="#C98A3A"/><circle cx="${px - 3}" cy="${py - 3}" r="4" fill="#E6B26A"/>`;
        }
      } else if (t === "eggs") {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#C23A22"/>` + dots(r, cx, cy, rad + 20, 140, ["#D7542E", "#B02A18", "#E66B3B"], 1.5, 3) + egg(cx - 18, cy, 0.75) + egg(cx + 22, cy + 6, 0.65);
      } else if (t === "treats") {
        s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F3EADA"/>
          <rect x="${x + 14}" y="${y + 16}" width="${w * 0.42}" height="${h - 32}" rx="6" fill="#B58A4E"/>
          <rect x="${x + 14}" y="${y + 16}" width="${w * 0.42}" height="${(h - 32) / 3}" rx="6" fill="#8A5E2A"/>
          <circle cx="${x + w * 0.74}" cy="${cy}" r="${Math.min(h / 2 - 12, 30)}" fill="#5B2B1A"/>
          <circle cx="${x + w * 0.74}" cy="${cy}" r="${Math.min(h / 2 - 12, 30) * 0.7}" fill="#F6E1C6"/>
          <circle cx="${x + w * 0.74}" cy="${cy}" r="6" fill="#D7392B"/>`;
      }
      s += `</g>`;
      return s;
    }

    return `<svg viewBox="0 0 480 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <defs><filter id="bs-${id}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="16" stdDeviation="14" flood-color="#0b2318" flood-opacity=".45"/></filter></defs>
      <g filter="url(#bs-${id})"><rect x="4" y="4" width="472" height="372" rx="22" fill="#B98955"/></g>
      <rect x="10" y="10" width="460" height="360" rx="18" fill="#8E6438"/>
      ${cells.map((c) => fill(...c)).join("")}
      <g transform="translate(${big ? 392 : 404} ${big ? 300 : 300}) rotate(-8)">
        <rect x="-44" y="-30" width="88" height="60" rx="6" fill="#FFFDF7" stroke="#E8DCC5"/>
        <text x="0" y="-4" text-anchor="middle" font-family="Caveat, cursive" font-size="17" fill="#14532D">Thank</text>
        <text x="0" y="16" text-anchor="middle" font-family="Caveat, cursive" font-size="17" fill="#14532D">you!</text>
      </g>
    </svg>`;
  }

  window.SNCArt = function (kind) {
    if (kind === "boxBig" || kind === "boxMini") return box(kind);
    return plate(kind);
  };
})();
