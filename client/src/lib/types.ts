export type Link = { label: string; href: string };

export type SiteInfo = {
  name: string;
  tagline: string;
  address: string[];
  phone: string;
  fax?: string;
  emails: { general: string; admin: string; finance?: string };
  social: { facebook?: string; twitter?: string; linkedin?: string };
  contacts: { name: string; role: string; email: string; photo?: string | null }[];
  map: { query: string; lat: number; lng: number };
};

export type HomeContent = {
  slides: { title: string; text: string; image: string | null; cta: Link }[];
  services: { title: string; text: string; href: string; image: string | null }[];
  quote: string;
  quoteImage: string | null;
  industries: { title: string; href: string; image: string | null }[];
  stats: string[];
  whyUs: { title: string; text: string }[];
  partners: { name: string; href: string | null; image: string | null }[];
  liveAccountUrl: string;
};

export type NavItem = { slug: string; title: string; navLabel?: string; navOrder: number };

export type SiteResponse = { site: SiteInfo; home: HomeContent; nav: NavItem[] };

type Doc = { _id: string; createdAt: string; updatedAt: string };

export type Page = Doc & {
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  heroImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  navOrder?: number | null;
  published: boolean;
};

export type Post = Doc & {
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string | null;
  publishedAt: string;
  published: boolean;
};

export type Venue = { name?: string; address?: string; city?: string; province?: string; postalCode?: string; country?: string };

export type EventItem = Doc & {
  slug: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  venue?: Venue | null;
  image?: string | null;
  published: boolean;
};

export type Testimonial = Doc & { name: string; quote: string; role?: string; company?: string; photo?: string | null };

export type AdminUser = { email: string; name?: string; picture?: string };

export type Paginated<T> = { data: T[]; page: number; limit: number; total: number; pages: number };
