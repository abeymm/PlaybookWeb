import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Playbook",
  description:
    "A shared Golf Playbook strategy guide with hole-by-hole yardages, risk zones, and aim lines.",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function PublicPlaybookLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
