import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, webPageSchema } from "@/lib/structuredData";
import { canonical, OG_IMAGE } from "@/lib/seo";

const title = "Golf Playbook for Courses — Branded Yardage Books & Strategy Guides";
const description =
  "Give every golfer at your course a branded strategy guide. Printed yardage books, QR-linked digital playbooks, hole sponsorships, and pro shop revenue tools — all powered by Golf Playbook.";
const path = "/for-courses";

export const metadata: Metadata = {
  title: "For Courses — Branded Yardage Books & Strategy Guides",
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

export default function ForCoursesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd
        id="ld-for-courses-page"
        data={webPageSchema({ title, description, path })}
      />
      <JsonLd
        id="ld-for-courses-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "For Courses", url: path },
        ])}
      />
      {children}
    </>
  );
}
