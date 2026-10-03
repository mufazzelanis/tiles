import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { TileCalculator } from "@/components/site/TileCalculator";
import { SEED_IMAGES } from "@/lib/seed";

export const metadata: Metadata = { title: "Tiles Calculator" };

export default function CalculatorPage() {
  return (
    <>
      <PageHero title="Tiles Calculator" subtitle="Estimate how many boxes you need before you visit a store." image={SEED_IMAGES.bathroom} crumbs={[{ href: "/tiles-calculator", label: "Calculator" }]} />
      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_1fr]">
        <TileCalculator />
        <div className="text-[14px] leading-relaxed text-muted">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">How it works</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Measure the length and width of the room.</li>
            <li>Add 5–10% wastage for cuts (15% for diagonal or herringbone layouts).</li>
            <li>Check the sqft per box on the product page — it is pre-filled when you use the calculator there.</li>
          </ol>
          <p className="mt-4">For L-shaped rooms, split the area into rectangles and add them up.</p>
        </div>
      </div>
    </>
  );
}
