import { Reveal } from "./Reveal";

type Cell = {
  axis: string;
  title: string;
  items: string[];
};

const cells: Cell[] = [
  {
    axis: "技术 · 战略",
    title: "AI 产品架构",
    items: [
      "AI 产品从 0 到 1 设计与定义",
      "多模态应用与 Agent 系统架构",
      "Monorepo 与一人公司技术中台",
      "技术选型与长期演进路线",
    ],
  },
  {
    axis: "技术 · 执行",
    title: "全栈工程落地",
    items: [
      "React / TypeScript 前端工程",
      "Node.js 服务端与 API 设计",
      "结构化知识库与 RAG 落地",
      "工程化流程与自动化发布",
    ],
  },
  {
    axis: "人文 · 战略",
    title: "高信任服务设计",
    items: [
      "客户利益优先的服务体系搭建",
      "复杂需求洞察与方案抽象",
      "组织孵化与 SOP 体系设计",
      "心理疗愈方法论与个案经验",
    ],
  },
  {
    axis: "人文 · 执行",
    title: "深度陪伴与内容输出",
    items: [
      "结构化解读与一对一咨询",
      "小红书内容创作与社群运营",
      "曼陀罗绘画与家族系统排列",
      "团队培养与新人成长设计",
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
