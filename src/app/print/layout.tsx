import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, webPageSchema } from "@/lib/structuredData";
import { canonical, OG_IMAGE } from "@/lib/seo";

const title = "Print a Golf Strategy Guide — Personal Yardage Books on Demand";
const description =
  "Turn your Golf Playbook into a printed, course-ready yardage book. Choose your course, pick a layout, and we'll ship a pocket strategy guide built for the round you're about to play.";
const path = "/print";

export const metadata: Metadata = {
  title: "Print a Strategy Guide — Personal Yardage Books on Demand",
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

export default function PrintLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd
        id="ld-print-page"
        data={webPageSchema({ title, description, path })}
      />
      <JsonLd
        id="ld-print-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Print", url: path },
        ])}
      />
      {children}
    </>
  );
}
