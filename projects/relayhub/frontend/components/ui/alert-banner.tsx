import { cn } from "@/lib/utils";

export function AlertBanner({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm leading-6",
        tone === "info" && "border-sky-200 bg-sky-50 text-sky-900",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-900",
        tone === "danger" && "border-rose-200 bg-rose-50 text-rose-900",
      )}
    >
      {children}
    </div>
  );
}
