import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Protected Playbook",
  description: "A protected Golf Playbook strategy guide.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ProtectedPlaybookLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
