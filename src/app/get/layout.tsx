import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, webPageSchema } from "@/lib/structuredData";
import { canonical, OG_IMAGE } from "@/lib/seo";

const title = "Get Golf Playbook";
const description =
  "Download Golf Playbook free. Plan your round at home and print your yardage book at home — no in-app purchase needed to get started.";
const path = "/get";

export const metadata: Metadata = {
  title,
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

export default function GetLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <JsonLd
        id="ld-get-page"
        data={webPageSchema({ title, description, path })}
      />
      <JsonLd
        id="ld-get-breadcrumb"
        data={breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Get", url: path },
        ])}
      />
      {children}
    </>
  );
}
