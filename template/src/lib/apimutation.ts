// src/lib/apiMutations.ts

import { getBaseUrl } from "./config";

// src/lib/apiMutations.ts

export async function mutationRequest(url: string, method: string, body?: any) {
  const isFormData = body instanceof FormData;
  const fullUrl = url.startsWith("http") ? url : `${getBaseUrl()}${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers: isFormData ? undefined : { "Content-Type": "application/json" },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    console.error("Non-JSON response:", {
      url: fullUrl,
      status: res.status,
      text,
    });
    throw new Error(`Server returned HTML (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const apiMutations = {
  create: (data: any) => mutationRequest("/api/courses", "POST", data),

  update: (data: any, id: string) =>
    mutationRequest(`/api/courses/${id}`, "PUT", data),

  delete: (id: string) => mutationRequest(`/api/courses/${id}`, "DELETE"),

  toggleStatus: (id: string) =>
    mutationRequest(`/api/courses/${id}/toggle-published`, "PATCH"),

  reorder: (courses: any[]) =>
    mutationRequest("/api/courses/reorder", "PUT", courses),

  createContent: (data: any) =>
    mutationRequest("/api/course-content", "POST", data),

  updateContent: (data: any, id: string) =>
    mutationRequest(`/api/course-content/${id}`, "PATCH", data),

  deleteContent: (id: string) =>
    mutationRequest(`/api/course-content/${id}`, "DELETE"),

  updateModules: (id: string, modules: any[]) =>
    mutationRequest(`/api/course-content/${id}/modules`, "PATCH", { modules }),

  togglePublish: (id: string) =>
    mutationRequest(`/api/course-content/${id}/publish`, "PATCH"),

  // createCoursePrice: async (data: any) => {
  //   const res = await fetch("/api/pricing", {
  //     // adjust to your actual pricing endpoint
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(data), // includes courseContentId now
  //   });
  //   if (!res.ok) throw new Error("Failed to create pricing card");
  //   return res.json();
  // },

  updateSettings: (data: any) => mutationRequest("/api/setting", "PATCH", data),

  updateAdminToolbar: (data: any) =>
    mutationRequest("/api/setting/admin-toolbar", "PATCH", data),

  updateGlobalCss: (css: string) =>
    mutationRequest("/api/setting/global-css", "PUT", { css }),

  updateGlobalJs: (js: string) =>
    mutationRequest("/api/setting/global-js", "PUT", { js }),

  updateNavbarConfig: (data: any) =>
    mutationRequest("/api/navbar-config", "PUT", data),
  resetNavbarConfig: () => mutationRequest("/api/navbar-config", "DELETE"),
  toggleCourseStatus: (id: string, data: { isPublished: boolean }) =>
    mutationRequest(`/api/courses/${id}/toggle-status`, "PATCH", data),

  // ── E-commerce ─────────────────────────────────────────────
  createProduct: (data: any) =>
    mutationRequest("/api/ecommerce/products", "POST", data),

  updateProduct: (id: string, data: any) =>
    mutationRequest(`/api/ecommerce/products/${id}`, "PATCH", data),

  deleteProduct: (id: string) =>
    mutationRequest(`/api/ecommerce/products/${id}`, "DELETE"),

  // Content taxonomy
  createCategory: (data: any) =>
    mutationRequest("/api/categories", "POST", data),
  createTag: (data: any) => mutationRequest("/api/tags", "POST", data),

  // Categories
  createProductCategory: (data: any) =>
    mutationRequest("/api/ecommerce/product-categories", "POST", data),
  updateProductCategory: (id: string, data: any) =>
    mutationRequest(`/api/ecommerce/product-categories/${id}`, "PATCH", data),
  deleteProductCategory: (id: string) =>
    mutationRequest(`/api/ecommerce/product-categories/${id}`, "DELETE"),

  // Brands
  createBrand: (data: any) =>
    mutationRequest("/api/ecommerce/brands", "POST", data),
  updateBrand: (id: string, data: any) =>
    mutationRequest(`/api/ecommerce/brands/${id}`, "PATCH", data),
  deleteBrand: (id: string) =>
    mutationRequest(`/api/ecommerce/brands/${id}`, "DELETE"),

  // Attributes
  createAttribute: (data: any) =>
    mutationRequest("/api/ecommerce/attributes", "POST", data),
  updateAttribute: (id: string, data: any) =>
    mutationRequest(`/api/ecommerce/attributes/${id}`, "PATCH", data),
  deleteAttribute: (id: string) =>
    mutationRequest(`/api/ecommerce/attributes/${id}`, "DELETE"),

  // Shipping zones
  createShippingZone: (data: any) =>
    mutationRequest("/api/ecommerce/shipping-zones", "POST", data),
  updateShippingZone: (id: string, data: any) =>
    mutationRequest(`/api/ecommerce/shipping-zones/${id}`, "PATCH", data),
  deleteShippingZone: (id: string) =>
    mutationRequest(`/api/ecommerce/shipping-zones/${id}`, "DELETE"),

  // Tax classes
  createTaxClass: (data: any) =>
    mutationRequest("/api/ecommerce/tax-classes", "POST", data),
  updateTaxClass: (id: string, data: any) =>
    mutationRequest(`/api/ecommerce/tax-classes/${id}`, "PATCH", data),
  deleteTaxClass: (id: string) =>
    mutationRequest(`/api/ecommerce/tax-classes/${id}`, "DELETE"),

  // Coupons
  createCoupon: (data: any) =>
    mutationRequest("/api/ecommerce/coupons", "POST", data),
  updateCoupon: (id: string, data: any) =>
    mutationRequest(`/api/ecommerce/coupons/${id}`, "PATCH", data),
  deleteCoupon: (id: string) =>
    mutationRequest(`/api/ecommerce/coupons/${id}`, "DELETE"),

  // Orders
  updateOrder: (id: string, data: any) =>
    mutationRequest(`/api/ecommerce/orders/${id}`, "PATCH", data),
  addOrderNote: (id: string, data: any) =>
    mutationRequest(`/api/ecommerce/orders/${id}/notes`, "POST", data),

  // Ecommerce Settings
  updateEcomSettings: (data: any) =>
    mutationRequest("/api/ecommerce/settings", "PATCH", data),

  // customers
  deleteOrder: (orderId: string) =>
    mutationRequest(`/api/admin/orders/${orderId}`, "DELETE"),
  deleteEnrollment: (enrollmentId: string) =>
    mutationRequest(`/api/admin/enrollments/${enrollmentId}`, "DELETE"),

  // file categories
  createFileCategory: (data: any) =>
    mutationRequest("/api/file-category", "POST", data),
  updateFileCategory: (id: string, data: any) =>
    mutationRequest(`/api/file-category/${id}`, "PUT", data),
  deleteFileCategory: (id: string) =>
    mutationRequest(`/api/file-category/${id}`, "DELETE"),
  updateFile: (id: string, data: any) =>
    mutationRequest(`/api/files/${id}`, "PUT", data),

  // delete upload file
  deleteFile: (id: String) => mutationRequest(`/api/files/${id}`, "DELETE"),
};
