import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, webPageSchema } from "@/lib/structuredData";
import { canonical, OG_IMAGE } from "@/lib/seo";

const title =
  "Golf Playbook for Tournaments — Player Strategy Guides for Events";
const description =
  "Run a sharper tournament. Hand every player a branded strategy guide with hole-by-hole yardages, risk zones, wind charts, and a scorecard. Built for charity events, club championships, and corporate outings.";
const path = "/for-tournaments";

export const metadata: Metadata = {
  title: "For Tournaments — Player Strategy Guides for Events",
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

export default function ForTournamentsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd
        id="ld-for-tournaments-page"
        data={webPageSchema({ title, description, path })}
      />
      <JsonLd
        id="ld-for-tournaments-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "For Tournaments", url: path },
        ])}
      />
      {children}
    </>
  );
}
