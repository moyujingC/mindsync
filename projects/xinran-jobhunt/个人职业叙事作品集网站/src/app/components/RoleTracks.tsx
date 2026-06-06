import { Reveal } from "./Reveal";

const roles = [
  {
    id: "role-ai-product-manager",
    title: "AI 产品经理",
    summary: "从真实痛点出发，定义 AI 产品路径、MVP 范围、用户体验、质量门和迭代节奏。",
    proof: ["一镜一梳", "心理疗愈 AI 产品观察", "游戏开发技术履历"],
  },
  {
    id: "role-ai-transformation-consultant",
    title: "AI 转型咨询顾问",
    summary: "进入复杂业务现场，诊断流程问题，把专家经验沉淀为 SOP、知识库和 AI 工作流。",
    proof: ["知行工坊", "房产咨询与经纪人孵化", "曼陀罗疗愈知识库"],
  },
  {
    id: "role-fde-ai-solution-engineer",
    title: "FDE / AI 解决方案工程师",
    summary: "把客户场景拆成可验证 PoC、Agent 工作流、系统边界和可交付的 AI 应用原型。",
    proof: ["知行工坊", "一镜一梳", "早期工程与独立交付经历"],
  },
];

export function RoleTracks() {
  return (
    <section id="roles" className="relative py-24 md:py-32 bg-[#F9F7F3]">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="text-center mb-16">
            <div className="text-xs tracking-[0.5em] text-[#8B5A2B] mb-4" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              R O L E &nbsp; F I T
            </div>
            <h2
              className="text-[#2C3E50]"
              style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 500 }}
            >
              三个投递方向，一套能力证据
            </h2>
            <p
              className="max-w-2xl mx-auto mt-5 text-[#2C3E50]/70 leading-[1.9]"
              style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.95rem" }}
            >
              我关注的不是单一岗位标签，而是把真实业务问题转成 AI 产品、AI 工作流和可验证交付方案。
            </p>
            <div className="w-12 h-px bg-[#8B5A2B] mx-auto mt-6" />
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {roles.map((role, i) => (
            <Reveal key={role.title} delay={i * 90} className="h-full">
              <article
                id={role.id}
                className="h-full scroll-mt-24 bg-white/65 border border-[#8B5A2B]/10 p-7 md:p-8 hover:border-[#8B5A2B]/40 hover:bg-white transition-all duration-500"
              >
                <div
                  className="text-xs tracking-[0.4em] text-[#8B5A2B] mb-4"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                >
                  0{i + 1}
                </div>
                <h3
                  className="text-[#2C3E50] mb-5 pb-4 border-b border-[#8B5A2B]/15"
                  style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.25rem", fontWeight: 500 }}
                >
                  {role.title}
                </h3>
                <p
                  className="text-[#2C3E50]/78 leading-[1.8] mb-6"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.92rem" }}
                >
                  {role.summary}
                </p>
                <div className="space-y-2">
                  {role.proof.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-[#2C3E50]/75"
                      style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.84rem" }}
                    >
                      <span className="w-2.5 h-px bg-[#8B5A2B]" />
                      {item}
                    </div>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
