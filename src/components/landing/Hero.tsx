import Link from "next/link";
import { Anchor, Mic, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
      {/* Background effects */}
      <div className="absolute inset-0 bg-chart-pattern" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-sm text-gold">
            <Anchor className="h-4 w-4" />
            <span>Powered by AI. Built for Mariners.</span>
          </div>

          {/* Main heading */}
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your AI Examiner.
            <br />
            <span className="text-gold">Available 24/7.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            Practice for your MCA oral exams with a realistic AI examiner.
            OOW, Master, Yacht Master — every ticket type covered.
            Speak naturally. Get instant feedback. Pass with confidence.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              render={<Link href="/signup" />}
              size="lg"
              className="h-12 px-8 text-base font-semibold bg-gold text-navy hover:bg-gold/90"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Practicing Free
            </Button>
            <Button
              render={<Link href="#features" />}
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base border-gold/30 text-foreground hover:bg-gold/10"
            >
              See How It Works
            </Button>
          </div>

          {/* Trust signals */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="h-4 w-4 text-gold" />
              <span>Voice-based practice</span>
            </div>
            <div className="flex items-center gap-2">
              <Anchor className="h-4 w-4 text-gold" />
              <span>14 ticket types</span>
            </div>
          </div>
        </div>

        {/* Mock UI preview */}
        <div className="mt-16 sm:mt-24">
          <div className="relative mx-auto max-w-4xl">
            <div className="rounded-xl border border-gold/10 bg-surface p-8 shadow-2xl shadow-gold/5">
              <div className="flex flex-col items-center gap-6">
                {/* Simulated orb */}
                <div className="h-32 w-32 rounded-full bg-gradient-to-br from-gold/30 to-gold/5 animate-pulse-gold flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gold/50 to-gold/20 flex items-center justify-center">
                    <Mic className="h-8 w-8 text-gold" />
                  </div>
                </div>
                {/* Simulated transcript */}
                <div className="w-full max-w-lg space-y-3">
                  <div className="rounded-lg bg-navy/50 p-3 text-sm">
                    <span className="text-gold font-medium">Examiner:</span>{" "}
                    <span className="text-foreground/80">
                      You&apos;re the OOW on a vessel making way in a TSS. You observe a vessel crossing from starboard. What actions do you take and which COLREGS rules apply?
                    </span>
                  </div>
                  <div className="rounded-lg bg-gold/5 border border-gold/10 p-3 text-sm text-right">
                    <span className="text-gold/70 font-medium">You:</span>{" "}
                    <span className="text-foreground/70">
                      I would maintain course and speed as the stand-on vessel under Rule 15...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
