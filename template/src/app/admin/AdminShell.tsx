"use client";

import { Sidebar } from "@/src/components/admin/AppSidebar";
import { SidebarProvider, useSidebar } from "@/src/ui/sidebar";

export interface AdminShellUser {
  id?: string | number;
  email?: string;
  name?: string;
  role?: string;
  tenantId?: string | number;
  
}

function AdminMain({ children }: { children: React.ReactNode }) {
  const { state, isMobile } = useSidebar();
  return (
    <main
      className="dot-dot min-h-screen flex-1 overflow-y-auto p-2.5 transition-all duration-200 ease-linear"
      style={{
        marginLeft: isMobile ? 0 : state === "collapsed" ? "4.5rem" : "",
      }}
    >
      {children}
    </main>
  );
}

export function AdminShell({
  children,
  user,
  visibleModules,
}: {
  children: React.ReactNode;
  user: AdminShellUser;
  visibleModules: Record<string, boolean>;
}) {
  return (
    <SidebarProvider>
      <Sidebar userRole={user.role} visibleModules={visibleModules} />
      <AdminMain>{children}</AdminMain>
    </SidebarProvider>
  );
}
