import { cn } from "@/lib/utils";

export function SummaryCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <article
      className={cn(
        "rounded-3xl border p-4 sm:p-5",
        tone === "neutral" && "border-slate-200 bg-white",
        tone === "success" && "border-emerald-200 bg-emerald-50/70",
        tone === "warning" && "border-amber-200 bg-amber-50/80",
        tone === "danger" && "border-rose-200 bg-rose-50/80",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{hint}</p>
    </article>
  );
}
