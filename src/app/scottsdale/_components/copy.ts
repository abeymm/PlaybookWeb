/**
 * All player-facing copy for /scottsdale, in page order.
 *
 * Facts come from src/lib/book/scottsdale.ts. Rules the copy keeps: no data-source or method names,
 * no competitor names, no course counts, no score promises, no handicap level, no dashes as
 * punctuation, short plain words. Text in [square brackets] is an owner placeholder and stays
 * kept here until it is filled in; the page never shows it (see isPlaceholder).
 */
import { EVENT_FACTS } from "@/lib/book/scottsdale";

const { preorderPrice, tablePrice, storePrice, pickupDay } = EVENT_FACTS;

export const PAGE = {
  title: "TPC Scottsdale course book",
  description: `One pocket-size book for the Champions and Stadium courses. Pre-order for ${preorderPrice} plus tax and pick it up at registration.`,
};

export const HERO = {
  eyebrow: "US Am Tour · TPC Scottsdale · December 2026",
  headline: "Aim for your miss, not a miracle.",
  problem: {
    label: "The problem:",
    text: "You do not know these two courses. A good shot to the wrong side is in trouble.",
  },
  solution: {
    label: "The solution:",
    text: "Both courses in one book. Each hole shows where to aim and where to miss.",
  },
  cta: `Pre-order for ${preorderPrice}`,
  sampleLink: "See the sample",
};

export const SAMPLE = {
  headline: "Shot by shot",
  line: "Champions hole 1, from the book.",
  tee: {
    subhead: "Tee shot",
    pictures: [
      {
        src: "/scottsdale/sample-hole1-map.webp",
        width: 938,
        height: 1527,
        alt: "The hole map for Champions hole 1: the planned shots on a photo of the hole, with distances from the tee.",
      },
      {
        src: "/scottsdale/sample-hole1-teeview.webp",
        width: 1001,
        height: 608,
        alt: "The view from the tee on Champions hole 1: two aim posts, with sand and water marked in yards.",
      },
    ],
    lines: [
      { label: "Hole map:", text: "The plan for each shot. The shaded shape shows where shots stop." },
      { label: "From the tee:", text: "Aim between the posts." },
    ],
  },
  green: {
    subhead: "Approach and putts",
    picture: {
      src: "/scottsdale/sample-champions1-greenmap.webp",
      width: 1002,
      height: 1084,
      alt: "The green map for Champions hole 1: slope arrows, height bands and a yard scale. A green edge marks a safe side. An amber dashed edge and amber dots mark the sides to take care.",
    },
    uses: [
      { label: "Approach:", text: "Aim where your shot spread fits, as on the tee shot." },
      { label: "Green map:", text: "Use it for small changes only." },
      { label: "Miss:", text: "Green edge is safe. Amber edge or dot means take care." },
      { label: "Putt:", text: "Read the roll from the arrows. Bold arrows mean steep slope." },
    ],
  },
  wind: { label: "Wind chart:", text: "Yards to add or take off for 10 and 20 mph wind." },
  button: "Open the 5-page sample (PDF)",
  pdfHref: "/scottsdale/Playbook_TPC_Scottsdale_sample.pdf",
};

export const PRICING = {
  headline: "Price and pickup",
  rows: [
    { label: "Pre-order:", text: `${preorderPrice} plus tax.` },
    { label: "At the table:", text: `${tablePrice} plus tax.` },
    { label: "Pickup:", text: `registration, ${pickupDay}.` },
    { label: "Pay:", text: "at pickup, by card or cash. Not online." },
    { label: "Money back:", text: "on the spot, if you do not like the book." },
  ],
  // Quiet line under the rows: the store price, struck through. srNote keeps a screen reader from reading it as the price to pay.
  storeLine: { label: "Store price for the two-course book:", price: storePrice, struck: true, srNote: "Not your price." },
  // TODO(owner): fill in once the tour confirms registration hours and place.
  hoursPlaceholder: "[Registration hours and place: to confirm with the tour]",
};

export const PREORDER = {
  headline: "Pre-order your book",
  nameLabel: "Name",
  emailLabel: "Email",
  button: "Pre-order",
  emailUse: "We use your name and email only to hold your book and to contact you about it.",
  sent: `You are on the list. Your book will be at registration on ${pickupDay}.`,
};

export const APPS = {
  headline: "Same strategy in the Golf Playbook app.",
  body: [
    "Use it in your practice rounds.",
    "The app adjusts each distance for slope, temperature, wind and altitude.",
    "Preview the strategy with 3D flyovers.",
    "The app is free. A free sign-in is necessary.",
  ],
  steps: [
    "Install the free app.",
    "Sign in or make an account.",
    "Tap your course link again.",
  ],
  getApp: "Get the app",
  getAppHref: "/get",
  scanLine: "Scan a code, or open a link on your phone.",
  linkLabel: (course: string): string => `Open the ${course} Playbook`,
  qrAlt: (course: string): string => `QR code for the ${course} Playbook`,
  copyLink: "Copy link",
  copied: "Copied",
  copyFailed: "Copy the link by hand.",
};

export const FOOTER = {
  disclaimer: "Golf Playbook is independent. Not affiliated with, sponsored or endorsed by TPC Scottsdale.",
};
