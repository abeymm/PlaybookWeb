import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { canonical } from "@/lib/seo";
import { PAGE } from "./_components/copy";

// Same type as /book: Barlow Condensed for display, Barlow for body, scoped by the `.book-page` rules in globals.css.
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const path = "/scottsdale";

// An event page reached by the tour's email, so it stays out of search results and the sitemap.
export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
  alternates: canonical(path),
  robots: { index: false, follow: false },
  openGraph: { title: PAGE.title, description: PAGE.description, url: path, type: "website" },
};

export default function ScottsdaleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className={`${barlow.variable} ${barlowCondensed.variable} book-page`}>{children}</div>;
}
