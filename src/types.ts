export interface WebsiteConfig {
  logoUrl: string;
  faviconUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  openGraphImage: string;
  robotsTxt: string;
  sitemapXml: string;
  googleAnalyticsId: string;
  googleSearchConsoleId: string;
}

export interface HomeSection {
  bannerUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export interface AboutSection {
  title: string;
  description: string;
  imageUrl: string;
}

export interface WhyChooseUsItem {
  id: string;
  iconName: string;
  title: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  imageUrl: string;
  title: string;
  description: string;
  price: string;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface PriceListItem {
  id: string;
  title: string;
  subtitle: string;
  price: string;
}

export interface ComboPackage {
  id: string;
  title: string;
  price: string;
  inclusions: string[];
  imageUrl: string;
  buttonLink: string;
}

export interface PortfolioVideo {
  id: string;
  youtubeUrl: string;
  videoId: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  channelName: string;
  duration: string;
  publishDate: string;
}

export interface GalleryItem {
  id: string;
  type: 'image' | 'video' | 'youtube';
  url: string;
}

export interface ContactConfig {
  phone: string;
  email: string;
  address: string;
  googleMapsLink: string;
}

export interface PaymentConfig {
  phonePeQrUrl: string;
  googlePayQrUrl: string;
  paytmQrUrl: string;
  upiQrUrl: string;
  upiId: string;
}

export interface SocialLinks {
  instagram: string;
  youtube: string;
  facebook: string;
  x: string;
  whatsapp: string;
  telegram: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface PolicyPages {
  privacyPolicy: string;
  termsConditions: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  ip?: string;
}

export interface AnnouncementConfig {
  text: string;
  isActive: boolean;
}

export interface AppState {
  config: WebsiteConfig;
  home: HomeSection;
  about: AboutSection;
  whyChooseUs: WhyChooseUsItem[];
  categories: Category[];
  services: ServiceItem[];
  priceList: PriceListItem[];
  comboPackages: ComboPackage[];
  portfolio: PortfolioVideo[];
  gallery: GalleryItem[];
  contact: ContactConfig;
  payment: PaymentConfig;
  socials: SocialLinks;
  faq: FaqItem[];
  policies: PolicyPages;
  announcement: AnnouncementConfig;
  visitorCount: number;
}
