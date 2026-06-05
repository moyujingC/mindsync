import { type ReactNode } from "react";
import { Link } from "react-router";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { Mandala } from "../components/Mandala";
import { Reveal } from "../components/Reveal";

const serif = { fontFamily: "'Noto Serif SC', serif" } as const;
const sans = { fontFamily: "'Inter', 'Noto Sans SC', sans-serif" } as const;

export function PageHero({
  eyebrow,
  title,
  subtitle,
  oneLiner,
  role,
  period,
  tags,
  accent = "#8B5A2B",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  oneLiner: string;
  role: string;
  period: string;
  tags: string[];
  accent?: string;
}) {
  return (
    <section className="relative pt-36 md:pt-44 pb-16">
      <Mandala className="absolute -top-32 -right-40 w-[680px] h-[680px] pointer-events-none" opacity={0.06} />
      <div className="relative max-w-4xl mx-auto px-6 md:px-10">
        <Reveal>
          <Link
            to="/"
            className="inline-flex items-center text-sm hover:text-[#2C3E50] transition-colors mb-10 tracking-wider group"
            style={{ color: accent, ...sans }}
          >
            <span className="mr-2 transition-transform duration-500 group-hover:-translate-x-1">←</span>
            返回首页
          </Link>
        </Reveal>
        <Reveal delay={60}>
          <div className="text-xs tracking-[0.5em] mb-5" style={{ color: accent, ...sans }}>
            {eyebrow}
          </div>
        </Reveal>
        <Reveal delay={140}>
          <h1
            className="text-[#2C3E50] mb-4"
            style={{ ...serif, fontSize: "clamp(2rem, 4.5vw, 3.25rem)", fontWeight: 500, lineHeight: 1.4 }}
          >
            {title}
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <p className="text-[#2C3E50]/70 mb-6 tracking-wider" style={{ ...sans, fontSize: "1.05rem", lineHeight: 1.6 }}>
            {subtitle}
          </p>
        </Reveal>
        <Reveal delay={260}>
          <p
            className="max-w-3xl text-[#2C3E50]/80 mb-8 pl-4 border-l-2"
            style={{ ...sans, fontSize: "0.95rem", lineHeight: 1.8, borderColor: accent }}
          >
            {oneLiner}
          </p>
        </Reveal>
        <Reveal delay={320}>
          <div className="flex flex-wrap gap-x-8 gap-y-2 mb-6 text-sm" style={sans}>
            <span><span style={{ color: accent }}>角色 ｜ </span><span className="text-[#2C3E50]/80">{role}</span></span>
            <span><span style={{ color: accent }}>时间 ｜ </span><span className="text-[#2C3E50]/80">{period}</span></span>
          </div>
        </Reveal>
        <Reveal delay={380}>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="px-3 py-1 border tracking-wider"
                style={{ ...sans, fontSize: "0.72rem", borderColor: `${accent}55`, color: accent }}
              >
                {t}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={440}>
          <div className="w-12 h-px mt-10" style={{ background: accent }} />
        </Reveal>
      </div>
    </section>
  );
}

export function Section({
  index,
  title,
  children,
  shaded,
  accent = "#8B5A2B",
}: {
  index: string;
  title: string;
  children: ReactNode;
  shaded?: boolean;
  accent?: string;
}) {
  return (
    <section className={`py-16 md:py-20 ${shaded ? "bg-[#F4F1EA]" : ""}`}>
      <div className="max-w-4xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="mb-10">
            <div className="text-xs tracking-[0.5em] mb-3" style={{ color: accent, ...sans }}>
              S E C T I O N &nbsp; {index}
            </div>
            <h2
              className="text-[#2C3E50] flex items-baseline gap-3"
              style={{ ...serif, fontSize: "clamp(1.4rem, 2.5vw, 1.85rem)", fontWeight: 500 }}
            >
              <span className="w-8 h-px inline-block translate-y-[-0.4em]" style={{ background: accent }} />
              {title}
            </h2>
          </div>
        </Reveal>
        <Reveal delay={80}>{children}</Reveal>
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className="bg-white/60 border border-[#8B5A2B]/10 p-8 md:p-10 rounded-sm shadow-[0_10px_40px_-30px_rgba(44,62,80,0.4)] text-[#2C3E50]/85 space-y-4"
      style={{ ...sans, fontSize: "0.95rem", lineHeight: 1.9 }}
    >
      {children}
    </div>
  );
}

