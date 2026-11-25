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
  headline: "Two courses you have not played. A plan for every shot.",
  sub: "Know where to aim and where to miss before you reach the tee.",
  cta: `Pre-order for ${preorderPrice}`,
  sampleLink: "See hole 1",
};

export const SAMPLE = {
  headline: "Champions hole 1, from the book",
  tee: {
    subhead: "1. On the tee",
    pictures: [
      {
        src: "/scottsdale/sample-hole1-map.webp",
        width: 938,
        height: 1527,
        alt: "The hole map for Champions hole 1: the planned shots on a photo of the hole.",
      },
      {
        src: "/scottsdale/sample-hole1-teeview.webp",
        width: 1001,
        height: 608,
        alt: "The view from the tee on Champions hole 1: two aim posts.",
      },
    ],
    lines: [
      { label: "Aim:", text: "between the two posts." },
      { label: "Numbers:", text: "each shot ends at a numbered spot." },
    ],
  },
  green: {
    subhead: "2. Into the green",
    picture: {
      src: "/scottsdale/sample-champions1-greenmap.webp",
      width: 1002,
      height: 1084,
      alt: "The green map for Champions hole 1: slope arrows and the safe side.",
    },
    uses: [
      { label: "Green edge:", text: "safe side to miss." },
      { label: "Amber edge or dot:", text: "take care." },
      { label: "Arrows:", text: "the roll. Bold arrows are steep." },
      {
        label: "Tournaments:",
        text: "everything in the book is worked out before the round, so slope, altitude and the plan stay in it. In the app, Tournament Mode turns slope and altitude off.",
      },
    ],
    localRules: "Check the event's Local Rules.",
  },
  allHoles: "Every hole on both courses has these pages.",
  button: "Open the 5-page sample (PDF)",
  pdfHref: "/scottsdale/Playbook_TPC_Scottsdale_sample.pdf",
};

export const PRICING = {
  rows: [
    { label: "Pre-order:", text: `${preorderPrice} plus tax.` },
    { label: "At the table:", text: `${tablePrice} plus tax.` },
    { label: "Pick up:", text: `registration, ${pickupDay}.` },
    { label: "Pay:", text: "at pickup, by card or cash. Not online." },
    { label: "Money back:", text: "on the spot, if you do not like the book." },
  ],
  // Quiet line under the form: the store price, struck through. srNote keeps a screen reader from reading it as the price to pay.
  introLine: { before: "One-time introductory price. The two-course book is normally", price: storePrice, srNote: "Not your price." },
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
  headline: "Same plan in the free app",
  body: ["Use it in your practice rounds. A free sign-in is necessary."],
  getApp: "Get the app",
  getAppHref: "/get",
  linkLabel: (course: string): string => `Open the ${course} Playbook`,
  qrAlt: (course: string): string => `QR code for the ${course} Playbook`,
  copyLink: "Copy link",
  copied: "Copied",
  copyFailed: "Copy the link by hand.",
};

export const FOOTER = {
  disclaimer: "Golf Playbook is independent. Not affiliated with, sponsored or endorsed by TPC Scottsdale.",
};
