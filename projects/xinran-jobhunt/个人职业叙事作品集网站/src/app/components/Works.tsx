import { Link } from "react-router";
import { getOrderedWorks, type PortfolioTarget } from "../content/portfolioTargets";
import { Reveal } from "./Reveal";
import { usePortfolioTarget } from "../usePortfolioTarget";

function ProjectCover({ accent, label }: { accent: string; label: string }) {
  return (
    <div
      className="relative aspect-[16/10] overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${accent}14 0%, ${accent}05 60%, transparent 100%)` }}
    >
      <svg viewBox="0 0 400 250" className="absolute inset-0 w-full h-full" aria-hidden>
        <g fill="none" stroke={accent} strokeOpacity="0.35" strokeWidth="0.6">
          <circle cx="200" cy="125" r="100" />
          <circle cx="200" cy="125" r="70" />
          <circle cx="200" cy="125" r="40" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * 40}
                y1={125 + Math.sin(a) * 40}
                x2={200 + Math.cos(a) * 100}
                y2={125 + Math.sin(a) * 100}
              />
            );
          })}
        </g>
      </svg>
      <div
        className="absolute bottom-4 left-5 tracking-[0.4em] uppercase"
        style={{ color: accent, opacity: 0.5, fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.7rem" }}
      >
        {label}
      </div>
    </div>
  );
}

export function Works({ target }: { target: PortfolioTarget }) {
  const works = getOrderedWorks(target);
  const { search } = usePortfolioTarget();

  return (
    <section id="works" className="relative py-28 md:py-36 bg-[#F4F1EA]">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="text-center mb-20">
            <div className="text-xs tracking-[0.5em] text-[#8B5A2B] mb-4" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              C H A P T E R &nbsp; 0 2
            </div>
            <h2
              className="text-[#2C3E50]"
              style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 500 }}
            >
              实践与探索
            </h2>
            <div className="w-12 h-px bg-[#8B5A2B] mx-auto mt-6" />
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 gap-8 md:gap-10 md:auto-rows-fr items-stretch">
          {works.map((p, i) => (
            <Reveal key={p.title} delay={i * 100} className="h-full">
              <Link to={{ pathname: p.to, search }} className="block h-full">
              <article className="group h-full flex flex-col bg-white/70 border border-[#8B5A2B]/10 hover:border-[#8B5A2B]/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_50px_-25px_rgba(44,62,80,0.3)]">
                <ProjectCover accent={p.accent} label={`Project 0${i + 1}`} />
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
                    <h3
                      className="text-[#2C3E50]"
                      style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.35rem", fontWeight: 500 }}
                    >
                      {p.title}
                      <span className="ml-2 text-[#2C3E50]/50" style={{ fontSize: "0.95rem" }}>｜ {p.subtitle}</span>
                    </h3>
                  </div>
                  <div
                    className="flex flex-wrap gap-x-4 text-[#8B5A2B] tracking-wider mb-5"
                    style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.78rem" }}
                  >
                    <span>角色：{p.role}</span>
                    <span>时间：{p.period}</span>
                  </div>
                  <p
                    className="text-[#2C3E50]/75 leading-[1.9] mb-6 flex-1"
                    style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.92rem" }}
                  >
                    {p.brief}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-5 border-t border-[#8B5A2B]/10 mt-auto">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 bg-[#8B5A2B]/5 text-[#8B5A2B] tracking-wider"
                        style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.7rem" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          
        </Reveal>
      </div>
    </section>
  );
}
