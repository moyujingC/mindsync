import { type ReactNode } from "react";
import { Link } from "react-router";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { Mandala } from "../components/Mandala";
import { usePortfolioTarget } from "../usePortfolioTarget";

export function ProjectPageShell({
  eyebrow,
  title,
  subtitle,
  accent = "#8B5A2B",
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  accent?: string;
  children?: ReactNode;
}) {
  const { search } = usePortfolioTarget();

  return (
    <div className="min-h-screen bg-[#F9F7F3] text-[#2C3E50]" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      <Nav />
      <main className="pt-32 pb-24 relative overflow-hidden">
        <Mandala className="absolute -top-32 -right-32 w-[600px] h-[600px] pointer-events-none" opacity={0.05} />
        <div className="relative max-w-4xl mx-auto px-6 md:px-10">
          <Link
            to={{ pathname: "/", search }}
            className="inline-flex items-center text-sm text-[#8B5A2B] hover:text-[#2C3E50] transition-colors mb-10 tracking-wider"
          >
            <span className="mr-2">←</span> 返回首页
          </Link>
          <div className="mb-12 pb-10 border-b border-[#8B5A2B]/15">
            <div
              className="text-xs tracking-[0.5em] mb-4"
              style={{ color: accent }}
            >
              {eyebrow}
            </div>
            <h1
              className="text-[#2C3E50] mb-3"
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "clamp(1.8rem, 4vw, 2.75rem)",
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              {title}
            </h1>
            <p className="text-[#2C3E50]/65 tracking-wider" style={{ fontSize: "1rem" }}>
              {subtitle}
            </p>
          </div>
          <div className="prose-content text-[#2C3E50]/80 leading-[2]" style={{ fontSize: "0.95rem" }}>
            {children ?? (
              <p className="text-[#2C3E50]/60 italic">详情内容即将上线，敬请期待。</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
