import type { Database, Product } from "./types";
import { BUILT_IN_ROLES, OWNER_ROLE_ID } from "./permissions";

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  livingRoom: u("1618221195710-dd6b41faaea6"),
  livingRoom2: u("1618220179428-22790b461013"),
  interior: u("1600585154340-be6161a56a0c"),
  interior2: u("1600607687939-ce8a6c25118c"),
  interior3: u("1600210492486-724fe5c67fb0"),
  kitchen: u("1600566753190-17f0baa2a6c3"),
  kitchen2: u("1556911220-bff31c812dba"),
  bathroom: u("1552321554-5fefe8c9ef14"),
  bathroom2: u("1584622650111-993a426fbf0a"),
  bathroom3: u("1620626011761-996317b8d101"),
  bedroom: u("1505691938895-1758d7feb511"),
  lounge: u("1513694203232-719a280e022f"),
  sofa: u("1586023492125-27b2c045efd7"),
  apartment: u("1560448204-e02f11c3d0e2"),
  house: u("1600047509807-ba8f99d2cdde"),
};

export const SEED_IMAGES = IMG;

const now = new Date().toISOString();
const daysAgo = (d: number) =>
  new Date(Date.now() - d * 86400000).toISOString();
const stamp = { createdAt: now, updatedAt: now };

const categories = [
  { id: "cat-ncp", name: "Nano Crystal Polish", slug: "nano-crystal-polish", image: IMG.livingRoom, description: "Mirror-like shine with a nano-coated surface that resists stains and keeps its gloss for years." },
  { id: "cat-gp", name: "Glazed Porcelain", slug: "glazed-porcelain", image: IMG.bathroom, description: "Dense, low-absorption porcelain with rich printed glazes for floors and walls." },
  { id: "cat-gw", name: "Glossy Wall", slug: "glossy-wall", image: IMG.kitchen, description: "Bright, easy-clean wall tiles ideal for kitchens and bathrooms." },
  { id: "cat-hdr", name: "High Definition Relief", slug: "high-definition-relief", image: IMG.interior2, description: "3D relief textures printed in high definition for feature walls." },
  { id: "cat-tp", name: "Technical Porcelain", slug: "technical-porcelain", image: IMG.house, description: "Full-body porcelain engineered for heavy traffic and commercial spaces." },
  { id: "cat-rm", name: "Rustic Matt", slug: "rustic-matt", image: IMG.apartment, description: "Natural stone and wood looks with a warm, slip-resistant matt finish." },
].map((c, i) => ({ ...c, order: i + 1, active: true, ...stamp }));

