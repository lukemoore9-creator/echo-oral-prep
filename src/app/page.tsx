import Link from "next/link";
import { Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gold/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Anchor className="h-6 w-6 text-gold" />
            <span className="font-heading text-xl font-bold">Helm AI</span>
          </Link>
          <div className="hidden items-center gap-8 sm:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button render={<Link href="/login" />} variant="ghost" size="sm" className="text-foreground/80 hover:text-foreground">
              Log In
            </Button>
            <Button render={<Link href="/signup" />} size="sm" className="bg-gold text-navy hover:bg-gold/90">
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}
