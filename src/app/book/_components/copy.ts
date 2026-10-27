/**
 * All copy for /book, in page order.
 *
 * Source of truth: Marketing/Shopify/book-how-it-works-2026-10-27.md (paste-ready copy), laid out
 * in the structure of the approved design mock. Bracketed text such as "[YOUR PRICE]" is an owner
 * placeholder and stays visible until it is filled in.
 *
 * Rules the copy keeps: no data-source or method names, no competitor names, no score promises,
 * no course counts, and the app appears once, as the companion (WHY_THIS_BOOK.cards, last card).
 */
import { BOOK_FACTS } from "@/lib/book/catalog";

export const PAGE = {
  title: "The course book: play any course like a local",
  description:
    "A printed strategy book for one course, made for your tee and your game: where to hit it, what it really plays like, and where to miss. Top US golf destinations.",
  ogAlt: "The green page and the hole map of hole 13, TPC Scottsdale PGA Stadium, from the course book",
};

export const HERO = {
  eyebrow: `Strategy & green playbooks · Top US golf destinations · ${BOOK_FACTS.editionYear} edition`,
  headline: "Play any course like a local.",
  subhead:
    "A printed strategy book for one course, made for your tee and your game: where to hit it, what it really plays like, and where to miss. Read it the night before. Carry it the next day.",
  selectLabel: "Choose your course",
  launchNote: "Launch collection: the top US golf destinations. Not listed?",
  launchLink: "Tell us the course",
  launchNoteTail: "and we will let you know when it ships.",
  buy: "Get your course book",
  priceTail: `${BOOK_FACTS.pages} pages · back-pocket size`,
  sampleLink: "See a sample hole",
  groupsLink: "Tournaments and groups: ask us",
  packsHeading: "Packs",
  freeShipping: (from: string) => `Free shipping from ${from}.`,
  chipSpread: "One spread per hole",
  figcaption:
    "Hole 13, TPC Scottsdale PGA Stadium. The green on the top page, the hole below it. One spread per hole, eighteen spreads.",
  greenPageAlt:
    "Green page of hole 13: slope arrows, height bands, miss dots and the where-to-miss table",
  mapPageAlt:
    "Map page of hole 13: three planned shots, the 188-yard water carry chip, the orange plays-like numbers, the elevation strip and the from-tee ruler",
};

// Owner-approved 2026-10-27 ("version A"); replaces the earlier "A course you travelled for" line.
export const STAKES = {
  headline:
    "Serious about your scores? Then a course you've never seen shouldn't cost you three holes to learn.",
  body: "Another round lost to a hole you didn't know. The double that decided the flight.",
};

export const RESULTS = {
  eyebrow: "With the book in your pocket",
  items: [
    {
      title: "You stand on every tee already knowing where to hit it, and where not to.",
      body: "The target, the carry and the safe side are on the page before you pull a club.",
    },
    {
      title: "You pick the club in seconds: the orange number has done the maths.",
      body: "Laser the flag, add the orange number. Slope and altitude are already in it.",
    },
    {
      title: "Your misses finish on the side of the green you can get up and down from.",
      body: "Every green says where to miss and where never to. A miss becomes a chip, not a double.",
    },
  ],
};

export const WHY_A_BOOK = {
  empathy:
    "You have stood on a tee you had never seen, picked a line, and made the double that cost the day. So have we. That is why we built this book.",
  heading: "Why a book",
  points: [
    "A yardage book is a habit good golfers already have.",
    "A glance at a page in the back pocket: no screen, no battery, nothing to unlock, at home in any event.",
    "A printed book for one course is worth keeping after the round.",
  ],
  coverAlt: `The book's cover: Aim for your miss, not a miracle. TPC Scottsdale PGA Stadium, ${BOOK_FACTS.editionYear} edition, Blue/White tee`,
  photoPlaceholder: "[Product photo: the book in a back pocket]",
};

