"use client";

import { Menu, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  userName: string;
  avatarUrl?: string | null;
  onMobileMenuToggle: () => void;
}

export function Header({
  title,
  userName,
  avatarUrl,
  onMobileMenuToggle,
}: HeaderProps) {
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HM";

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-white/10 bg-[#0C1B33] px-4 lg:px-6">
      {/* ── Mobile menu toggle ── */}
      <Button
        variant="ghost"
        size="icon"
        className="text-[#E8ECF1]/70 hover:bg-white/5 hover:text-[#E8ECF1] lg:hidden"
        onClick={onMobileMenuToggle}
      >
        <Menu className="size-5" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>

      {/* ── Page title ── */}
      <h1 className="text-lg font-semibold tracking-tight text-white">
        {title}
      </h1>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── User avatar with dropdown ── */}
      <div className="group relative">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
        >
          <Avatar size="sm">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
            <AvatarFallback className="bg-[#1A2332] text-[10px] text-[#D4A843]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-[#E8ECF1]/70 sm:inline">
            {userName || "Cadet"}
          </span>
        </button>

        {/* ── Dropdown ── */}
        <div className="invisible absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-white/10 bg-[#1A2332] py-1 opacity-0 shadow-xl transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
          <a
            href="/settings"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#E8ECF1]/70 transition-colors hover:bg-white/5 hover:text-[#E8ECF1]"
          >
            <User className="size-4" />
            Profile
          </a>
          <div className="my-1 h-px bg-white/10" />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#E8ECF1]/70 transition-colors hover:bg-white/5 hover:text-red-400"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
