// import { api } from "./api";

import { api } from "./axios";

export const authApi = {
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post("/api/auth/login", data, {
      withCredentials: true,
    }),

  register: (data: any) => api.post("/api/auth/register", data),

  logout: () =>
    api.post("/api/auth/logout", undefined, { withCredentials: true }),

  forgotPassword: (email: string) =>
    api.post("/api/auth/forgot-password", { email }, { withCredentials: true }),

  resetPassword: (token: string, password: string) =>
    api.post(
      "/api/auth/reset-password",
      {
        token,
        password,
      },
      { withCredentials: true },
    ),

  me: () => api.get("/api/auth/me", { withCredentials: true }),

  permissions: () => api.get("/api/permissions", { withCredentials: true }),

  seedPermissions: () =>
    api.post("/api/permissions/seed", undefined, { withCredentials: true }),

  updatePermissionRole: (data: {
    role: string;
    permission: string;
    allowed: boolean;
  }) => api.patch("/api/permissions/role", data, { withCredentials: true }),
};
