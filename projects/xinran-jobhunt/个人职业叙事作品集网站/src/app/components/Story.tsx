import { Reveal } from "./Reveal";

type Phase = {
  title: string;
  period: string;
  position: string;
  practices: { heading: string; body: string }[];
  sediments: string[];
  tags: string[];
};

const phases: Phase[] = [
  {
    title: "技术筑基期",
    period: "2008 — 2016",
    position: "工程思维与系统能力 —— 从一线程序员成长为复合型技术人才，建立「复杂系统拆解与落地」的底层能力框架。",
    practices: [
      {
        heading: "主机游戏锤炼（2009—2012）",
        body: "维塔士期间参与《席德梅尔的海盗》Wii 版移植、达芬奇引擎 Wii 版开发优化和《Generator Rex》PS3 / Xbox360 / Wii 多平台开发，负责或参与 UI 系统、基础渲染、天空盒、地形渲染、粒子系统、资源管理系统和美术支持工具等模块。",
      },
      {
        heading: "技术管理升级（2012—2014）",
        body: "带领 12 人跨地域团队推进卡牌类 2D 回合制手游研发，负责技术方案选型、项目进度规划、任务分配、版本节奏把控与初级程序员带教；也曾搭建自动游戏版本发布系统，规范研发流程与评审机制。",
      },
    ],
    sediments: [
      "掌握多语言技术栈，具备主机 / 端游 / 移动端研发与适配经验",
      "建立「需求分析 → 方案设计 → 风险评估 → 落地实现 → 文档沉淀」的工程化思维",
      "具备跨职能协作与项目节奏管控能力，能平衡技术实现与产品目标",
      "形成快速学习落地未知领域的核心能力",
    ],
    tags: ["主机研发", "技术管理", "工程化思维", "团队协作"],
  },
  {
    title: "能力迁移期",
    period: "2017 — 2024",
    position: "用户洞察与商业验证 —— 将系统思维迁移至保险与房产咨询服务领域，完成从「解决技术问题」到「解决人的问题」的能力升级。",
    practices: [
      {
        heading: "保险方案服务（2017—2019）",
        body: "在友邦保险上海分公司面向家庭客户做保障需求访谈和风险识别，设计个性化家庭保障方案；参与保单维护、理赔协助、竞品对比和客户沟通资料整理，积累高信任、长周期客户服务经验。",
      },
      {
        heading: "房产咨询创业（2019—2024）",
        body: "开创单边代理房产咨询服务模式，建立「信任前置 + 利益一致 + 定制化服务」的服务体系。2 名经纪人 + 2 名助理团队年营收约 200 万元，相当于传统 20 人门店产出；累计服务 150 余名高净值客户，约 70% 客户来自转介绍。从 0 到 1 搭建服务 SOP、知识库与风控体系，孵化 30 余名经纪人，将零基础新人成长周期从约 18 个月缩短至约 6 个月。",
      },
    ],
    sediments: [
      "形成「客户利益优先」的核心价值观，理解高信任场景的服务本质与商业逻辑",
      "具备极强的需求洞察与定制化方案设计能力",
      "积累资源整合、团队管理与组织体系搭建经验，建立商业与行业视角",
    ],
    tags: ["保险方案", "高信任服务", "需求洞察", "SOP搭建"],
  },
  {
    title: "融合创新期",
    period: "2025 — 至今",
    position: "AI 产品与方案落地实践 —— 融合技术、咨询与人文能力，把真实服务场景拆成产品路径、工作流、知识层和交付边界。",
    practices: [
      {
        heading: "心理疗愈实践（2023—至今）",
        body: "系统学习曼陀罗绘画疗愈与家族系统排列，完成大量个案；通过小红书内容输出实现早期变现，形成「结构化解读 + 深度陪伴」的服务风格。",
      },
      {
        heading: "AI 疗愈产品开发（2025—至今）",
        body: "针对人工曼陀罗解读耗时高、标准化难的痛点，独立开发曼陀罗绘画 AI 解读产品，将经验性的人工解读转化为可产品化、可评估、可追问的数字服务。",
      },
      {
        heading: "一人公司系统搭建（2026—至今）",
        body: "以 Monorepo 架构整合多项目管理、Agent 协作、知识库与工具链，实现文档即系统、任务可追踪、知识可沉淀、交付可复盘。",
      },
    ],
    sediments: [
      "形成「一线发现痛点 → AI 工作流试点 → 产品化交付 → 复盘迭代」的闭环能力",
      "掌握 AI 产品设计、多模态应用、结构化知识库、质量门和生产化边界设计",
    ],
    tags: ["AI产品", "多模态", "Monorepo", "Agent协作"],
  },
];

