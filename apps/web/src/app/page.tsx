import { MainEventHero } from "../components/MainEventHero";
import { MatchesSection } from "../components/MatchesSection";
import { NewsSection } from "../components/NewsSection";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <MainEventHero />
      <MatchesSection />
      <NewsSection />
    </main>
  );
}
