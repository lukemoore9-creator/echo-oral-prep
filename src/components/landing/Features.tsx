import {
  Mic,
  Brain,
  BarChart3,
  BookOpen,
  Users,
  Zap,
  Target,
  Globe,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-Based Practice",
    description:
      "Speak naturally, just like a real oral exam. Our AI listens, understands, and responds in real time.",
  },
  {
    icon: Brain,
    title: "Adaptive Difficulty",
    description:
      "The AI adjusts question difficulty based on your performance. Strong answers lead to harder questions.",
  },
  {
    icon: BarChart3,
    title: "Detailed Scoring",
    description:
      "Get scored on every answer with specific feedback on what you got right and what you missed.",
  },
  {
    icon: BookOpen,
    title: "14 Ticket Types",
    description:
      "OOW, Master, Yacht Master, Engineering — every MCA ticket type with relevant question banks.",
  },
  {
    icon: Target,
    title: "Topic-Specific Drills",
    description:
      "Focus on your weak areas. COLREGS, SOLAS, stability, navigation — drill any topic you need.",
  },
  {
    icon: Clock,
    title: "Practice Anytime",
    description:
      "No scheduling, no waiting. Your AI examiner is available 24/7 from any device with a browser.",
  },
];

const comingSoon = [
  {
    icon: Zap,
    title: "Exam Readiness Score",
    description: "AI assessment of whether you would pass your oral exam today.",
  },
  {
    icon: Users,
    title: "Examiner Profiles",
    description:
      "Practice with different examiner styles — strict, conversational, rapid-fire.",
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Prepare for MCA exams even if English is not your first language.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to{" "}
            <span className="text-gold">pass your oral exam</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built by mariners, powered by AI. Practice smarter, not harder.
          </p>
        </div>

        {/* Main features */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-gold/10 bg-card p-6 transition-all hover:border-gold/30 hover:shadow-lg hover:shadow-gold/5"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold/20 transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div className="mx-auto mt-20 max-w-5xl">
          <h3 className="text-center font-heading text-xl font-semibold text-muted-foreground mb-8">
            Coming Soon
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {comingSoon.map((feature) => (
              <div
                key={feature.title}
                className="relative rounded-xl border border-dashed border-gold/10 bg-card/50 p-6 opacity-70"
              >
                <div className="absolute top-4 right-4 rounded-full bg-gold/10 px-2 py-0.5 text-xs text-gold">
                  Soon
                </div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/5 text-gold/50">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground/70">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