function PhaseCard({ phase, align }: { phase: Phase; align: "left" | "right" }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm border border-[#8B5A2B]/10 p-7 md:p-9 rounded-sm hover:border-[#8B5A2B]/40 hover:shadow-[0_10px_40px_-20px_rgba(139,90,43,0.3)] transition-all duration-500">
      <div className={`flex items-baseline gap-4 mb-2 ${align === "right" ? "md:flex-row-reverse md:text-right" : ""}`}>
        <h3
          className="text-[#2C3E50]"
          style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.5rem", fontWeight: 500 }}
        >
          {phase.title}
        </h3>
        <span className="text-[#8B5A2B] tracking-widest" style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.8rem" }}>
          {phase.period}
        </span>
      </div>
      <p
        className="text-[#2C3E50]/75 leading-[1.9] mb-6"
        style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.92rem" }}
      >
        {phase.position}
      </p>

      <div className="mb-6">
        <div className="text-xs tracking-[0.3em] text-[#8B5A2B] mb-3" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          关 键 实 践
        </div>
        <div className="space-y-4">
          {phase.practices.map((p) => (
            <div key={p.heading}>
              <div
                className="text-[#2C3E50] mb-1"
                style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "0.95rem", fontWeight: 500 }}
              >
                {p.heading}
              </div>
              <p
                className="text-[#2C3E50]/70 leading-[1.9]"
                style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.875rem" }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xs tracking-[0.3em] text-[#8B5A2B] mb-3" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          核 心 沉 淀
        </div>
        <ul className="space-y-2">
          {phase.sediments.map((s) => (
            <li
              key={s}
              className="text-[#2C3E50]/75 leading-[1.8] pl-4 relative"
              style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.875rem" }}
            >
              <span className="absolute left-0 top-[0.85em] w-2 h-px bg-[#8B5A2B]" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2 pt-4 border-t border-[#8B5A2B]/10">
        {phase.tags.map((t) => (
          <span
            key={t}
            className="px-3 py-1 border border-[#8B5A2B]/30 text-[#8B5A2B] tracking-wider"
            style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.72rem" }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Story() {
  return (
    <section id="story" className="relative scroll-mt-24 py-28 md:py-36 bg-[#F9F7F3]">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="text-center mb-20">
            <div className="text-xs tracking-[0.5em] text-[#8B5A2B] mb-4" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              C H A P T E R &nbsp; 0 1
            </div>
            <h2
              className="text-[#2C3E50]"
              style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 500 }}
            >
              我的成长之路
            </h2>
            <div className="w-12 h-px bg-[#8B5A2B] mx-auto mt-6" />
          </div>
        </Reveal>

        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#8B5A2B]/30 to-transparent -translate-x-1/2" />

          <div className="space-y-16 md:space-y-24">
            {phases.map((phase, i) => {
              const align = i % 2 === 0 ? "left" : "right";
              return (
                <Reveal key={phase.title} delay={i * 80}>
                  <div className="relative md:grid md:grid-cols-2 md:gap-12 items-start">
                    <div className="hidden md:flex absolute left-1/2 top-8 -translate-x-1/2 w-4 h-4 items-center justify-center">
                      <span className="w-3 h-3 rotate-45 bg-[#F9F7F3] border border-[#8B5A2B]" />
                      <span className="absolute w-1.5 h-1.5 bg-[#8B5A2B]" />
                    </div>
                    {align === "left" ? (
                      <>
                        <PhaseCard phase={phase} align="left" />
                        <div />
                      </>
                    ) : (
                      <>
                        <div />
                        <PhaseCard phase={phase} align="right" />
                      </>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
