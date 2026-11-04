import Link from "next/link";
import {
  Bath, BedDouble, Building2, Car, CarFront, ChefHat, Footprints, Home, Layers, LayoutGrid, Sofa, Sprout, Store, Sun, TrendingUp,
  UtensilsCrossed, Warehouse, Waves, type LucideIcon,
} from "lucide-react";

/** An icon for every application area offered in the admin (lib/resources.ts). */
const ICONS: Record<string, LucideIcon> = {
  Floor: LayoutGrid,
  Wall: Layers,
  Kitchen: ChefHat,
  Bathroom: Bath,
  "Living Room": Sofa,
  Bedroom: BedDouble,
  "Dining Room": UtensilsCrossed,
  Balcony: Sun,
  Staircase: TrendingUp,
  Rooftop: Building2,
  "Parking Area": Car,
  "Walking Area": Footprints,
  Driveway: CarFront,
  "Car Porch": Warehouse,
  "Garden & Lawn": Sprout,
  "Swimming Pool": Waves,
  Outdoor: Home,
  Commercial: Store,
};

/** "Suitable for: Floor · Rooftop · Parking Area" — each area links to every tile for that place. */
export function SuitableFor({ areas, className }: { areas: string[]; className?: string }) {
  if (!areas.length) return null;
  return (
    <div className={className}>
      <p className="mb-2 text-[12px] tracking-wider text-muted uppercase">Suitable for</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {areas.map((a) => {
          const Icon = ICONS[a] ?? LayoutGrid;
          return (
            <li key={a}>
              <Link
                href={`/products?application=${encodeURIComponent(a)}`}
                className="group flex items-center gap-1.5 text-[13px] text-ink transition hover:text-brand"
                title={`See all tiles for ${a.toLowerCase()}`}
              >
                <span className="grid size-7 place-items-center rounded-full bg-mist text-brand transition group-hover:bg-brand group-hover:text-white">
                  <Icon className="size-3.5" />
                </span>
                {a}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
