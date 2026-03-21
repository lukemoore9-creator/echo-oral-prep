import { Anchor } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gold/10 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-gold" />
            <span className="font-heading text-lg font-semibold">Helm AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Helm AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
