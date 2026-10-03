export type ID = string;

export interface Settings {
  siteName: string;
  tagline: string;
  phone: string;
  email: string;
  corporateOffice: string;
  factory: string;
  videoId: string;
  homeIntroTitle: string;
  homeIntroText: string;
  whyTitle: string;
  whyText: string;
  aboutText: string;
  seoDescription: string;
  socials: {
    facebook: string;
    instagram: string;
    youtube: string;
    linkedin: string;
    pinterest: string;
  };
}

export interface Category {
  id: ID;
  name: string;
  slug: string;
  image: string;
  description: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: ID;
  name: string;
  slug: string;
  code: string;
  categoryId: ID;
  size: string;
  finish: string;
  color: string;
  thickness: string;
  applications: string[];
  piecesPerBox: number;
  sqftPerBox: number;
  price: number;
  images: string[];
  description: string;
  featured: boolean;
  isNew: boolean;
  active: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export interface Slide {
  id: ID;
  title: string;
  subtitle: string;
  image: string;
  ctaLabel: string;
  ctaLink: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: ID;
  name: string;
  type: string;
  division: string;
  address: string;
  phone: string;
  mapUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface News {
  id: ID;
  title: string;
  slug: string;
  type: string;
  image: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: ID;
  title: string;
  slug: string;
  client: string;
  location: string;
  year: number;
  image: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Catalogue {
  id: ID;
  title: string;
  cover: string;
  fileUrl: string;
  year: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sustainability {
  id: ID;
  title: string;
  heading: string;
  body: string;
  image: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InquiryStatus = "new" | "in-progress" | "closed";

export interface Inquiry {
  id: ID;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  productId: ID | "";
  status: InquiryStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: ID;
  name: string;
  description: string;
  color: string;
  /** "module.action" strings, or ["*"] for everything */
  permissions: string[];
  /** locked built-in role (Super Admin) */
  system: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserStatus = "active" | "suspended";

export interface User {
  id: ID;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  roleId: ID;
  status: UserStatus;
  /** bumped to sign the user out of every device */
  sessionVersion: number;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: string;
  loginCount: number;
  lastLoginAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: ID;
  userName: string;
  action: string;
  target: string;
  at: string;
}

export interface Database {
  settings: Settings;
  roles: Role[];
  users: User[];
  categories: Category[];
  products: Product[];
  slides: Slide[];
  stores: Store[];
  news: News[];
  projects: Project[];
  catalogues: Catalogue[];
  sustainability: Sustainability[];
  inquiries: Inquiry[];
  activity: ActivityEntry[];
}

export type Collection = Exclude<keyof Database, "settings">;
