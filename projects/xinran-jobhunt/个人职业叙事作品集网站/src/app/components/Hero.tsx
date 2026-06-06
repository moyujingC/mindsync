import { Mandala } from "./Mandala";
import { Reveal } from "./Reveal";
import { getPortfolioTargetProfile, type PortfolioTarget } from "../content/portfolioTargets";

const evolution = [
  "技术实现",
  "项目组织",
  "高信任服务",
  "AI 产品化",
  "客户现场落地",
];

const targetOptions: Array<{ value: PortfolioTarget; label: string }> = [
  { value: "ai-product-manager", label: "AI 产品经理" },
  { value: "ai-transformation-consultant", label: "AI 转型咨询顾问" },
  { value: "fde-ai-solution-engineer", label: "FDE / AI 解决方案工程师" },
];

type HeroProps = {
  target: PortfolioTarget;
  profile: ReturnType<typeof getPortfolioTargetProfile>;
  onTargetChange: (target: PortfolioTarget) => void;
};

export function Hero({ target, profile, onTargetChange }: HeroProps) {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden bg-[#F9F7F3]"
    >
      <Mandala
        className="absolute -top-32 -right-32 w-[680px] h-[680px] pointer-events-none"
        opacity={0.07}
      />
      <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-32 pb-20 w-full">
        <Reveal>
          <div className="text-xs tracking-[0.5em] text-[#8B5A2B] mb-8" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            P E R S O N A L &nbsp;·&nbsp; N A R R A T I V E
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h1
            className="text-[#2C3E50] leading-[1.4] mb-6"
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "clamp(2rem, 5vw, 3.75rem)",
              fontWeight: 500,
            }}
          >
            技术筑基<span className="text-[#8B5A2B] mx-3">·</span>
            人文为核<span className="text-[#8B5A2B] mx-3">·</span>
            AI赋能
          </h1>
        </Reveal>

        <Reveal delay={220}>
          <p
            className="max-w-4xl text-[#2C3E50]/70 mb-10 tracking-wide leading-relaxed"
            style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1.05rem" }}
          >
            AI 产品经理 <span className="text-[#8B5A2B]/60 mx-2">|</span>
            AI 转型咨询顾问 <span className="text-[#8B5A2B]/60 mx-2">|</span>
            FDE / AI 解决方案工程师
          </p>
        </Reveal>

        <Reveal delay={320}>
          <div className="mb-8">
            <div
              className="text-xs tracking-[0.3em] text-[#8B5A2B]/80 mb-4"
              style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
            >
              投 递 版 本
            </div>
            <div className="inline-flex flex-wrap gap-2 rounded-full border border-[#8B5A2B]/15 bg-white/70 p-2">
              {targetOptions.map((option) => {
                const active = option.value === target;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onTargetChange(option.value)}
                    className={`px-4 py-2 text-sm transition-colors ${
                      active ? "bg-[#8B5A2B] text-[#F9F7F3]" : "text-[#2C3E50]/72 hover:text-[#8B5A2B]"
                    }`}
                    style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p
              className="max-w-2xl mt-4 text-[#2C3E50]/68 leading-[1.8]"
              style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.92rem" }}
            >
              当前为{profile.shortLabel}，页面会自动调整岗位顺序和案例展示优先级。
            </p>
          </div>
        </Reveal>

        <Reveal delay={380}>
          <p
            className="max-w-2xl text-[#2C3E50]/80 leading-[2] mb-14"
            style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1rem" }}
          >
            技术出身的复杂问题解决者：能从真实业务现场出发，
            把高信任、非标准化场景拆成 AI 产品、工作流和可验证交付方案。
          </p>
        </Reveal>

        <Reveal delay={480}>
          <div className="mb-16">
            <div className="text-xs tracking-[0.3em] text-[#8B5A2B]/80 mb-5" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              职 业 演 进
            </div>
            <div className="flex flex-wrap items-center gap-y-3">
              {evolution.map((e, i) => (
                <div key={e} className="flex items-center">
                  <span
                    className="text-[#2C3E50] tracking-wider"
                    style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "0.95rem" }}
                  >
                    {e}
                  </span>
                  {i < evolution.length - 1 && (
                    <span className="mx-3 md:mx-4 text-[#8B5A2B]/50">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={620}>
          <div className="flex flex-wrap gap-4">
            <a
              href="#story"
              className="group inline-flex items-center px-8 py-3 bg-[#8B5A2B] text-[#F9F7F3] tracking-[0.2em] hover:bg-[#2C3E50] transition-all duration-500"
              style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.875rem" }}
            >
              了解职业主线
              <span className="ml-3 transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#works"
              className="group inline-flex items-center px-8 py-3 border border-[#2C3E50]/40 text-[#2C3E50] tracking-[0.2em] hover:border-[#8B5A2B] hover:text-[#8B5A2B] transition-all duration-500"
              style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.875rem" }}
            >
              查看我的作品
              <span className="ml-3 transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
