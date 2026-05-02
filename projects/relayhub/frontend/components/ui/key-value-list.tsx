import { cn } from "@/lib/utils";

export function KeyValueList({
  items,
  dense = false,
}: {
  items: Array<{ label: string; value: React.ReactNode; emphasize?: boolean }>;
  dense?: boolean;
}) {
  return (
    <dl className={cn("grid gap-x-4 gap-y-3", dense ? "sm:grid-cols-2" : "lg:grid-cols-2")}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</dt>
          <dd className={cn("mt-2 text-sm leading-6 text-slate-700", item.emphasize && "font-medium text-slate-950")}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
