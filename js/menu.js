/* ==========================================================================
   SPICE N COOK — site content
   Everything the owner may want to change (prices, dishes, box contents,
   phone number, socials, photos) lives in this one file.
   ========================================================================== */

window.SNC = {
  business: {
    name: "Spice N Cook",
    // International format, digits only, used for wa.me and tel: links
    whatsapp: "233532717436",
    phoneDisplay: "053 271 7436",
    location: "East Legon Hills, Accra",
    hours: "Monday – Saturday",
    tiktok: "https://www.tiktok.com/@spice_n_cook",
    tiktokHandle: "@spice_n_cook",
    instagram: "https://www.instagram.com/spicencook",
    instagramHandle: "@spicencook",
    currency: "GHS",
  },

  // Set to false before going live to hide the "preview" welcome strip
  showPreviewBar: true,

  /* Online payment.
     mode "demo":     the full checkout works, Mobile Money approval is simulated,
                      no money moves. Use this for showing the site.
     mode "paystack": real payments through Paystack's secure popup
                      (Mobile Money + cards). Needs paystackPublicKey. */
  payments: {
    mode: "demo",
    paystackPublicKey: "", // "pk_test_…" while testing, "pk_live_…" when live
    verifyUrl: "", // optional: serverless endpoint that verifies a payment by reference
    deliveryFee: null, // a number in GHS to charge delivery online; null = arranged after the order
  },

  /* Visitor insights (dashboard at /insights/). Paste your Supabase project URL
     and its publishable/anon key here. Both are safe to be public: the key can
     only ADD visit records, never read them. See README → Visitor insights. */
  insights: {
    // Instant phone alerts for every visit, no account needed. Open
    // https://ntfy.sh/snc-visits-e627de5cf665a8f16581 on your phone and tap Subscribe
    // (or add this topic in the free ntfy app). Set to "" to switch off.
    ntfyTopic: "snc-visits-e627de5cf665a8f16581",
    supabaseUrl: "", // e.g. "https://abcdxyz.supabase.co"
    supabaseKey: "", // the "anon" / "publishable" key, never the service_role/secret key
  },

  /* Weekly specials. day: 0=Sun … 6=Sat. Every pack includes a juice. */
  specials: [
    {
      id: "pepper-rice",
      day: 3,
      dayName: "Wednesday",
      name: "Coconut Milk Pepper Rice",
      short: "Pepper rice",
      sides: "Fried plantains, gizzard chunks & juice",
      photo: "assets/img/pepper-rice.jpg",
      options: [
        { id: "chicken", label: "Peppered chicken", price: 110 },
        { id: "goat", label: "Peppered goat", price: 125 },
        { id: "pork", label: "Peppered pork chops", price: 125 },
      ],
    },
    {
      id: "garifotor",
      day: 4,
      dayName: "Thursday",
      name: "Garifotor",
      short: "Garifotor",
      sides: "Fried plantains, egg & pepper, juice",
      photo: "assets/img/garifotor.jpg",
      options: [
        { id: "chicken", label: "Peppered chicken", price: 95 },
        { id: "goat", label: "Peppered goat", price: 110 },
        { id: "pork", label: "Peppered pork chops", price: 110 },
      ],
    },
    {
      id: "jollof",
      day: 5,
      dayName: "Friday",
      name: "Jollof",
      short: "Jollof",
      sides: "Fried plantains, veggies & juice",
      photo: "assets/img/jollof.jpg",
      options: [
        { id: "chicken", label: "Peppered chicken", price: 105 },
        { id: "goat", label: "Peppered goat", price: 120 },
        { id: "pork", label: "Peppered pork chops", price: 120 },
      ],
    },
  ],

  boxes: [
    {
      id: "melanin-box",
      name: "Melanin Box",
      tab: "Melanin Box",
      price: 750,
      photo: "assets/img/melanin-box.jpg",
      contents: [
        "Signature jollof",
        "Gari fotor",
        "Pasta in tomato sauce",
        "Fried plantains",
        "Peppered goat, turkey & chicken",
        "Fruits",
        "Beef turnover & yam balls",
        "Eggs & pepper",
        "Green pepper sauce",
        "Snapple & Welch's",
        "Granola bars",
        "Cake tub",
        "Bottled water",
        "Customised thank-you card",
      ],
    },
    {
      id: "mini-melanin-box",
      name: "Mini Melanin Box",
      tab: "Mini",
      price: 470,
      photo: "assets/img/melanin-box.jpg",
      contents: [
        "Signature jollof",
        "Pasta in tomato sauce",
        "Fried plantains",
        "Peppered goat & chicken",
        "Fruits",
        "Spring roll, samosa & yam balls",
        "Eggs & pepper",
        "Green pepper sauce",
        "500ml juice",
        "Granola bars",
        "Cake tub",
        "Bottled water",
        "Customised thank-you card",
      ],
    },
  ],
  boxNotice: "Pre-orders only · 24–48 hrs notice · Full payment confirms order",

  bulk: [
    "Jollof",
    "Gari fotor",
    "Pasta",
    "Stews",
    "Soups",
    "Peppered chicken",
    "Peppered goat",
    "Fried plantains",
    "Beef turnovers",
    "Yam balls",
    "Green pepper sauce",
  ],

  // "From the kitchen" photo grid
  gallery: [
    { src: "assets/img/spread-tall.jpg", label: "A bulk order, laid out" },
    { src: "assets/img/jollof.jpg", label: "Jollof" },
    { src: "assets/img/pasta.jpg", label: "Pasta" },
    { src: "assets/img/small-chops.jpg", label: "Beef turnovers" },
    { src: "assets/img/peppered-chicken.jpg", label: "Peppered chicken" },
  ],

  hiring: {
    open: true,
    role: "Kitchen Assistant",
    requirements: [
      "BECE / WASSCE or equivalent",
      "Kitchen, catering or food production experience is a plus (training given)",
      "Clean, hygienic and punctual",
      "Able to stand for long hours and lift moderate loads",
      "Able to follow recipes and instructions accurately",
      "Available for early-morning / afternoon shifts, incl. some weekends",
      "Lives within East Legon Hills & environs (Lakeside, Nanakrom, School Junction…)",
    ],
  },
};
