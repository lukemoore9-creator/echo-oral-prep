import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TicketSelector } from "@/components/dashboard/TicketSelector";
import type { TicketType } from "@/types";

export const metadata = {
  title: "Exam Tickets | Helm AI",
  description: "Choose your maritime exam ticket type to begin a session",
};

export default async function TicketsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch all active ticket types
  const { data: ticketTypes } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const tickets = (ticketTypes as TicketType[] | null) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Select Exam Ticket</h2>
        <p className="text-sm text-[#E8ECF1]/50">
          Choose the certificate of competency you want to prepare for.
        </p>
      </div>

      <TicketSelector ticketTypes={tickets} />
    </div>
  );
}
