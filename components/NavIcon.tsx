import {
  Award, BookOpen, Building2, Calculator, Download, FolderKanban, Gift, Heart, Home, Info, Layers, LayoutGrid, Mail, MapPin,
  MessageCircle, Newspaper, Package, Palette, Percent, Phone, Search, ShoppingBag, Sparkles, Star, Store, Tag, Truck,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "@/lib/site-layout";

export const NAV_ICONS: Record<Exclude<IconKey, "none">, LucideIcon> = {
  search: Search, store: Store, download: Download, calculator: Calculator, folder: FolderKanban, news: Newspaper, home: Home,
  info: Info, phone: Phone, mail: Mail, "map-pin": MapPin, package: Package, palette: Palette, heart: Heart, book: BookOpen,
  tag: Tag, sparkles: Sparkles, star: Star, percent: Percent, truck: Truck, gift: Gift, grid: LayoutGrid, layers: Layers,
  bag: ShoppingBag, message: MessageCircle, award: Award, building: Building2,
};

/** Renders a menu icon chosen in the admin panel (nothing for "none"). */
export function NavIcon({ name, className }: { name: IconKey; className?: string }) {
  if (name === "none") return null;
  const Icon = NAV_ICONS[name];
  return Icon ? <Icon className={className} aria-hidden /> : null;
}
