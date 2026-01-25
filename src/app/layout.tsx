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
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var stored = localStorage.getItem('theme');
                var mq = window.matchMedia('(prefers-color-scheme: dark)');
                var isDark = stored ? stored === 'dark' : mq.matches;
                document.documentElement.classList.toggle('dark', isDark);
                if (!stored) {
                  mq.addEventListener('change', function(e) {
                    if (!localStorage.getItem('theme')) {
                      document.documentElement.classList.toggle('dark', e.matches);
                    }
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
