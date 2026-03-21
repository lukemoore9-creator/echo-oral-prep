"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Anchor,
  History,
  Settings,
  LogOut,
  Compass,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Anchor },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
}

export function MobileNav({
  open,
  onOpenChange,
  userName,
  userEmail,
  avatarUrl,
}: MobileNavProps) {
  const pathname = usePathname();

  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HM";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-72 border-r-white/10 bg-[#0C1B33] p-0 text-[#E8ECF1]"
        showCloseButton={false}
      >
        {/* ── Branding ── */}
        <SheetHeader className="px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#D4A843]/15">
              <Compass className="size-5 text-[#D4A843]" />
            </div>
            <SheetTitle className="text-base font-semibold tracking-tight text-white">
              Helm AI
            </SheetTitle>
          </div>
        </SheetHeader>

        <Separator className="bg-white/10" />

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#D4A843]/15 text-[#D4A843]"
                    : "text-[#E8ECF1]/70 hover:bg-white/5 hover:text-[#E8ECF1]"
                )}
              >
                <item.icon
                  className={cn(
                    "size-[18px] shrink-0",
                    isActive ? "text-[#D4A843]" : "text-[#E8ECF1]/50"
                  )}
                />
                {item.label}
                {isActive && (
                  <span className="ml-auto size-1.5 rounded-full bg-[#D4A843]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Separator className="bg-white/10" />

          {/* ── User section ── */}
          <div className="p-3">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <Avatar size="default">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
                <AvatarFallback className="bg-[#1A2332] text-xs text-[#D4A843]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {userName || "Cadet"}
                </p>
                <p className="truncate text-xs text-[#E8ECF1]/50">
                  {userEmail}
                </p>
              </div>
            </div>

            <form action="/auth/signout" method="post" className="mt-1">
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-3 px-3 text-[#E8ECF1]/50 hover:bg-white/5 hover:text-red-400"
              >
                <LogOut className="size-[18px]" />
                Log out
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