type P = Omit<Product, "id" | "slug" | "views" | "createdAt" | "updatedAt" | "active">;
const productSeed: P[] = [
  { name: "Statuario Bianco", code: "NCP-6060-01", categoryId: "cat-ncp", size: "60x60 cm", finish: "Polished", color: "White", thickness: "9 mm", applications: ["Floor", "Living Room", "Bedroom"], piecesPerBox: 4, sqftPerBox: 15.5, price: 2150, images: [IMG.bedroom, IMG.livingRoom], description: "Classic Statuario marble look with soft grey veining and a nano crystal polished surface.", featured: true, isNew: true },
  { name: "Calacatta Gold", code: "NCP-6012-02", categoryId: "cat-ncp", size: "60x120 cm", finish: "Polished", color: "White", thickness: "9 mm", applications: ["Floor", "Living Room"], piecesPerBox: 2, sqftPerBox: 15.5, price: 3400, images: [IMG.livingRoom2, IMG.lounge], description: "Bold gold veining on a warm white base, made for statement living spaces.", featured: true, isNew: false },
  { name: "Onyx Pearl", code: "NCP-8080-03", categoryId: "cat-ncp", size: "80x80 cm", finish: "Polished", color: "Beige", thickness: "10 mm", applications: ["Floor", "Living Room", "Commercial"], piecesPerBox: 3, sqftPerBox: 20.6, price: 2950, images: [IMG.interior, IMG.sofa], description: "Translucent onyx-inspired tile with pearl undertones.", featured: true, isNew: true },
  { name: "Armani Grey", code: "GP-6060-11", categoryId: "cat-gp", size: "60x60 cm", finish: "Satin", color: "Grey", thickness: "9 mm", applications: ["Floor", "Bathroom", "Kitchen"], piecesPerBox: 4, sqftPerBox: 15.5, price: 1750, images: [IMG.bathroom, IMG.bathroom2], description: "Soft grey marble look with satin glazing for a calm, modern feel.", featured: true, isNew: false },
  { name: "Travertino Sand", code: "GP-6012-12", categoryId: "cat-gp", size: "60x120 cm", finish: "Matt", color: "Beige", thickness: "9 mm", applications: ["Floor", "Wall", "Outdoor"], piecesPerBox: 2, sqftPerBox: 15.5, price: 2400, images: [IMG.apartment, IMG.house], description: "Travertine texture with natural pores and warm sand tones.", featured: true, isNew: true },
  { name: "Nero Marquina", code: "GP-6060-13", categoryId: "cat-gp", size: "60x60 cm", finish: "Polished", color: "Black", thickness: "9 mm", applications: ["Floor", "Wall", "Bathroom"], piecesPerBox: 4, sqftPerBox: 15.5, price: 1980, images: [IMG.bathroom3, IMG.interior3], description: "Deep black marble with crisp white veins for dramatic contrast.", featured: false, isNew: false },
  { name: "Arctic White", code: "GW-3060-21", categoryId: "cat-gw", size: "30x60 cm", finish: "Glossy", color: "White", thickness: "8 mm", applications: ["Wall", "Kitchen", "Bathroom"], piecesPerBox: 8, sqftPerBox: 15.5, price: 980, images: [IMG.kitchen, IMG.kitchen2], description: "Pure white high-gloss wall tile that reflects light and brightens small rooms.", featured: true, isNew: false },
  { name: "Aqua Mosaic", code: "GW-3060-22", categoryId: "cat-gw", size: "30x60 cm", finish: "Glossy", color: "Blue", thickness: "8 mm", applications: ["Wall", "Bathroom"], piecesPerBox: 8, sqftPerBox: 15.5, price: 1050, images: [IMG.bathroom2], description: "Mosaic-printed glossy tile in fresh aqua shades.", featured: false, isNew: true },
  { name: "Woodland Relief", code: "HDR-3060-31", categoryId: "cat-hdr", size: "30x60 cm", finish: "Matt", color: "Brown", thickness: "10 mm", applications: ["Wall", "Living Room"], piecesPerBox: 6, sqftPerBox: 11.6, price: 1450, images: [IMG.interior2, IMG.lounge], description: "Real-touch wood grain relief for warm accent walls.", featured: false, isNew: false },
  { name: "Stone Ripple", code: "HDR-3060-32", categoryId: "cat-hdr", size: "30x60 cm", finish: "Matt", color: "Grey", thickness: "10 mm", applications: ["Wall", "Outdoor"], piecesPerBox: 6, sqftPerBox: 11.6, price: 1380, images: [IMG.house], description: "Rippled stone relief that plays with light across the day.", featured: false, isNew: true },
  { name: "Graphite Pro", code: "TP-6060-41", categoryId: "cat-tp", size: "60x60 cm", finish: "Matt", color: "Grey", thickness: "10 mm", applications: ["Floor", "Commercial", "Outdoor"], piecesPerBox: 4, sqftPerBox: 15.5, price: 1890, images: [IMG.interior3, IMG.interior], description: "Full-body technical porcelain for airports, malls and heavy-traffic areas.", featured: true, isNew: false },
  { name: "Oak Plank", code: "RM-2012-51", categoryId: "cat-rm", size: "20x120 cm", finish: "Matt", color: "Brown", thickness: "9 mm", applications: ["Floor", "Bedroom", "Living Room"], piecesPerBox: 5, sqftPerBox: 12.9, price: 2100, images: [IMG.sofa, IMG.bedroom], description: "Herringbone-ready oak plank tile with the warmth of real wood.", featured: true, isNew: true },
];

const products: Product[] = productSeed.map((p, i) => ({
  ...p,
  id: `prd-${i + 1}`,
  slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  views: Math.round(40 + Math.random() * 400),
  active: true,
  createdAt: daysAgo(60 - i * 4),
  updatedAt: daysAgo(60 - i * 4),
}));

const divisions = ["Dhaka", "Chattogram", "Sylhet", "Khulna", "Rajshahi", "Barishal", "Rangpur", "Mymensingh"];

