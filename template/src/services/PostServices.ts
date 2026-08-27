import { api } from "../lib/axios";

export const postService = {
  // ─── GET ALL POSTS ─────────────────────────
  async getAll() {
    const res = await api.get("/api/posts");
    return res.data;
  },

  // ─── GET POST BY ID ───────────────────────
  async getById(id: string) {
    const res = await api.get(`/api/posts/${id}`);
    return res.data;
  },

  // ─── CREATE POST ──────────────────────────
  async create(data: any) {
    const res = await api.post("/api/posts", data);
    return res.data;
  },

  // ─── UPDATE POST ──────────────────────────
  async update(id: string, data: any) {
    const res = await api.put(`/api/posts/${id}`, data);
    return res.data;
  },

  // ─── DELETE POST ──────────────────────────
  async delete(id: string) {
    const res = await api.delete(`/api/posts/${id}`);
    return res.data;
  },

  // ─── PUBLISH POST ─────────────────────────
  async publish(id: string) {
    const res = await api.post(`/api/posts/${id}/publish`);
    return res.data;
  },

  // ─── UNPUBLISH POST ───────────────────────
  async unpublish(id: string) {
    const res = await api.post(`/api/posts/${id}/unpublish`);
    return res.data;
  },

  // ─── CHECK SLUG AVAILABILITY ──────────────
  async checkSlug(slug: string, excludeId?: string) {
    const res = await api.post(`/api/posts/slug/${slug}/check`, {
      excludeId: excludeId ?? null,
    });
    return res.data;
  },
};

// ─── CATEGORIES ───────────────────────────────────────────

export const categoryService = {
  async getAll() {
    const res = await api.get("/api/categories");
    return res.data.data;
  },

  async getById(id: string) {
    const res = await api.get(`/api/categories/${id}`);
    return res.data;
  },

  async create(data: any) {
    const res = await api.post("/api/categories", data);
    return res.data;
  },

  async update(id: string, data: any) {
    const res = await api.put(`/api/categories/${id}`, data);
    return res.data;
  },

  async delete(id: string) {
    const res = await api.delete(`/api/categories/${id}`);
    return res.data;
  },
};

// ─── TAGS ─────────────────────────────────────────────────

export const tagService = {
  async getAll() {
    const res = await api.get("/api/tags");
    return res.data.data;
  },

  async getById(id: string) {
    const res = await api.get(`/api/tags/${id}`);
    return res.data;
  },

  async create(data: any) {
    const res = await api.post("/api/tags", data);
    return res.data;
  },

  async update(id: string, data: any) {
    const res = await api.put(`/api/tags/${id}`, data);
    return res.data;
  },

  async delete(id: string) {
    const res = await api.delete(`/api/tags/${id}`);
    return res.data;
  },
};
