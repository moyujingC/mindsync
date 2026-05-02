"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Cable, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  {
    href: "/entries",
    label: "入口",
    description: "看清每个入口现在实际打到哪",
    icon: Cable,
  },
  {
    href: "/models",
    label: "模型库",
    description: "维护模型、密钥和测试状态",
    icon: Boxes,
  },
  {
    href: "/settings",
    label: "设置",
    description: "管理 RelayHub 门禁卡",
    icon: KeyRound,
  },
];

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[--page] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[290px] shrink-0 border-r border-slate-200 bg-white/90 px-6 py-8 lg:block">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">RelayHub</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">正式控制台</h1>
            <p className="text-sm leading-6 text-slate-600">
              以后切模型、切密钥、切推理强度，都尽量只在这里做，不再分散到多个面板里。
            </p>
          </div>

          <nav className="mt-10 space-y-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-2xl border px-4 py-4 transition-colors",
                    active
                      ? "border-slate-900 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 rounded-xl p-2",
                        active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className={cn("text-xs leading-5", active ? "text-slate-300" : "text-slate-500")}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <header className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            </header>
            <div className="px-6 py-6 sm:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
