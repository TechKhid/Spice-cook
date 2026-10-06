/* ==========================================================================
   SPICE N COOK — site content
   Everything the owner may want to change (prices, dishes, box contents,
   phone number, socials) lives in this one file. Edit, save, redeploy.
   ========================================================================== */

window.SNC = {
  business: {
    name: "Spice N Cook",
    tagline: "Food Brand",
    // International format, digits only, used for wa.me and tel: links
    whatsapp: "233532717436",
    phoneDisplay: "053 271 7436",
    location: "East Legon Hills, Accra",
    hours: "Monday – Saturday",
    tiktok: "https://www.tiktok.com/@spice_n_cook",
    tiktokHandle: "@spice_n_cook",
    instagram: "https://www.instagram.com/spicecook",
    instagramHandle: "@spicecook",
    currency: "GHS",
  },

  // Set to false before going live to hide the "preview" welcome bar
  showPreviewBar: true,

  /* Weekly specials. day: 0=Sun … 6=Sat
     photo: drop a real photo at this path and it replaces the illustration */
  specials: [
    {
      id: "pepper-rice",
      day: 3,
      dayName: "Wednesday",
      short: "Wed",
      name: "Coconut Milk Pepper Rice",
      blurb:
        "Fragrant rice cooked down in coconut milk and pepper, with sweet fried plantains and gizzard chunks.",
      sides: ["Fried plantains", "Gizzard chunks", "Juice"],
      photo: "assets/photos/coconut-milk-pepper-rice.jpg",
      art: "pepperRice",
      options: [
        { id: "chicken", label: "Peppered Chicken", price: 110 },
        { id: "goat", label: "Peppered Goat", price: 125 },
        { id: "pork", label: "Peppered Pork Chops", price: 125 },
      ],
    },
    {
      id: "garifotor",
      day: 4,
      dayName: "Thursday",
      short: "Thu",
      name: "Garifotor",
      blurb:
        "Gari soaked through with a rich tomato-pepper stew, finished with egg & pepper and fried plantains. Garifotor goodness!",
      sides: ["Fried plantains", "Egg & pepper", "Juice"],
      photo: "assets/photos/garifotor.jpg",
      art: "garifotor",
      options: [
        { id: "chicken", label: "Peppered Chicken", price: 95 },
        { id: "goat", label: "Peppered Goat", price: 110 },
        { id: "pork", label: "Peppered Pork Chops", price: 110 },
      ],
    },
    {
      id: "jollof",
      day: 5,
      dayName: "Friday",
      short: "Fri",
      name: "Jollof",
      blurb:
        "Smoky, party-style Ghana jollof with fried plantains and veggies. The Friday treat you plan your week around.",
      sides: ["Fried plantains", "Veggies", "Juice"],
      photo: "assets/photos/jollof.jpg",
      art: "jollof",
      options: [
        { id: "chicken", label: "Peppered Chicken", price: 105 },
        { id: "goat", label: "Peppered Goat", price: 120 },
        { id: "pork", label: "Peppered Pork Chops", price: 120 },
      ],
    },
  ],

  boxes: [
    {
      id: "melanin-box",
      name: "Melanin Box",
      kicker: "The signature",
      price: 750,
      photo: "assets/photos/melanin-box.jpg",
      art: "boxBig",
      contents: [
        "Signature Jollof",
        "Gari Fotor",
        "Pasta in Tomato Sauce",
        "Fried Plantains",
        "Peppered Goat Meat, Turkey & Chicken",
        "Fruits",
        "Small Chops: Beef Turnover & Yam Balls",
        "Eggs & Pepper",
        "Green Pepper Sauce",
        "Drinks: Snapple & Welch's",
        "Granola Bars",
        "Cake Tub",
        "Bottled Water",
        "Customised Thank-You Card",
      ],
      // Items that only the big box has (highlighted in compare mode)
      exclusive: [
        "Gari Fotor",
        "Peppered Goat Meat, Turkey & Chicken",
        "Small Chops: Beef Turnover & Yam Balls",
        "Drinks: Snapple & Welch's",
      ],
    },
    {
      id: "mini-melanin-box",
      name: "Mini Melanin Box",
      kicker: "All the love, smaller box",
      price: 470,
      photo: "assets/photos/mini-melanin-box.jpg",
      art: "boxMini",
      contents: [
        "Signature Jollof",
        "Pasta in Tomato Sauce",
        "Fried Plantains",
        "Peppered Goat Meat & Chicken",
        "Fruits",
        "Small Chops: Spring Roll, Samosa & Yam Balls",
        "Eggs & Pepper",
        "Green Pepper Sauce",
        "Drink: 500ml Juice",
        "Granola Bars",
        "Cake Tub",
        "Bottled Water",
        "Customised Thank-You Card",
      ],
      exclusive: [
        "Peppered Goat Meat & Chicken",
        "Small Chops: Spring Roll, Samosa & Yam Balls",
        "Drink: 500ml Juice",
      ],
    },
  ],

  bulk: [
    "Stews",
    "Soups",
    "Jollof",
    "Coconut Pepper Rice",
    "Pasta",
    "Peppered Chicken",
    "Peppered Goat",
    "Fried Plantains",
    "Small Chops",
    "Green Pepper Sauce",
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
