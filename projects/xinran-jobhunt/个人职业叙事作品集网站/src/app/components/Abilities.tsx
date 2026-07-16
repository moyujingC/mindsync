import { Reveal } from "./Reveal";

type Cell = {
  axis: string;
  title: string;
  items: string[];
};

const cells: Cell[] = [
  {
    axis: "AI 产品经理",
    title: "产品定义与质量边界",
    items: [
      "AI 产品从 0 到 1 设计与定义",
      "BRD / PRD、MVP / PoC 范围控制",
      "Agent Loop、Prompt Pack 与输出契约",
      "质量门、验收口径与数据驱动迭代",
    ],
  },
  {
    axis: "FDE",
    title: "应用落地与工程协作",
    items: [
      "客户场景拆解与 PoC 路径设计",
      "Agent 工作流、RAG 思路与知识层接入",
      "需求沟通、流程诊断、试点建议与交付材料",
      "数据源、权限、日志、人审、回滚与评估口径",
    ],
  },
  {
    axis: "AI 转型咨询顾问",
    title: "业务诊断与工作流重构",
    items: [
      "AI 工作流诊断与服务边界设计",
      "复杂需求洞察、用户调研与方案抽象",
      "SOP、知识库、培训赋能与组织推广",
      "从工具使用走向系统化 AI 能力建设",
    ],
  },
  {
    axis: "底层支撑",
    title: "高信任场景与工程底座",
    items: [
      "C++ / Python / React / Git 技术基础",
      "游戏、App、工具类项目交付经验",
      "房产咨询、保险与疗愈一线服务经验",
      "真实表达、交付边界与客户信任建立",
    ],
  },
];

export function Abilities() {
  return (
    <section id="abilities" className="relative py-28 md:py-36 bg-[#F9F7F3]">
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
