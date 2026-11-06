import {
  BadgeCheck, BookOpen, BookOpenCheck, Calculator, Car, Clock, FolderKanban, Heart, Home, LayoutGrid, Lightbulb,
  MapPinned, MessageCircle, Newspaper, PackageCheck, Phone, Search, Send, ShieldCheck, Sparkles, Star, Store, Truck, Wallet,
  type LucideProps,
} from "lucide-react";
import type { HomeIcon as IconKey } from "@/lib/home-content";

const ICONS: Record<IconKey, React.ComponentType<LucideProps>> = {
  sparkles: Sparkles, calculator: Calculator, book: BookOpen, store: Store, badge: BadgeCheck, package: PackageCheck,
  truck: Truck, wallet: Wallet, lightbulb: Lightbulb, map: MapPinned, dealer: BookOpenCheck, folder: FolderKanban,
  news: Newspaper, grid: LayoutGrid, send: Send, phone: Phone, shield: ShieldCheck, star: Star, heart: Heart,
  home: Home, car: Car, search: Search, chat: MessageCircle, clock: Clock,
};

/** An icon picked in the admin panel (falls back to a star). */
export function HomeIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name as IconKey] ?? Star;
  return <Icon {...props} />;
}
