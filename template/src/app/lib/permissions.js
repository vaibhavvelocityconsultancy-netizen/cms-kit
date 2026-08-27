// permissions.js

// ── Default permission map ────────────────────────────────

export const DEFAULT_ROLE_PERMISSIONS = {
  // Pages
  pages_view: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  pages_create: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  pages_edit_any: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  pages_delete: ["SUPER_ADMIN", "ADMIN", "EDITOR"],

  // Posts
  posts_view: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "VIEWER"],

  posts_create: [
    "SUPER_ADMIN",
    "ADMIN",
    "EDITOR",
    "AUTHOR",
    // "SUBSCRIBER",
  ],

  posts_edit_any: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  posts_edit_own: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],

  posts_delete_any: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  posts_delete_own: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],

  posts_publish: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],

  // Comments
  comments_moderate: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  comments_delete: ["SUPER_ADMIN", "ADMIN", "EDITOR"],

  // Media
  media_upload: ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"],
  media_delete: ["SUPER_ADMIN", "ADMIN", "EDITOR"],

  subscriber_upload_files_info: ["SUPER_ADMIN", "ADMIN"],

  // Taxonomy
  taxonomy_manage: ["SUPER_ADMIN", "ADMIN", "EDITOR"],

  // Menus
  menus_manage: ["SUPER_ADMIN", "ADMIN", "EDITOR"],

  // Users
  users_view: ["SUPER_ADMIN", "ADMIN"],
  users_create: ["SUPER_ADMIN", "ADMIN"],
  users_edit: ["SUPER_ADMIN", "ADMIN"],
  users_delete: ["SUPER_ADMIN", "ADMIN"],
  users_change_role: ["SUPER_ADMIN"],

  // Settings
  settings_manage: ["SUPER_ADMIN", "ADMIN"],
  global_css_manage: ["SUPER_ADMIN", "ADMIN"],

  // pricing
  subscription_manage: ["SUPER_ADMIN", "ADMIN"],
  // subscription_manage: ["SUPER_ADMIN"],
  // subscription_manage: ["SUPER_ADMIN"],
  // subscription_manage: ["SUPER_ADMIN"],

  // Courses
  courses_view: ["SUPER_ADMIN", "ADMIN"],
  courses_create: ["SUPER_ADMIN", "ADMIN"],
  courses_update: ["SUPER_ADMIN", "ADMIN"],
  courses_delete: ["SUPER_ADMIN", "ADMIN"],
  courses_edit: ["SUPER_ADMIN", "ADMIN"],
  course_content_manage: ["SUPER_ADMIN", "ADMIN"],


  // plans
  plans_update: ["SUPER_ADMIN", "ADMIN"],

  // E-commerce
  ecommerce_manage: ["SUPER_ADMIN", "ADMIN"],
  orders_view: ["SUPER_ADMIN", "ADMIN"],
  orders_manage: ["SUPER_ADMIN", "ADMIN"],
  customers_view: ["SUPER_ADMIN", "ADMIN"],
};

// ── Role hierarchy ────────────────────────────────────────

export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 6,
  ADMIN: 5,
  EDITOR: 4,
  AUTHOR: 3,
  VIEWER: 2,
  SUBSCRIBER: 1,
};

// ── Core check functions ──────────────────────────────────

export function hasPermission(role, permission, userPermissions = []) {
  // Check user-specific overrides first
  const override = userPermissions.find((p) => p.permissionName === permission);

  if (override !== undefined) {
    return override.allowed;
  }

  // Fall back to role default
  const allowed = DEFAULT_ROLE_PERMISSIONS[permission];

  if (!allowed) {
    return false;
  }

  return allowed.includes(role);
}

export function hasAnyPermission(role, permissions, userPermissions = []) {
  return permissions.some((permission) =>
    hasPermission(role, permission, userPermissions),
  );
}

export function isRoleHigherThan(role, target) {
  return (ROLE_HIERARCHY[role] ?? 0) > (ROLE_HIERARCHY[target] ?? 0);
}

export function canManageUser(actorRole, targetRole) {
  return isRoleHigherThan(actorRole, targetRole);
}

// ── UI helpers ────────────────────────────────────────────

export const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
  VIEWER: "Viewer",
  SUBSCRIBER: "Subscriber",
};

export const ROLE_COLORS = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN: "bg-purple-100 text-purple-700",
  EDITOR: "bg-blue-100 text-blue-700",
  AUTHOR: "bg-green-100 text-green-700",
  VIEWER: "bg-yellow-100 text-yellow-700",
  SUBSCRIBER: "bg-gray-100 text-gray-600",
};

export const ALL_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "AUTHOR",
  "VIEWER",
  "SUBSCRIBER",
];

export function normalizeRole(role) {
  if (typeof role !== "string") {
    return null;
  }

  const normalizedRole = role?.trim().toUpperCase();

  if (!ALL_ROLES.includes(normalizedRole)) {
    return null;
  }

  return normalizedRole;
}

export const ALL_PERMISSIONS = Object.keys(DEFAULT_ROLE_PERMISSIONS);
