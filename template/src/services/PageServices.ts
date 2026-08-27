import { api } from "../lib/axios";

export const pageService = {
  // ─── GET ALL PAGES ─────────────────────────
  async getAll() {
    const res = await api.get("/api/pages");
    return res.data;
  },

  // ─── GET PAGE BY ID ───────────────────────
  async getById(id: number) {
    const res = await api.get(`/api/pages/${id}`);
    return res.data;
  },

  // ─── CREATE PAGE ──────────────────────────
  async create(data: any) {
    const res = await api.post("/api/pages", data);
    return res.data;
  },

  // ─── UPDATE PAGE ──────────────────────────
  async update(id: number, data: any) {
    const res = await api.put(`/api/pages/${id}`, data);
    return res.data;
  },

  // ─── DELETE PAGE ──────────────────────────
  async delete(id: number) {
    const res = await api.delete(`/api/pages/${id}`);
    return res.data;
  },

  // bulk delete
  async bulkDelete(ids: (string | number)[]) {
    const res = await api.post("/api/pages/bulk-delete", { ids });
    return res.data;
  },

  // ─── PUBLISH PAGE ─────────────────────────
  async publish(id: number) {
    const res = await api.put(`/api/pages/${id}`, {
      action: "publish",
    });
    return res.data;
  },

  // ─── UNPUBLISH PAGE ───────────────────────
  async unpublish(id: number) {
    const res = await api.put(`/api/pages/${id}`, {
      action: "unpublish",
    });
    return res.data;
  },

  // ─── GET PAGE BY SLUG (PUBLIC) ────────────
  async getBySlug(slug: string) {
    const res = await api.get(`/api/pages/slug/${slug}`);
    return res.data;
  },

  // ─── CHECK SLUG AVAILABILITY ──────────────
  async checkSlug(slug: string) {
    const res = await api.post("/api/pages/slug/check", { slug });
    return res.data;
  },
};