export const WHY_THIS_BOOK = {
  headline: "A yardage book tells you how far.",
  tieLine: "This book tells you where to hit it, what it really plays like, and where to miss.",
  plan: {
    eyebrow: "A plan for every shot",
    title: "Stand on the tee knowing the target, not just the yardage.",
    body: "Every hole is planned shot by shot: each shot starts at a chip with its yardage, printed where you will be standing, and ends at a numbered spot where the next one begins.",
    ovalTitle: "The landing oval and your start lines",
    ovalBody:
      "See how wide a good swing finishes and where to start it. Each landing spot sits in an oval sized for the book's level of play, green when the patch is clear and amber to red as trouble comes in. Two lines run from the ball to the oval's edges: start a fade down one, a draw down the other, and let it curve back in.",
    mapAlt:
      "Hole 13 map: three planned shots with their targets, each starting at a chip with its yardage and ending at a numbered spot",
    coneAlt:
      "The tee shot of hole 13: the landing oval at spot 2 with two start lines running from the tee to its edges, beside the 188-yard water carry",
    coneCaption: "Two lines to the oval's edges: a fade down one, a draw down the other.",
  },
  miss: {
    eyebrow: "Where to miss",
    title: "Every green has its own page that starts with the safe side.",
    body: "Dots around the green mark it: green for safe, amber for care, red for avoid. Under the map, each side gets a verdict (water, bunker, falls away, soft) with the facts behind it, and one line names the best miss. Tiered greens tell you to land on the pin's level.",
    greenAlt:
      "Green map of hole 13: slope arrows, height bands from light to dark, the high and low points, the safe miss and the care marks, with the legend",
    tableAlt:
      "The where-to-miss table of hole 13: short soft, long bunker, left bunker, right soft; best miss right, worst left",
  },
  orange: {
    eyebrow: "The orange number",
    title: "Laser the flag, add the orange number, pick the club.",
    body: "Every chip carries it: the slope and the course's altitude are already worked in, so there is no maths on the tee.",
    carryTitle: "Carry chips from where you hit",
    carryBody:
      "“Can I carry that?” is answered before you pull a club. Every carry over water is counted from the shot that has to clear it, not from the tee, so a second shot over a creek gets its own number.",
    chipsAlt:
      "Chips on hole 13: 250 minus 5, 200 minus 3 and 150 minus 3 along the fairway, 171 minus 4 to the lay-up, and the carry chip, 188 to clear the water",
  },
  cards: [
    {
      key: "ruler",
      title: "The from-tee ruler",
      body: "Every bunker, every water hazard and the green, on one strip down the side of the map: where each starts and ends, in yards from your tee. Carry and run-out at a glance.",
      alt: "The from-tee ruler of hole 13: hazard bands and the green with their yards from the tee",
    },
    {
      key: "greens",
      title: "Green maps you can read from the fairway",
      body: "Shading from light to dark shows low to high, in inches. Arrows point downhill and thicken as the slope steepens. Hatched orange marks 4% and more: on a fast green, don't be above the hole there. Two side views show tiers and false fronts.",
      alt: "Front-to-back and left-to-right side views of the hole 13 green with the fall in inches",
    },
    {
      key: "tee",
      title: "Made for your tee and your game",
      body: `Planned from a tee of about ${BOOK_FACTS.planningYards} yards once the course's altitude is counted, not from the tips, and with landing ovals for one level of play. The cover names the tee the book is made for.`,
      alt: "Tee markers for every tee on hole 13 with the yards to the tee-shot target from each",
    },
    {
      key: "terrain",
      title: "Ground you can't see from the tee",
      body: "The hole map is shaded so dips read dark and rises read bright, with height lines every two feet. The hollow short of the green shows up before you find it.",
      alt: "The hole 13 map with relief shading, beside the elevation strip in feet from tee to green",
    },
    {
      key: "wind",
      title: "Wind, worked out",
      body: "One table for low, mid and high ball flights, into and helping at 10 and 20 mph, as yards to add or take off. A second table gives how far to aim off in a crosswind. Judge the wind by feel; the book has done the rest.",
      alt: "The wind page: yards to add or take off by ball flight and wind strength, and how far to aim off in a crosswind",
    },
    {
      key: "edition",
      title: "This year's edition",
      body: "The edition year is on the cover. The same plan is on your phone too, tuned to your own clubs, through the QR code in the book.",
      alt: `The cover of the TPC Scottsdale PGA Stadium book naming the ${BOOK_FACTS.editionYear} edition`,
    },
  ],
};

