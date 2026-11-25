/**
 * /scottsdale: the event page for players in the US Am Tour event at TPC Scottsdale.
 * Copy lives in _components/copy.ts, facts and the two app Playbook links in src/lib/book/scottsdale.ts.
 * The pre-order form posts to /api/book/preorder (name and email only).
 */
import { PreorderForm } from "./_components/PreorderForm";
import { AppPlaybooks, Footer, Header, Hero, Sample } from "./_components/Sections";

export default function ScottsdalePage() {
  return (
    <div className="min-h-screen bg-book-cream text-book-ink">
      <Header />
      <main>
        <Hero />
        <Sample />
        <PreorderForm />
        <AppPlaybooks />
      </main>
      <Footer />
    </div>
  );
}
