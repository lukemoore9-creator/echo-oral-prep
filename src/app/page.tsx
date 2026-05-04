"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // If signed in, redirect to /home
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/home");
    }
  }, [isLoaded, isSignedIn, router]);

  // Don't render landing if signed in (will redirect)
  if (!isLoaded || isSignedIn) {
    return <div className="fixed inset-0" style={{ backgroundColor: "var(--color-ink)" }} />;
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "var(--color-ink)" }}
    >
      {/* Sign in link top-right */}
      <div className="absolute top-8 right-8">
        <Link
          href="/sign-in"
          className="font-serif text-sm text-rule transition-colors hover:text-paper"
          style={{ fontWeight: 400 }}
        >
          Sign in &rarr;
        </Link>
      </div>

      {/* Centre content */}
      <div className="flex flex-col items-center">
        <h1
          className="font-serif text-[64px] sm:text-[96px] text-paper"
          style={{ fontWeight: 400, lineHeight: 1 }}
        >
          Echo
        </h1>
        <p
          className="mt-6 text-center font-serif text-[17px] sm:text-[22px] italic text-rule"
          style={{ fontWeight: 400, maxWidth: "480px" }}
        >
          Oral examination preparation for the maritime trade.
        </p>
        <p
          className="mt-16 font-mono text-[11px] uppercase text-rule"
          style={{ letterSpacing: "0.2em" }}
        >
          Private Beta &middot; By Invitation
        </p>
      </div>

      {/* Bottom rule + marks */}
      <div className="absolute inset-x-0" style={{ top: "88vh" }}>
        <div className="mx-6 border-t border-ink-soft" />
        <div className="mx-6 mt-6 flex items-center justify-between">
          <span
            className="font-mono text-[10px] uppercase text-rule"
            style={{ letterSpacing: "0.16em" }}
          >
            Echo &middot; MMXXVI
          </span>
          <span
            className="font-mono text-[10px] uppercase text-rule"
            style={{ letterSpacing: "0.16em" }}
          >
            Est. 2026
          </span>
        </div>
      </div>
    </div>
  );
}
