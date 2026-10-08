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
| **Checkout & payment** | Order, then details, then payment, then receipt, all on the site. Customers pay with Mobile Money (MTN MoMo, Telecel Cash, AT Money) or card, get a printable receipt, and can send it to the kitchen on WhatsApp in one tap. Runs in **demo mode** by default (see below). Customers can still choose "send on WhatsApp and pay later". |
| **From the kitchen** | A photo grid linking to TikTok and Instagram. |
| **Hiring** | The Kitchen Assistant post with requirements and an "Apply on WhatsApp" link. Set `hiring.open: false` to hide it. |
| **Motion** | GSAP (bundled in `js/vendor`): a logo intro on the first visit, the headline rising in word by word, image wipes and parallax, a dish photo that flies into the order when you tap a price, a rolling order count, a price that rolls between box sizes, a phone-approval animation and confetti when payment succeeds. Switches off completely for visitors who turn on "reduce motion". |
| **SEO & sharing** | Restaurant schema (hours, menu, prices), a link-preview image, favicon from her logo. |

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

**Demo tip:** add `?day=wed`, `?day=thu`, `?day=fri` or `?day=sun` to the URL to show how the site changes
through the week, e.g. `http://localhost:8000/?day=thu`.

## Live site (GitHub Pages)

**https://techkhid.github.io/Spice-cook/**

Every push to this branch redeploys automatically through `.github/workflows/pages.yml`, which takes about a minute. Progress shows under the repo's **Actions** tab.

One-time setup: in the repo go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

A custom domain (e.g. `spicencook.com`) can be added under Settings → Pages → Custom domain.

Note: GitHub Pages only hosts static files. The site, checkout and demo payments all work there. For **live** Paystack payments with server-side verification, `netlify/functions/verify-payment.js` needs a host that runs functions (Netlify or Vercel, both free), or you can verify in her Paystack dashboard.

## Payments: demo mode and going live

Payment settings are in `js/menu.js` under `payments`.

**Demo mode** (`mode: "demo"`, the default) runs the whole checkout. The Mobile Money approval is simulated and no money moves. The receipt is clearly stamped "Demo payment". Use this for showing her the site.

**Going live with Paystack** (the most common way Ghanaian businesses take Mobile Money and cards online):

1. She creates a Paystack account at paystack.com (Ghana) and completes business verification.
2. Copy the **public** key from Settings → API Keys into `paystackPublicKey`, and set `mode: "paystack"`. Start with the `pk_test_…` key and Paystack's test numbers, then switch to `pk_live_…`.
3. Payment then happens in Paystack's secure popup. Card and MoMo details never touch this site. Customers enter an email for their receipt.
4. **Verify payments on the server** before treating an order as paid. A browser callback alone can be faked. On Netlify, `netlify/functions/verify-payment.js` is ready to use: set the `PAYSTACK_SECRET_KEY` environment variable and set `verifyUrl: "/.netlify/functions/verify-payment"`. Never put the secret key in `menu.js`.
5. She sees every payment, with the items, phone number and delivery address attached, in her Paystack dashboard and in email alerts. The customer's "Send receipt to Spice N Cook" WhatsApp button gives her a second heads-up.

To charge delivery online, set `deliveryFee` to a number in GHS. Leave it as `null` to arrange delivery after the order.

## Visitor insights (who's looking, from where)

A private dashboard at **https://techkhid.github.io/Spice-cook/insights/** shows each visit:

- Approximate location (city, region, country) on a map and in a list.
- Device, and whether the link was opened inside Instagram or TikTok.
- Where the visitor came from, and how long they stayed.
- What they did: which sections they reached, what they added, whether they started checkout or paid, and WhatsApp taps.

It refreshes every 30 seconds and can export a CSV. Add `?demo=1` to the address to preview it with sample data.

**Privacy.** No IP addresses, names or phone numbers are stored. Location is a network-based, city-level estimate with coordinates rounded to about 10 km. Visitors can only *add* visit records; reading them needs your passphrase, which is checked inside the database. The site footer says visits are counted anonymously. Bots and automated browsers are skipped.

**Instant visit alerts (already on, no account).** Every visit sends a phone alert through [ntfy](https://ntfy.sh), a free open-source notification service. Each visit sends: *New visit* (city, device, in-app browser, link tag), a *Payment* alert if they pay, and *Stayed Xm* when they leave, with what they looked at and added.
- To receive them, open `https://ntfy.sh/<ntfyTopic from js/menu.js>` on your phone, tap **Subscribe**, and allow notifications. Or add the topic in the free ntfy app (Android/iOS). The `/insights/` page links straight to it.
- Open the site once with `?me` on your own phone (`…/Spice-cook/?me`) so your own visits don't alert you. `?me=off` undoes it.
- ntfy keeps messages on its server for about 12 hours. After that, your phone's ntfy app or browser keeps the history, so subscribe before you share the link.
- Anyone who reads `js/menu.js` in this public repo could find the topic name and see the same alerts (approximate city and device only). That's fine for a demo. For a real business, switch to the Supabase dashboard below and set `ntfyTopic: ""`.

**Full history dashboard: setup (about 10 minutes, free):**

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste [`supabase/insights.sql`](supabase/insights.sql), change the passphrase on the last lines to your own (12+ characters), and press **Run**. If you leave the placeholder in, the script stops with an error.
3. Go to **Project Settings → API**. Copy the **Project URL** and the **anon / publishable** key into `insights` in `js/menu.js`. Never use the `service_role` or secret key. Commit and push; Pages redeploys in about a minute.
4. Open `/insights/` and sign in with your passphrase. That browser then stops counting your own visits; there's a toggle at the bottom of the dashboard.

**Know when a specific person opens it.** Add a tag to the link you share, e.g. `https://techkhid.github.io/Spice-cook/?r=ig-dm`. Visits from that link show **"Your link: ig-dm"**. Use a different tag for each place you post it: `?r=tiktok-bio`, `?r=whatsapp-status`, and so on.

## Editing content

Everything lives in **`js/menu.js`**: prices, dishes, box contents, phone number, socials,
bulk items and the hiring post. Change it, save, and redeploy.

Photos live in **`assets/img/`**. To swap one, replace the file under the same name (keep it under ~300 KB).
The Wednesday pepper-rice image is cropped from her specials flyer and is the lowest resolution on the site,
so a real photo of that dish is the first one to ask her for.

## Go-live checklist

- [ ] Ask her for a real photo of the Wednesday pepper rice (and her original logo file, for a sharper logo)
- [ ] Set `showPreviewBar: false` in `js/menu.js` (removes the "Hi Spice N Cook 👋" demo bar)
- [ ] Confirm with her: delivery vs pickup, and delivery areas/fees (set `deliveryFee` if she wants it paid online)
- [ ] Set up Paystack and switch `payments.mode` to `"paystack"` (see above)
- [ ] If you move to a custom domain, update `og:url` and `og:image` in `index.html` to the new address

## Files

```
index.html            page structure + SEO/schema
css/styles.css        design system & layout
js/menu.js            ALL editable content
js/app.js             menu, boxes, cart, checkout & payment, WhatsApp, forms
js/anim.js            all animation (GSAP)
js/vendor/            GSAP, ScrollTrigger, SplitText (standard no-charge licence)
netlify/functions/    server-side Paystack payment verification
js/track.js           anonymous visit tracking (feeds /insights/)
insights/             private visitor dashboard (+ bundled Leaflet map)
quote/                the client quote page (not linked from the site, not indexed)
supabase/insights.sql database table, permissions and passphrase for insights
assets/img/           her photos and logo, web-optimised
assets/               favicon, share image
```
