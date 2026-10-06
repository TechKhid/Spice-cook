# Spice N Cook: website demo

A fast, mobile-first website for **Spice N Cook Food Brand** (East Legon Hills, Accra).
Customers can browse the weekly specials and Melanin Boxes, build an order, and send it to
WhatsApp in one tap with everything already written out.

It's plain HTML, CSS and JavaScript: no framework, no build step, no backend, no monthly cost.

## What's in it

Built from her own material: the real logo, real photos of her boxes and events, and the colours of her flyers (kraft, green, that lime-yellow).

| Section | What it does |
|---|---|
| **Hero** | "Pepper rice Wednesdays. Garifotor Thursdays. Jollof Fridays." The next special is highlighted automatically, and the line underneath says what's on today, tomorrow or next. On Sundays it says they're closed and invites orders ahead. |
| **This week's lunch** | A printed-menu layout with dotted price lines. Tap any price (chicken / goat / pork) to add that pack for its next serving date. |
| **Melanin Box** | Melanin Box and Mini on tabs, the full contents, a delivery date, quantity and the thank-you card message. Shows "24–48 hrs notice · full payment confirms order". |
| **Gifting** | Her ribbon-tied boxes, plus a button that jumps straight to writing the card message. |
| **Bulk orders** | Her party-spread photo beside a quote form: date, headcount and dishes go to WhatsApp. |
| **One-tap WhatsApp order** | The order drawer covers delivery or pickup, name, address and notes. It sends a formatted message with an order reference, dates, line totals and "payment validates order". |
| **From the kitchen** | A photo grid linking to TikTok and Instagram. |
| **Hiring** | The Kitchen Assistant post with requirements and an "Apply on WhatsApp" link. Set `hiring.open: false` to hide it. |
| **SEO & sharing** | Restaurant schema (hours, menu, prices), a link-preview image, favicon from her logo. |

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

Photos live in **`assets/img/`**. To swap one, replace the file under the same name (keep it under ~300 KB).
The Wednesday pepper-rice image is cropped from her specials flyer and is the lowest resolution on the site,
so a real photo of that dish is the first one to ask her for.

## Go-live checklist

- [ ] Ask her for a real photo of the Wednesday pepper rice (and her original logo file, for a sharper logo)
- [ ] Set `showPreviewBar: false` in `js/menu.js` (removes the "Hi Spice N Cook 👋" demo bar)
- [ ] Confirm with her: delivery vs pickup, and delivery areas/fees
- [ ] After deploying, change `og:image` in `index.html` to the full URL (e.g. `https://yourdomain/assets/og-image.jpg`) so WhatsApp link previews show the image

## Files

```
index.html            page structure + SEO/schema
css/styles.css        design system & layout
js/menu.js            ALL editable content
js/app.js             menu, boxes, cart, WhatsApp, forms
assets/img/           her photos and logo, web-optimised
assets/               favicon, share image
```
