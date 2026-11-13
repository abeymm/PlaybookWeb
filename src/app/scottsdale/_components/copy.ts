/**
 * All player-facing copy for /scottsdale, in page order.
 *
 * Facts come from src/lib/book/scottsdale.ts. Rules the copy keeps: no data-source or method names,
 * no competitor names, no course counts, no score promises, no handicap level, no dashes as
 * punctuation, short plain words. Text in [square brackets] is an owner placeholder and stays
 * visible until it is filled in.
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
  subhead:
    "One pocket book for both courses, Champions and Stadium. A shot plan for every hole and where to miss on every green. Pre-order now and pick it up at registration.",
  cta: `Pre-order for ${preorderPrice}`,
  sampleLink: "See the sample",
  priceLine: `${preorderPrice} plus tax if you pre-order. ${tablePrice} plus tax at the table. Store price ${storePrice}.`,
};

export const WHAT = {
  headline: "What is in the book",
  items: [
    "Both courses in one book: Champions and Stadium.",
    "A shot plan for every hole, drawn on a photo map of the hole.",
    "Where to miss on every green, with slope arrows and height bands.",
    "A view from the tee that shows where to aim.",
    "Distances along each hole, with the height change marked.",
    "Pocket size, made to be read in a glance.",
  ],
};

export const SAMPLE = {
  headline: "See it before you pre-order",
  body: "The sample is five pages: the cover, then holes 1 and 10 of the Champions course.",
  button: "Open the sample (PDF)",
  note: "A PDF of about 2 MB. Share it with your group.",
  pdfHref: "/scottsdale/Playbook_TPC_Scottsdale_sample.pdf",
  coverAlt: "The cover of the book: Aim for your miss, not a miracle. TPC Scottsdale PGA Champions.",
  greenAlt: "The green page for hole 1: slope arrows, height bands and the spots to miss.",
  mapAlt: "The map page for hole 1: the planned shots on a photo of the hole, with distances from the tee.",
};

export const PRICING = {
  headline: "Price and pickup",
  rows: [
    { label: "Pre-order", price: preorderPrice, note: "plus tax. Pick up at registration." },
    { label: "At the table", price: tablePrice, note: "plus tax. No pre-order needed." },
    { label: "Store price", price: storePrice, note: "after the event." },
  ],
  pickup: `Pick up your book at registration on ${pickupDay}.`,
  pay: "Pay when you pick it up, by card or cash. You do not pay online.",
  // TODO(owner): fill in once the tour confirms registration hours and place.
  hoursPlaceholder: "[Registration hours and place: to confirm with the tour]",
  moneyBack: "If you do not like the book, you get your money back on the spot.",
};

export const PREORDER = {
  headline: "Pre-order your book",
  intro: `Name and email, nothing else. You pay at pickup, so no card is needed now.`,
  nameLabel: "Name",
  emailLabel: "Email",
  button: `Pre-order for ${preorderPrice}`,
  emailUse: "We use your name and email only to hold your book and to contact you about it. Nothing else.",
  sent: `You are on the list. Your book will be waiting at registration on ${pickupDay}.`,
};

export const APPS = {
  headline: "Try it free in the app first",
  body: "The Playbooks for both courses are free in the Golf Playbook app. They open in the app and need a free sign-in.",
  steps: [
    "Install the free Golf Playbook app.",
    "Sign in or make a free account.",
    "Tap the link for your course again.",
  ],
  getApp: "Get the app",
  linkLabel: (course: string): string => `${course} Playbook`,
  placeholder: (course: string): string => `[Link to come: ${course} Playbook]`,
};

export const FOOTER = {
  disclaimer: "Golf Playbook is independent. Not affiliated with, sponsored or endorsed by TPC Scottsdale.",
};
