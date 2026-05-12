import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, webPageSchema } from "@/lib/structuredData";
import { canonical, OG_IMAGE } from "@/lib/seo";

const title = "Partner with Golf Playbook — Courses, Coaches, and Brands";
const description =
  "Partner with Golf Playbook to put branded strategy guides in the hands of more golfers. Open to courses, coaching academies, and golf-adjacent brands.";
const path = "/partners";

export const metadata: Metadata = {
  title: "Partners",
  description,
  alternates: canonical(path),
  openGraph: {
    title,
    description,
    url: path,
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [OG_IMAGE],
  },
};

export default function PartnersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd
        id="ld-partners-page"
        data={webPageSchema({ title, description, path })}
      />
      <JsonLd
        id="ld-partners-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Partners", url: path },
        ])}
      />
      {children}
    </>
  );
}
