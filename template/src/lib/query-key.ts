// src/lib/query-keys.ts

export const queryKeys = {
  settings: ["settings"] as const,
  globalCss: ["global-css"] as const,
  globalJs: ["global-js"] as const,
  footerSettings: ["footer-settings"] as const,
  menus: ["menus"] as const,
  page: (slug: string) => ["page", slug] as const,
  pageById: (id: string | number) => ["page-id", id] as const,
  pages: ["pages"] as const,
  posts: ["posts"] as const,
  post: (slug: string) => ["post", slug] as const,
  footerMenus: ["footer-menus"] as const,

  // subscription
  dashboardData: ["dashboard-data"] as const,
  myCourses: ["my-courses"] as const,
};
