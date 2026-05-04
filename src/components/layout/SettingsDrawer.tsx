"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { STUDENT_TICKETS, getTicketName } from "@/lib/tickets";

interface StudentData {
  ticket_type: string;
  full_name: string;
  exam_date: string | null;
  has_exam_date: boolean;
}

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  scrollToTicket?: boolean;
}

const ROMAN = ["I", "II", "III", "IV"];

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [ticketExpanded, setTicketExpanded] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStudent = useCallback(() => {
    fetch("/api/student")
      .then((res) => res.json())
      .then((data) => {
        if (data.student) {
          setStudent(data.student);
          setExamDate(data.student.exam_date || "");
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (open) {
      fetchStudent();
      setTicketExpanded(false);
    }
  }, [open, fetchStudent]);

  const handleTicketChange = async (slug: string) => {
    setSaving(true);
    try {
      await fetch("/api/student", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketType: slug }),
      });
      setStudent((prev) => prev ? { ...prev, ticket_type: slug } : prev);
      setTicketExpanded(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to update ticket:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleExamDateChange = async (date: string) => {
    setExamDate(date);
    try {
      await fetch("/api/student", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate: date || null }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update exam date:", err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-ink/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[400px] bg-paper"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex h-16 items-center justify-between border-b border-rule px-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                  Settings
                </span>
                <button
                  onClick={onClose}
                  className="text-ink-muted transition-colors hover:text-ink"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-8">
                {/* Candidate name */}
                <div className="pb-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                    Candidate
                  </span>
                  <p className="mt-2 font-serif text-[17px] text-ink" style={{ fontWeight: 400 }}>
                    {student?.full_name || user?.fullName || "Loading..."}
                  </p>
                </div>

                <div className="border-t border-rule" />

                {/* Ticket */}
                <div className="py-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                    Ticket
                  </span>
                  <button
                    onClick={() => setTicketExpanded(!ticketExpanded)}
                    className="mt-2 block w-full text-left font-serif text-[17px] italic text-ink transition-colors hover:text-chart-green"
                    style={{ fontWeight: 400 }}
                    disabled={saving}
                  >
                    {student ? getTicketName(student.ticket_type) : "Loading..."}
                  </button>

                  <AnimatePresence>
                    {ticketExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-0">
                          {STUDENT_TICKETS.map((ticket, i) => {
                            const isActive = student?.ticket_type === ticket.slug;
                            return (
                              <button
                                key={ticket.slug}
                                onClick={() => handleTicketChange(ticket.slug)}
                                disabled={saving}
                                className={`flex w-full items-baseline gap-4 border-b border-rule py-3 text-left transition-colors ${
                                  isActive ? "text-chart-green" : "text-ink hover:text-chart-green"
                                }`}
                              >
                                <span className="w-8 shrink-0 font-serif text-[15px] text-ink-muted" style={{ fontWeight: 400 }}>
                                  {ROMAN[i]}
                                </span>
                                <span className="flex-1">
                                  <span className="block font-serif text-[15px]" style={{ fontWeight: 400 }}>
                                    {ticket.name}
                                  </span>
                                  <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
                                    {ticket.side}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-rule" />

                {/* Exam date */}
                <div className="py-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                    Exam date
                  </span>
                  <div className="mt-2">
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => handleExamDateChange(e.target.value)}
                      className="w-full border-b border-rule bg-transparent py-2 font-serif text-[15px] italic text-ink outline-none transition-colors focus:border-chart-green"
                      style={{ fontWeight: 400 }}
                      placeholder="Set exam date"
                    />
                  </div>
                </div>

                <div className="border-t border-rule" />

                {/* Sign out */}
                <div className="py-6">
                  <button
                    onClick={handleSignOut}
                    className="font-mono text-[13px] text-ink-muted transition-colors hover:text-refer"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
