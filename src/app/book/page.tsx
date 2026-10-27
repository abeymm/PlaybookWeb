"use client";

/**
 * /book: the course book sales page (launch collection: top US golf destinations).
 * Copy lives in _components/copy.ts; the launch list, buy link and price in src/lib/book/catalog.ts;
 * the one form (course request) posts to /api/book/request. The sample hole is a public PDF
 * (public/book/sample-tpc-stadium.pdf).
 */
import { FinalCta, Footer, StickyBuyBar } from "./_components/Closing";
import { Design, Plan } from "./_components/DesignAndPlan";
import { Faq } from "./_components/Faq";
import { Header } from "./_components/Header";
import { Hero } from "./_components/Hero";
import { PlayLater } from "./_components/PlayLater";
import { RequestBand } from "./_components/RequestBand";
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
          <PlayLater />
          <WhyABook />
          <WhyThisBook />
          <Design />
          <Plan />
          <SampleSection />
          <Faq />
          <FinalCta />
          <RequestBand />
        </main>
        <Footer />
        <StickyBuyBar />
      </div>
    </BookStoreProvider>
  );
}
