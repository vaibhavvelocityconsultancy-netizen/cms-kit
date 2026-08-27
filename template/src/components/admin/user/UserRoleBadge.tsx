import { ROLE_COLORS, ROLE_LABELS } from "@/src/app/lib/permissions";

interface UserRoleBadgeProps {
  role: string;
}

type RoleName = keyof typeof ROLE_LABELS;

function isRoleName(role: string): role is RoleName {
  return role in ROLE_LABELS;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const label = isRoleName(role) ? ROLE_LABELS[role] : role;
  const color = isRoleName(role) ? ROLE_COLORS[role] : "bg-gray-100 text-gray-600";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