export function createSeed(adminHash: string, adminEmail: string): Database {
  return {
    settings: {
      siteName: "Urban Distribution Hub",
      tagline: "Your Trusted Distribution Partner",
      phone: "+880 1700-000000",
      email: "info@urbandistributionhub.com",
      corporateOffice: "Level 5, House 12, Road 7, Gulshan 1, Dhaka 1212, Bangladesh",
      factory: "Sreepur, Gazipur, Bangladesh",
      videoId: "",
      homeIntroTitle: "Discover the Best Tiles Collection in Bangladesh",
      homeIntroText:
        "Urban Distribution Hub brings you an exclusive range of premium ceramic and porcelain tiles, sourced from trusted manufacturers and delivered right to your project. From glossy finishes to rustic textures, our collection suits every space — living room, kitchen, bathroom or outdoor — with the elegance and durability you can rely on.",
      whyTitle: "Why Choose Urban Distribution Hub?",
      whyText:
        "We are more than a tile shop — we are your distribution partner. Genuine products, transparent pricing, ready stock across the country and on-time delivery for homes, developers and contractors. Whatever the size of your project, our team makes sure the right tiles reach the right site, on schedule.",
      aboutText:
        "Urban Distribution Hub (UDH) was founded with one goal: to make premium tiles easy to buy and reliable to receive. We partner directly with leading manufacturers and keep ready stock in our warehouses, so builders, retailers and homeowners get genuine products at fair prices.\n\nFrom selecting the right design to bulk orders and doorstep delivery, our team supports you at every step — that is why customers call us their trusted distribution partner.",
      seoDescription: "Urban Distribution Hub — your trusted distribution partner for premium ceramic and porcelain tiles in Bangladesh. Floor, wall, kitchen, bathroom and outdoor tiles with nationwide delivery.",
      socials: {
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
        youtube: "https://youtube.com",
        linkedin: "https://linkedin.com",
        pinterest: "https://pinterest.com",
      },
    },
    roles: BUILT_IN_ROLES.map((r) => ({ ...r, permissions: [...r.permissions], ...stamp })),
    users: [
      {
        id: "usr-admin",
        name: "Administrator",
        email: adminEmail,
        phone: "",
        passwordHash: adminHash,
        roleId: OWNER_ROLE_ID,
        status: "active",
        sessionVersion: 1,
        mustChangePassword: false,
        failedAttempts: 0,
        lockedUntil: "",
        loginCount: 0,
        lastLoginAt: "",
        createdBy: "System",
        ...stamp,
      },
    ],
    categories,
    products,
    slides: [
      { id: "sld-1", title: "Echoes of Excellence", subtitle: "Herringbone wood tiles that bring warmth to every room", image: u("1618221195710-dd6b41faaea6", 2200), ctaLabel: "Find out more", ctaLink: "/products", order: 1, active: true, ...stamp },
      { id: "sld-2", title: "Timeless Marble, Modern Living", subtitle: "Nano Crystal Polish collection", image: u("1600585154340-be6161a56a0c", 2200), ctaLabel: "Explore collection", ctaLink: "/products?category=nano-crystal-polish", order: 2, active: true, ...stamp },
      { id: "sld-3", title: "Bathrooms Reimagined", subtitle: "Glazed porcelain made for wet spaces", image: u("1552321554-5fefe8c9ef14", 2200), ctaLabel: "Shop bathroom", ctaLink: "/products?application=Bathroom", order: 3, active: true, ...stamp },
    ],
    stores: divisions.flatMap((d, i) => [
      { id: `str-${i}-a`, name: `UDH Display Center — ${d}`, type: "Display Center", division: d, address: `Main Road, ${d} City`, phone: `+880 1711-00${i}00${i}`, mapUrl: `https://maps.google.com/?q=${encodeURIComponent(d + " Bangladesh")}`, active: true, ...stamp },
      { id: `str-${i}-b`, name: `${d} Tiles House`, type: "Dealer", division: d, address: `Station Road, ${d}`, phone: `+880 1811-1${i}${i}22`, mapUrl: `https://maps.google.com/?q=${encodeURIComponent(d + " Bangladesh")}`, active: true, ...stamp },
    ]),
    news: [
      { id: "nws-1", title: "How to keep polished tiles shining for years", slug: "keep-polished-tiles-shining", type: "Tiles Care", image: IMG.livingRoom2, excerpt: "A few smart cleaning habits make all the difference.", content: "Sweep or vacuum daily to remove grit that scratches the surface.\n\nMop with a pH-neutral cleaner — avoid acid and bleach which dull the glaze.\n\nWipe spills quickly, especially oil, tea and coffee.\n\nUse felt pads under furniture legs and a doormat at every entrance.", publishedAt: daysAgo(3), active: true, ...stamp },
      { id: "nws-2", title: "UDH at the International Building Expo 2026", slug: "building-expo-2026", type: "Event", image: IMG.interior3, excerpt: "Visit our pavilion to see 40+ new designs.", content: "We showcased over forty new designs including large-format slabs and the new Rustic Matt range.\n\nThank you to everyone who visited our pavilion.", publishedAt: daysAgo(12), active: true, ...stamp },
      { id: "nws-3", title: "New kiln line doubles large-format capacity", slug: "new-kiln-line", type: "News", image: IMG.house, excerpt: "Our new production line is now live.", content: "The new line produces up to 120x240 cm slabs with lower energy use per square metre.", publishedAt: daysAgo(30), active: true, ...stamp },
      { id: "nws-4", title: "Grout care: the secret to clean-looking floors", slug: "grout-care", type: "Tiles Care", image: IMG.bathroom3, excerpt: "Grout lines are where dirt hides. Here is how to fix that.", content: "Seal cement grout once a year.\n\nScrub with a soft brush and baking soda paste every few months.\n\nConsider epoxy grout for kitchens and bathrooms.", publishedAt: daysAgo(45), active: true, ...stamp },
    ],
    projects: [
      { id: "prj-1", title: "Skyline Residency", slug: "skyline-residency", client: "Skyline Developers", location: "Gulshan, Dhaka", year: 2025, image: IMG.apartment, description: "45,000 sqft of Nano Crystal Polish and Glossy Wall tiles across 60 luxury apartments.", active: true, ...stamp },
      { id: "prj-2", title: "Harbour View Hotel", slug: "harbour-view-hotel", client: "Harbour Hospitality", location: "Chattogram", year: 2024, image: IMG.interior, description: "Technical porcelain for lobby and corridors, glazed porcelain in 120 guest bathrooms.", active: true, ...stamp },
      { id: "prj-3", title: "Green Valley School", slug: "green-valley-school", client: "Green Valley Trust", location: "Sylhet", year: 2024, image: IMG.house, description: "Slip-resistant Rustic Matt tiles for classrooms and outdoor walkways.", active: true, ...stamp },
    ],
    catalogues: [
      { id: "ctl-1", title: "Product Catalogue 2026", cover: IMG.livingRoom, fileUrl: "#", year: 2026, active: true, ...stamp },
      { id: "ctl-2", title: "Wall Tiles Lookbook", cover: IMG.kitchen, fileUrl: "#", year: 2026, active: true, ...stamp },
      { id: "ctl-3", title: "Technical Porcelain Guide", cover: IMG.interior3, fileUrl: "#", year: 2025, active: true, ...stamp },
    ],
    sustainability: [
      { id: "sus-1", title: "Product", heading: "Towards a safer tomorrow", body: "We continuously improve the quality of our products and every process that goes into making them, while minimising the negative impact on the environment and on consumers.", image: IMG.lounge, order: 1, active: true, ...stamp },
      { id: "sus-2", title: "Energy", heading: "Cleaner firing", body: "Heat recovery from our kilns powers the dryers, cutting gas use per square metre by nearly a third.", image: IMG.interior2, order: 2, active: true, ...stamp },
      { id: "sus-3", title: "Water", heading: "Zero liquid discharge", body: "Process water is treated and recycled in a closed loop, so no untreated water ever leaves the plant.", image: IMG.house, order: 3, active: true, ...stamp },
    ],
    inquiries: [
      { id: "inq-1", name: "Rahim Uddin", email: "rahim@example.com", phone: "01711000001", subject: "Bulk order for apartment project", message: "We need around 12,000 sqft of 60x60 polished tiles. Please share dealer pricing.", productId: "prd-1", status: "new", notes: "", createdAt: daysAgo(1), updatedAt: daysAgo(1) },
      { id: "inq-2", name: "Nusrat Jahan", email: "nusrat@example.com", phone: "01811000002", subject: "Bathroom tiles availability", message: "Is Armani Grey available in Sylhet display center?", productId: "prd-4", status: "in-progress", notes: "Forwarded to Sylhet dealer.", createdAt: daysAgo(4), updatedAt: daysAgo(3) },
      { id: "inq-3", name: "Kamal Hossain", email: "kamal@example.com", phone: "01911000003", subject: "Dealership", message: "I want to become a dealer in Rangpur.", productId: "", status: "closed", notes: "", createdAt: daysAgo(9), updatedAt: daysAgo(6) },
    ],
    activity: [],
  };
}
