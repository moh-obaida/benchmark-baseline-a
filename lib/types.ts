export type StoryCard = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  authorName: string;
  authorSlug: string;
  authorId: string;
  coverUrl: string;
  coverAlt: string;
  categoryName: string;
  categorySlug: string;
  categoryColor: string;
  readingMinutes: number | null;
  ageRange: string;
  genre: string;
  storyType: string;
  featured: boolean;
  editorPick: boolean;
  publishAt: string;
  viewCount: number;
  favoriteCount: number;
  popularity: number;
  displayOrder: number;
};

export type StorySignal = StoryCard & {
  categoryIds: string[];
  tagIds: string[];
};

export type StoryDetail = StoryCard & {
  fullDescription: string;
  narrator: string;
  seriesName: string;
  episodeNumber: string;
  externalSource: string;
  audioUrl: string;
  videoUrl: string;
  tags: { name: string; slug: string }[];
  categories: { id: string; name: string; slug: string; color: string }[];
  gallery: { id: string; url: string; alt: string }[];
};

export type StoryAdmin = StoryDetail & {
  published: boolean;
  adminNotes: string;
  primaryCategoryId: string;
  coverId: string;
  relatedIds: string[];
  categoryIds: string[];
  galleryIds: string[];
  tagText: string;
  isDemo: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  imageUrl: string;
  imageAlt: string;
  imageId: string;
  sortOrder: number;
  published: boolean;
  showOnHome: boolean;
  showInNav: boolean;
  featured: boolean;
  isDemo: boolean;
};

export type Author = {
  id: string;
  name: string;
  slug: string;
  bio: string;
  imageUrl: string;
  imageAlt: string;
  imageId: string;
  featured: boolean;
  isDemo: boolean;
  storyCount: number;
};

export type MediaItem = {
  id: string;
  url: string;
  alt: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  originalName: string;
  createdAt: string;
};

export type SectionItem = {
  id: string;
  itemType: string;
  itemId: string;
  sortOrder: number;
  pinned: boolean;
};

export type HomeSection = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  sortOrder: number;
  mode: "auto" | "manual";
  itemCount: number;
  layout: string;
  config: Record<string, string>;
  startsAt: string;
  endsAt: string;
  items: SectionItem[];
};

export type ResolvedSection = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  layout: string;
  config: Record<string, string>;
  stories: StoryCard[];
  categories: Category[];
  authors: Author[];
  moreHref: string;
};

export type DiscoverySettings = {
  viewWeight: number;
  favoriteWeight: number;
  manualPopularityWeight: number;
  recencyDays: number;
  categoryWeight: number;
  tagWeight: number;
  authorWeight: number;
  genreWeight: number;
};

export type SocialLink = { label: string; url: string };

export type SiteSettings = {
  siteName: string;
  description: string;
  contactEmail: string;
  instagram: string;
  socialLinks: SocialLink[];
  seoTitle: string;
  seoDescription: string;
  socialImageId: string;
  socialImageUrl: string;
  logoId: string;
  logoUrl: string;
  defaultStoryCount: number;
  pageSize: number;
  density: "comfortable" | "compact";
  discovery: DiscoverySettings;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
};

export type CatalogQuery = {
  q?: string;
  category?: string;
  genre?: string;
  age?: string;
  type?: string;
  author?: string;
  tag?: string;
  sort?: string;
  page?: number;
};

export type StoryInput = {
  id?: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  authorId: string;
  coverId: string;
  primaryCategoryId: string;
  categoryIds: string[];
  tags: string[];
  ageRange: string;
  storyType: string;
  genre: string;
  readingMinutes: number | null;
  featured: boolean;
  editorPick: boolean;
  published: boolean;
  publishAt: string;
  popularity: number;
  adminNotes: string;
  displayOrder: number;
  narrator: string;
  seriesName: string;
  episodeNumber: string;
  externalSource: string;
  audioUrl: string;
  videoUrl: string;
  relatedIds: string[];
  galleryIds: string[];
};
