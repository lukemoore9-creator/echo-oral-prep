import { SignUp } from "@clerk/nextjs";
import { DotPattern } from "@/components/ui/dot-pattern";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-white">
      <DotPattern className="opacity-30" />
      <div className="relative z-10 flex flex-col items-center">
        <span className="mb-8 text-2xl font-bold tracking-tight text-[#111111]">
          Echo
        </span>
        <SignUp
          appearance={{
            variables: {
              colorPrimary: "#2563EB",
              colorText: "#111111",
              colorTextSecondary: "#6B7280",
              colorBackground: "#FFFFFF",
              borderRadius: "8px",
              fontFamily: "Inter, sans-serif",
            },
          }}
        />
      </div>
    </div>
  );
}