export function BulletList({ items, accent = "#8B5A2B" }: { items: ReactNode[]; accent?: string }) {
  return (
    <ul className="space-y-3 bg-white/60 border border-[#8B5A2B]/10 p-7 md:p-9 rounded-sm">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-[#2C3E50]/85" style={{ ...sans, fontSize: "0.92rem", lineHeight: 1.6 }}>
          <span
            className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: accent }}
          />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function StepFlow({ steps, accent = "#8B5A2B" }: { steps: { title: string; note?: string }[]; accent?: string }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {steps.map((s, i) => (
        <div key={i} className="relative bg-white/70 border border-[#8B5A2B]/10 p-5 rounded-sm">
          <div className="text-xs tracking-[0.3em] mb-2" style={{ color: accent, ...sans }}>
            STEP {String(i + 1).padStart(2, "0")}
          </div>
          <div className="text-[#2C3E50] mb-2" style={{ ...serif, fontSize: "0.98rem", fontWeight: 500 }}>
            {s.title}
          </div>
          {s.note && (
            <div className="text-[#2C3E50]/65" style={{ ...sans, fontSize: "0.82rem", lineHeight: 1.6 }}>
              {s.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ModuleGrid({
  modules,
  cols = 3,
  accent = "#8B5A2B",
}: {
  modules: { title: string; body: string }[];
  cols?: 2 | 3 | 4;
  accent?: string;
}) {
  const colsClass = cols === 4 ? "lg:grid-cols-4" : cols === 2 ? "md:grid-cols-2" : "md:grid-cols-3";
  return (
    <div className={`grid sm:grid-cols-2 ${colsClass} gap-5`}>
      {modules.map((m, i) => (
        <div
          key={m.title}
          className="bg-white/70 border border-[#8B5A2B]/10 p-6 rounded-sm shadow-[0_10px_40px_-30px_rgba(44,62,80,0.4)] hover:border-[#8B5A2B]/30 hover:-translate-y-1 transition-all duration-500"
        >
          <div className="text-xs tracking-[0.4em] mb-2" style={{ color: accent, ...sans }}>
            {String(i + 1).padStart(2, "0")}
          </div>
          <h3
            className="text-[#2C3E50] mb-3 pb-3 border-b border-[#8B5A2B]/15"
            style={{ ...serif, fontSize: "1.02rem", fontWeight: 500 }}
          >
            {m.title}
          </h3>
          <p className="text-[#2C3E50]/75" style={{ ...sans, fontSize: "0.88rem", lineHeight: 1.6 }}>
            {m.body}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DecisionTable({
  headers,
  rows,
  accent = "#8B5A2B",
}: {
  headers: string[];
  rows: string[][];
  accent?: string;
}) {
  return (
    <div className="overflow-x-auto bg-white/70 border border-[#8B5A2B]/10 rounded-sm">
      <table className="w-full" style={sans}>
        <thead>
          <tr style={{ background: `${accent}0d` }}>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-5 py-4 tracking-wider"
                style={{ color: accent, fontSize: "0.82rem", fontWeight: 500 }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#8B5A2B]/10">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-5 py-4 text-[#2C3E50]/85 align-top"
                  style={{ fontSize: "0.88rem", lineHeight: 1.6 }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Boundary({ children, accent = "#8B5A2B" }: { children: ReactNode; accent?: string }) {
  return (
    <div
      className="bg-[#2C3E50]/[0.03] border-l-2 p-6 md:p-7"
      style={{ borderColor: accent }}
    >
      <div
        className="text-xs tracking-[0.4em] mb-3"
        style={{ color: accent, ...sans }}
      >
        B O U N D A R Y
      </div>
      <div className="text-[#2C3E50]/85" style={{ ...sans, fontSize: "0.92rem", lineHeight: 1.8 }}>
        {children}
      </div>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#F9F7F3] text-[#2C3E50]"
      style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}
    >
      <Nav />
      <main className="relative overflow-hidden">{children}</main>
      <Footer />
    </div>
  );
}
