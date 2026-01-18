import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AmplifyProvider from "@/components/AmplifyProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Golf Playbook - Strategy That Wins",
  description:
    "Create, share, and print professional golf course strategies. Turn your practice into lower scores with pre-round planning that adapts as you play.",
  keywords:
    "golf, golf strategy, golf playbook, course management, golf printing, golf app",
  openGraph: {
    title: "Golf Playbook - Strategy That Wins",
    description:
      "Create, share, and print professional golf course strategies.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
