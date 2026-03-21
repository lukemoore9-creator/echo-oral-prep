"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Ship,
  Sailboat,
  Wrench,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { TicketType } from "@/types";

interface TicketSelectorProps {
  ticketTypes: TicketType[];
}

const categoryMeta: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  commercial: { label: "Commercial", icon: Ship },
  yachting: { label: "Yachting", icon: Sailboat },
  engineering: { label: "Engineering", icon: Wrench },
};

const categoryOrder = ["commercial", "yachting", "engineering"] as const;

export function TicketSelector({ ticketTypes }: TicketSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingTicketId, setLoadingTicketId] = useState<string | null>(null);

  // Group tickets by category
  const grouped = ticketTypes.reduce<Record<string, TicketType[]>>(
    (acc, ticket) => {
      const cat = ticket.category.toLowerCase();
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(ticket);
      return acc;
    },
    {}
  );

  // Determine initial active tab (first category that has tickets)
  const firstCategory =
    categoryOrder.find((cat) => grouped[cat]?.length) || "commercial";

  async function handleSelectTicket(ticketType: TicketType) {
    setLoadingTicketId(ticketType.id);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Create a new session
      const { data: session, error } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          ticket_type_id: ticketType.id,
          mode: "practice" as const,
          status: "active" as const,
          duration_seconds: 0,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error || !session) {
        console.error("Failed to create session:", error);
        setLoadingTicketId(null);
        return;
      }

      startTransition(() => {
        router.push(`/session/${session.id}`);
      });
    } catch (err) {
      console.error("Error creating session:", err);
      setLoadingTicketId(null);
    }
  }

  return (
    <Tabs defaultValue={firstCategory}>
      <TabsList className="mb-6 bg-[#1A2332]">
        {categoryOrder.map((cat) => {
          const meta = categoryMeta[cat];
          const count = grouped[cat]?.length ?? 0;
          if (count === 0) return null;

          return (
            <TabsTrigger
              key={cat}
              value={cat}
              className="gap-2 text-[#E8ECF1]/60 data-active:bg-[#212D3B] data-active:text-[#D4A843]"
            >
              <meta.icon className="size-4" />
              {meta.label}
              <span className="ml-1 text-[10px] text-[#E8ECF1]/30">
                ({count})
              </span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {categoryOrder.map((cat) => {
        const tickets = grouped[cat];
        if (!tickets?.length) return null;

        return (
          <TabsContent key={cat} value={cat}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tickets
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((ticket) => {
                  const isLoading = loadingTicketId === ticket.id;
                  const CategoryIcon = categoryMeta[cat].icon;

                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      disabled={isPending || isLoading}
                      onClick={() => handleSelectTicket(ticket)}
                      className="group text-left"
                    >
                      <Card
                        className={cn(
                          "h-full border-none bg-[#212D3B] ring-white/5 transition-all duration-200",
                          "hover:bg-[#283848] hover:ring-[#D4A843]/30",
                          "active:scale-[0.98]",
                          isLoading && "ring-[#D4A843]/50"
                        )}
                      >
                        <CardContent className="flex items-start gap-4">
                          {/* ── Icon ── */}
                          <div
                            className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors",
                              isLoading
                                ? "bg-[#D4A843]/20"
                                : "bg-[#1A2332] group-hover:bg-[#D4A843]/15"
                            )}
                          >
                            {isLoading ? (
                              <Loader2 className="size-5 animate-spin text-[#D4A843]" />
                            ) : (
                              <CategoryIcon className="size-5 text-[#E8ECF1]/50 group-hover:text-[#D4A843]" />
                            )}
                          </div>

                          {/* ── Text ── */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white group-hover:text-[#D4A843]">
                              {ticket.name}
                            </p>
                            {ticket.subtitle && (
                              <p className="mt-0.5 text-xs text-[#E8ECF1]/40">
                                {ticket.subtitle}
                              </p>
                            )}
                          </div>

                          {/* ── Arrow ── */}
                          <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#E8ECF1]/20 transition-all group-hover:translate-x-0.5 group-hover:text-[#D4A843]/60" />
                        </CardContent>
                      </Card>
                    </button>
                  );
                })}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
