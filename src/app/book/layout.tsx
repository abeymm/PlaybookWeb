import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { JsonLd } from "@/components/seo/JsonLd";
import { canonical } from "@/lib/seo";
import { breadcrumbSchema, faqSchema, webPageSchema } from "@/lib/structuredData";
import { FAQ, PAGE } from "./_components/copy";
import { BOOK_OG_IMAGE } from "./_images";

// The book's own type: Barlow Condensed for display, Barlow for body. Scoped to /book through the
// `.book-page` rules in globals.css, so the rest of the site keeps Fraunces + Hanken Grotesk.
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

const path = "/book";

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
  alternates: canonical(path),
  openGraph: {
    title: PAGE.title,
    description: PAGE.description,
    url: path,
    type: "website",
    images: [{ url: BOOK_OG_IMAGE.src, width: BOOK_OG_IMAGE.width, height: BOOK_OG_IMAGE.height, alt: PAGE.ogAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE.title,
    description: PAGE.description,
    images: [BOOK_OG_IMAGE.src],
  },
};

export default function BookLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Answers that still hold an owner placeholder stay out of the structured data.
  const faqs = FAQ.items
    .filter((item) => !item.placeholder)
    .map(({ question, answer }) => ({ question, answer }));

  return (
    <>
      <JsonLd id="ld-book-page" data={webPageSchema({ title: PAGE.title, description: PAGE.description, path })} />
      <JsonLd
        id="ld-book-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Course books", url: path },
        ])}
      />
      <JsonLd id="ld-book-faq" data={faqSchema(faqs)} />
      <div className={`${barlow.variable} ${barlowCondensed.variable} book-page`}>{children}</div>
    </>
  );
}
