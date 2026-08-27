export interface Post {
  id: any;
  title: string;
  slug: string;
  content: string;
  status: string;
  excerpt?: string;
  format?: string;
  featuredImage?: string | null;

  seoData?: {
    metaTitle?: string;
    metaDescription?: string;
    ogTitle?: string;
    ogDescription?: string;
    canonicalUrl?: string;
  };

  categoryIds?: string[];
  tagIds?: string[];

  categories?: { id: string; name: string }[];
  tags?: { id: string; name: string }[];

  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}