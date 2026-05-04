"use client";

import Link from "next/link";

interface SerifLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "text-[15px]",
  md: "text-[17px]",
  lg: "text-[22px]",
};

export function SerifLink({
  href,
  children,
  onClick,
  disabled,
  className = "",
  size = "md",
}: SerifLinkProps) {
  if (onClick || disabled) {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={`group relative font-serif italic text-ink transition-colors hover:text-ink ${SIZE_CLASSES[size]} ${
          disabled ? "cursor-not-allowed text-ink-muted" : ""
        } ${className}`}
        style={{ fontWeight: 400 }}
      >
        {children}
        {!disabled && (
          <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
        )}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`group relative font-serif italic text-ink transition-colors hover:text-ink ${SIZE_CLASSES[size]} ${className}`}
      style={{ fontWeight: 400 }}
    >
      {children}
      <span className="absolute -bottom-1 left-0 h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-full" />
    </Link>
  );
}