export const DESIGN = {
  headline: "Designed to be read at a glance.",
  stats: [
    {
      stat: "8 pt",
      body: "Legible in sunlight. Nothing on any page is smaller than 8 pt. One glance per shot.",
    },
    {
      stat: "1 spread",
      body: "One spread per hole. The green on the top page, the hole map below it: the whole hole in one hand.",
    },
    {
      stat: BOOK_FACTS.size,
      body: `Back-pocket size, ${BOOK_FACTS.pages} pages. Built to last the trip. [Paper and cover spec]`,
    },
    {
      stat: "One look",
      body: "One clean look. A full-colour photo of every hole and one type family throughout.",
    },
  ],
};

export const PLAN = {
  eyebrow: "Know before you go",
  headline: "Three steps. The third one is the round.",
  steps: [
    {
      title: "Pick your course and your tee.",
      body: "The cover names the tee the book is made for. Choose the one you play.",
    },
    {
      title: "The night before, eighteen spreads in your hands.",
      body: "Ten minutes.",
    },
    {
      title: "On the course, book in the back pocket, phone in the bag.",
      body: "Glance, add the orange number, hit the target, miss on the safe side.",
    },
  ],
  closing: "Phone in the bag. Book in the pocket.",
};

export const SAMPLE = {
  headline: "See a sample hole.",
  body: "Get the how-to page and one full hole spread from a real book, free.",
  emailLabel: "Your email",
  updatesLabel: "Also tell me when new course books ship.",
  button: "Send me the sample hole",
  note: "One email with the PDF. No list, unless you ask for one.",
  sent: "Sent. The PDF is on its way to your inbox.",
  howtoAlt:
    "The how-to page of the book: the orange number, the numbered shots, the start lines, the ruler with carries, where to miss",
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  /** Owner placeholder inside the answer: kept out of the FAQ structured data. */
  placeholder?: boolean;
};

export const FAQ = {
  headline: "Questions",
  items: [
    {
      id: "request",
      question: "Which courses are available?",
      answer:
        "At launch, the top US golf destinations. [Owner: the launch list.] Not yours yet? Tell us the course and we will let you know when its book ships.",
      placeholder: true,
    },
    {
      id: "tee",
      question: "Which tee is the book planned from?",
      answer: `The tee that plays about ${BOOK_FACTS.planningYards} yards at sea level. The cover names it. Every other tee is still marked on the map with its yards to the target.`,
    },
    {
      id: "other-tee",
      question: "What if I play from a different tee?",
      answer:
        "The targets, the greens and the where-to-miss pages do not change. The yards from your tee to each target are printed at your tee marker.",
    },
    {
      id: "competition",
      question: "Can I use it in competition?",
      answer: `Everything is worked out before the round. Where a rangefinder may give distance only, the slope and altitude come from paper. Green maps print within the 1:480 scale limit on a ${BOOK_FACTS.size} page. This is our reading of Rule 4.3, not a ruling: check the event's Local Rules (Model Local Rules G-5 and G-11).`,
    },
    {
      id: "changes",
      question: "What if the course changes?",
      answer: "The edition year is on the cover. [Owner: exchange or update policy.]",
      placeholder: true,
    },
    {
      id: "shipping",
      question: "Shipping and returns",
      answer: "[Owner: ships from, days to arrive, return terms.]",
      placeholder: true,
    },
  ] satisfies FaqItem[],
};

export const REQUEST_FORM = {
  groupsNote:
    "Tournaments and groups: tell us the course and the group size and we will come back to you by email.",
  emailLabel: "Your email",
  courseLabel: "The course",
  coursePlaceholder: "Course name, city",
  groupSizeLabel: "Group size (optional)",
  groupSizePlaceholder: "Players",
  button: "Tell us the course",
  sent: "Thanks. We will email you about that course.",
};

export const FINAL = {
  headline: "Play any course like a local.",
  body: "Pick the course. Read it tonight. Carry it tomorrow.",
};

export const FOOTER = {
  disclaimer: "An independent playbook. Not affiliated with, sponsored or endorsed by the course.",
  links: [
    { label: "FAQ", href: "#faq" },
    { label: "Contact", href: "/support" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};
