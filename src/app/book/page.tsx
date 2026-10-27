"use client";

/**
 * /book: the course book sales page (launch collection: top US golf destinations).
 * Copy lives in _components/copy.ts; the launch list, buy link and price in src/lib/book/catalog.ts;
 * the two forms post to /api/book/sample and /api/book/request.
 */
import { FinalCta, Footer, StickyBuyBar } from "./_components/Closing";
import { Design, Plan } from "./_components/DesignAndPlan";
import { Faq } from "./_components/Faq";
import { Header } from "./_components/Header";
import { Hero } from "./_components/Hero";
import { SampleSection } from "./_components/SampleSection";
import { Results, Stakes } from "./_components/StakesAndResults";
import { BookStoreProvider } from "./_components/store";
import { WhyABook } from "./_components/WhyABook";
import { WhyThisBook } from "./_components/WhyThisBook";

export default function BookPage() {
  return (
    <BookStoreProvider>
      <div className="min-h-screen bg-book-cream pb-24 text-book-ink md:pb-0">
        <Header />
        <main>
          <Hero />
          <Stakes />
          <Results />
          <WhyABook />
          <WhyThisBook />
          <Design />
          <Plan />
          <SampleSection />
          <Faq />
          <FinalCta />
        </main>
        <Footer />
        <StickyBuyBar />
      </div>
    </BookStoreProvider>
  );
}
