import { Reveal } from "./Reveal";

type Cell = {
  axis: string;
  title: string;
  items: string[];
};

const cells: Cell[] = [
  {
    axis: "FDE / AI 解决方案",
    title: "客户诊断与方案交付",
    items: [
      "高信任场景的需求诊断、约束识别与方案解释",
      "非标准服务的 SOP、知识库、风控清单与培训体系沉淀",
      "PoC / MVP 范围、AI 能力边界与验收口径设计",
      "业务、产品与工程之间的高频协作和交付推进",
    ],
  },
  {
    axis: "AI 应用工程师",
    title: "模型链路与防御工程",
    items: [
      "模型评测与选型、两段式生成、Golden Case 回归",
      "失败降级、追问安全拦截、私有存储与签名 URL",
      "Python / FastAPI、React / Vite、API 联调与公网部署",
      "问题定位、测试补齐、代码审查与 CI 协作",
    ],
  },
  {
    axis: "AI 产品经理",
    title: "产品定义与价值验证",
    items: [
      "从真实问题定义产品路径、用户分层和 MVP 取舍",
      "AI 输出质量、报告追问与安全边界的产品化设计",
      "Lite / Pro 分层与按份计费的商业化路径设计",
      "需求、设计、开发、部署与试用的端到端推进",
    ],
  },
  {
    axis: "底层支撑",
    title: "高信任场景与工程底座",
    items: [
      "C++ / Python / React / Git 技术基础",
      "游戏、App、工具类项目交付经验",
      "房产咨询、保险与高信任服务一线经验",
      "真实表达、交付边界与客户信任建立",
    ],
  },
];

export function Abilities() {
  return (
    <section id="abilities" className="relative scroll-mt-24 py-28 md:py-36 bg-[#F9F7F3]">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="text-center mb-20">
            <div className="text-xs tracking-[0.5em] text-[#8B5A2B] mb-4" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              C H A P T E R &nbsp; 0 3
            </div>
            <h2
              className="text-[#2C3E50]"
              style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 500 }}
            >
              我能做什么
            </h2>
            <div className="w-12 h-px bg-[#8B5A2B] mx-auto mt-6" />
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8">
          {cells.map((c, i) => (
            <Reveal key={c.title} delay={i * 80}>
              <div className="group relative bg-white/60 border border-[#8B5A2B]/10 p-8 md:p-10 hover:border-[#8B5A2B]/40 hover:bg-white transition-all duration-500 h-full">
                <div
                  className="text-xs tracking-[0.4em] text-[#8B5A2B] mb-4"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                >
                  {c.axis}
                </div>
                <h3
                  className="text-[#2C3E50] mb-6 pb-4 border-b border-[#8B5A2B]/15"
                  style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.4rem", fontWeight: 500 }}
                >
                  {c.title}
                </h3>
                <ul className="space-y-3">
                  {c.items.map((it) => (
                    <li
                      key={it}
                      className="text-[#2C3E50]/80 leading-[1.8] pl-5 relative"
                      style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.92rem" }}
                    >
                      <span className="absolute left-0 top-[0.85em] w-2.5 h-px bg-[#8B5A2B]" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
