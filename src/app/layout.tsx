import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import AmplifyProvider from "@/components/AmplifyProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  organizationSchema,
  websiteSchema,
  mobileAppSchema,
} from "@/lib/structuredData";
import {
  SITE_URL,
  SITE_NAME,
  PRIMARY_DESCRIPTION,
  PRIMARY_KEYWORDS,
  OG_IMAGE,
  OG_IMAGE_ALT,
  TWITTER_HANDLE,
  DEFAULT_LOCALE,
  APP_STORE_ID,
} from "@/lib/seo";

// Body: a clean humanist grotesque — readable, warm, and distinctly NOT a
// default system stack. Headings: Fraunces, a high-contrast display serif that
// reads premium and heritage (a fit for the keepsake yardage-book product).
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFBF00" },
    { media: "(prefers-color-scheme: dark)", color: "#08401B" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Strategy GPS for Golfers`,
    template: `%s | ${SITE_NAME}`,
  },
  description: PRIMARY_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  keywords: PRIMARY_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "sports",
  classification: "Sports / Golf / Mobile App",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Strategy GPS for Golfers`,
    description: PRIMARY_DESCRIPTION,
    url: SITE_URL,
    locale: DEFAULT_LOCALE,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Strategy GPS for Golfers`,
    description: PRIMARY_DESCRIPTION,
    images: [OG_IMAGE],
    creator: TWITTER_HANDLE,
    site: TWITTER_HANDLE,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  itunes: {
    appId: APP_STORE_ID,
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
        <JsonLd id="ld-organization" data={organizationSchema()} />
        <JsonLd id="ld-website" data={websiteSchema()} />
        <JsonLd id="ld-mobileapp" data={mobileAppSchema()} />
      </head>
      <body className={`${hankenGrotesk.variable} ${fraunces.variable} font-sans antialiased`}>
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}
