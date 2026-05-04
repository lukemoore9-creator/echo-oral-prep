"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { useState } from "react";
import { SettingsDrawer } from "@/components/layout/SettingsDrawer";

const HIDE_HEADER_ROUTES = [
  "/",
  "/home",
  "/examination",
  "/bridge",
  "/drill",
  "/onboarding",
  "/sign-in",
  "/sign-up",
  "/trainer",
];

export function Header() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hide on most routes — only show on /logbook and /report
  const shouldHide = HIDE_HEADER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (shouldHide) return null;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-rule bg-paper px-6">
        <Link href="/home" className="font-serif text-lg text-ink" style={{ fontWeight: 400 }}>
          Echo
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          className="text-ink-muted transition-colors hover:text-ink"
          aria-label="Settings"
        >
          <Settings className="h-[18px] w-[18px]" />
        </button>
      </header>
      <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
