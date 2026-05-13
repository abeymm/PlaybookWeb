import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Playbook",
  description: "A private Golf Playbook strategy guide.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function PrivatePlaybookLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
