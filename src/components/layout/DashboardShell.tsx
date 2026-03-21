"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tickets": "Exam Tickets",
  "/history": "Session History",
  "/settings": "Settings",
};

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
}

export function DashboardShell({
  children,
  userName,
  userEmail,
  avatarUrl,
}: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  const pageTitle =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ||
    "Helm AI";

  return (
    <div className="flex h-screen overflow-hidden bg-[#0C1B33]">
      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex">
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
        />
      </div>

      {/* ── Mobile sidebar ── */}
      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
      />

      {/* ── Main content area ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={pageTitle}
          userName={userName}
          avatarUrl={avatarUrl}
          onMobileMenuToggle={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-[#111B27] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
