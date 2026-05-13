/**
 * Schema.org structured-data builders.
 * Keep values factual — leave fields empty rather than inventing.
 */

import {
  SITE_URL,
  SITE_NAME,
  APP_NAME,
  APP_STORE_URL,
  PRIMARY_DESCRIPTION,
  absoluteUrl,
  OG_IMAGE,
} from "./seo";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/images/logo-flat.png"),
    sameAs: [APP_STORE_URL],
  } as const;
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en-US",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  } as const;
}

/**
 * MobileApplication schema for the iOS Golf Playbook app.
 * aggregateRating reflects the App Store listing — keep ratingCount/ratingValue
 * in sync with apps.apple.com when reviews update.
 */
export function mobileAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: APP_NAME,
    operatingSystem: "iOS",
    applicationCategory: "SportsApplication",
    description: PRIMARY_DESCRIPTION,
    url: APP_STORE_URL,
    image: absoluteUrl(OG_IMAGE),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "15",
      reviewCount: "15",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  } as const;
}

type BreadcrumbItem = { name: string; url: string };

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  } as const;
}

type FaqItem = { question: string; answer: string };

export function faqSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  } as const;
}

export function webPageSchema(args: {
  title: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: args.title,
    description: args.description,
    url: absoluteUrl(args.path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  } as const;
}
