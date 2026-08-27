// src/lib/fetchers.ts

import { resolveAppUrl } from "./base-path";
import { getBaseUrl } from "./config";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

const buildUrl = (path: string, params?: QueryParams) => {
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
};

const fetcher = async (url: string) => {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith("http")
    ? url
    : // If baseUrl contains an origin (e.g. https://ipdav.com/newweb) use it,
      // otherwise resolve relative to detected app base path.
      baseUrl
      ? `${baseUrl}${url}`
      : resolveAppUrl(url, undefined);
  const res = await fetch(fullUrl, {
    cache: "no-store",
  });

  if (!res.ok) {
    // Log the actual status and response body for debugging
    const text = await res.text();
    // console.error(`[Fetcher] ${res.status} ${fullUrl}\n`, text);
    throw new Error(`Failed to fetch ${fullUrl}: ${res.status}`);
  }

  return res.json();
};

export const fetchers = {
  // settings
  settings: (params?: QueryParams) => fetcher(buildUrl("/api/setting", params)),
  globalCss: () => fetcher("/api/setting/global-css"),
  globalJs: () => fetcher("/api/setting/global-js"),
  footerSettings: () => fetcher("/api/footer-setting"),

  // menus
  menus: () => fetcher("/api/menus"),

  // pages

  page: (slug: string) => fetcher(`/api/pages/slug/${slug}`),
  pages: () => fetcher("/api/pages"),
  pageById: (id: string | number) => fetcher(`/api/public/pages/${id}`),

  // posts
  post: (slug: string) => fetcher(`/api/posts/slug/${slug}`),
  postComments: (postId: string) => fetcher(`/api/posts/${postId}/comments`),
  posts: () => fetcher("/api/posts"),

  // categories
  categories: () => fetcher("/api/categories"),

  // tags
  tags: () => fetcher("/api/tags"),

  // public
  publicSettings: () => fetcher("/api/public/settings"),
  publicPosts: () => fetcher("/api/public/posts"),
  publicFooterSettings: () => fetcher("/api/public/footer-settings"),
  publicMenus: () => fetcher("/api/public/menus"),
  publicPageBySlug: (slug: string) => fetcher(`/api/public/pages/slug/${slug}`),
  publicBootstrap: () => fetcher("/api/public/bootstrap"),
  footerMenus: () =>
    fetcher("/api/menus").then((d) => ({
      ...d,
      data: (d.data ?? []).filter((m: any) => m.location === "footer"),
    })),
  getDashboardData: () => fetcher("/api/subscriber-dashbaord"),
  getNavbarConfig: () => fetcher("/api/navbar-config"),

  // ── E-commerce ─────────────────────────────────────────────
  products: (params?: {
    search?: string;
    status?: string;
    brandId?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.brandId) qs.set("brandId", params.brandId);
    if (params?.categoryId) qs.set("categoryId", params.categoryId);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return fetcher(`/api/ecommerce/products${query ? `?${query}` : ""}`);
  },
  product: (id: string) => fetcher(`/api/ecommerce/products/${id}`),
  brands: () => fetcher("/api/ecommerce/brands"),
  brand: (id: string) => fetcher(`/api/ecommerce/brands/${id}`),
  productCategories: () => fetcher("/api/ecommerce/product-categories"),
  productCategory: (id: string) =>
    fetcher(`/api/ecommerce/product-categories/${id}`),
  attributes: () => fetcher("/api/ecommerce/attributes"),
  attribute: (id: string) => fetcher(`/api/ecommerce/attributes/${id}`),
  shippingZones: () => fetcher("/api/ecommerce/shipping-zones"),
  shippingZone: (id: string) => fetcher(`/api/ecommerce/shipping-zones/${id}`),
  taxClasses: () => fetcher("/api/ecommerce/tax-classes"),
  taxClass: (id: string) => fetcher(`/api/ecommerce/tax-classes/${id}`),
  coupons: (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return fetcher(`/api/ecommerce/coupons${query ? `?${query}` : ""}`);
  },
  coupon: (id: string) => fetcher(`/api/ecommerce/coupons/${id}`),
  orders: (params?: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    const query = qs.toString();
    return fetcher(`/api/ecommerce/orders${query ? `?${query}` : ""}`);
  },
  order: (id: string) => fetcher(`/api/ecommerce/orders/${id}`),
  customers: (params?: { search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return fetcher(`/api/ecommerce/customers${query ? `?${query}` : ""}`);
  },
  customer: (id: string) => fetcher(`/api/ecommerce/customers/${id}`),
  ecomSettings: () => fetcher("/api/ecommerce/settings"),
  ecomDashboard: () => fetcher("/api/ecommerce/dashboard"),
  publicPlans: () => fetcher("/api/public/plans"),

  // customers
  customersList: (params?: {
    search?: string;
    filter?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.filter) qs.set("filter", params.filter);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
    const query = qs.toString();
    return fetcher(`/api/customers${query ? `?${query}` : ""}`);
  },
  customerDetail: (userId: string | number) =>
    fetcher(`/api/customers/${userId}`),

  // fiie categories
  fileCategoriesPublic: async () => {
    const url = resolveAppUrl("/api/public/file-category", undefined);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }
    return res.json();
  },
  fileCategories: () => fetcher("/api/file-category"),
  fileCategory: (id: string) => fetcher(`/api/file-category/${id}`),
  fileById: (id: string) => fetcher(`/api/files/${id}`),
};
