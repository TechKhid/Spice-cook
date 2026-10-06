# Spice N Cook: website demo

A fast, mobile-first website for **Spice N Cook Food Brand** (East Legon Hills, Accra).
Customers can browse the weekly specials and Melanin Boxes, build an order, and send it to
WhatsApp in one tap with everything already written out.

It's plain HTML, CSS and JavaScript: no framework, no build step, no backend, no monthly cost.

## What's in it

| Feature | What it does |
|---|---|
| **Day-aware hero** | The floating card shows *today's* special on Wed/Thu/Fri, *tomorrow's* on Tuesday, or the next one otherwise. On Sundays the status pill switches to "orders open again Monday". |
| **Weekly specials** | A strip of the next 6 open days with Wed/Thu/Fri highlighted. Pick a day, choose a protein (chicken / goat / pork, each with its own price), set a quantity, and add it to the order. Each item is tied to its next serving date. |
| **Melanin Box family** | Both boxes with full contents and prices. A "highlight what's different" switch compares them, there's a date picker for pre-orders, and customers can write their **thank-you card message** on the site. |
| **One-tap WhatsApp order** | The cart drawer has delivery/pickup, name, location and notes. It sends a neatly formatted message with an order reference, dates, line totals and the "payment validates order" line. |
| **Bulk quote form** | Date, headcount and dish chips go out as a ready-to-send quote request on WhatsApp. |
| **Hiring banner** | Kitchen Assistant role, with requirements and a "Send your CV" WhatsApp link. Set `hiring.open: false` to hide it. |
| **Social proof** | TikTok/Instagram section with animated stats and phone mock-ups. |
| **SEO & sharing** | Restaurant schema (hours, menu, prices, phone), Open Graph image for WhatsApp/Instagram link previews, web manifest. |
| **Polish** | Fly-to-cart animation, sticky mobile order bar, cart saved across visits, keyboard and screen-reader friendly, respects reduced-motion. |

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

**Demo tip:** add `?day=wed`, `?day=thu`, `?day=fri` or `?day=sun` to the URL to show how the site changes
through the week, e.g. `http://localhost:8000/?day=thu`.

## Put it online (free, about 2 minutes)

- **Netlify Drop**: go to <https://app.netlify.com/drop> and drag this whole folder in. You get a live link instantly.
- **GitHub Pages**: in this repo, go to Settings → Pages → Deploy from branch → pick the branch and `/ (root)`.
- **Vercel**: run `npx vercel` in this folder, or import the repo at vercel.com.

A custom domain like `spicencook.com.gh` or `spicencook.com` can be attached on any of these.

## Editing content

Everything lives in **`js/menu.js`**: prices, dishes, box contents, phone number, socials,
bulk items and the hiring post. Change it, save, and redeploy.

Real photos go in **`assets/photos/`**. See [`assets/photos/README.md`](assets/photos/README.md)
for the filenames. Until a photo exists, each slot shows a matching hand-drawn illustration, so
the site never looks broken.

## Go-live checklist

- [ ] Add her real photos to `assets/photos/` (from her TikTok/Instagram, or fresh shots)
- [ ] Replace `assets/logo-mark.svg` with her original logo file, if she has one
- [ ] Set `showPreviewBar: false` in `js/menu.js` (removes the "Hi Spice N Cook 👋" demo bar)
- [ ] Confirm with her: delivery vs pickup, delivery areas/fees, box notice period, Instagram handle
- [ ] After deploying, change `og:image` in `index.html` to the full URL (e.g. `https://yourdomain/assets/og-image.jpg`) so WhatsApp link previews show the image
- [ ] Update the TikTok numbers in `index.html` from time to time

## Files

```
index.html            page structure + SEO/schema
css/styles.css        design system & layout
js/menu.js            ALL editable content
js/art.js             illustrated food art (fallback until photos are added)
js/app.js             specials, cart, WhatsApp, forms, animations
assets/               logo, favicon, share image, photos/
```
