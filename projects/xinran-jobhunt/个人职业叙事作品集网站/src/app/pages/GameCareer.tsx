import { useState } from "react";
import { Link } from "react-router";
import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { Mandala } from "../components/Mandala";
import { Reveal } from "../components/Reveal";

type Project = { name: string; role: string; duty: string };
type AccordionItem = { title: string; projects: Project[] };

const accordion: AccordionItem[] = [
  {
    title: "1. 主机 / 端游核心研发（2008 — 2012）",
    projects: [
      {
        name: "《射雕英雄传》MMORPG（昱泉国际）",
        role: "游戏程序员",
        duty: "基于 C++ / Lua 完成 Windows 端客户端 + 服务器端核心开发，负责 UI、任务 / 组队 / 自动寻路系统的功能落地，完成大型端游核心业务模块的研发与调试。",
      },
      {
        name: "《席德梅尔的海盗》Wii 版移植（维塔士）",
        role: "游戏开发工程师",
        duty: "主导 PC 版至 Wii 主机的跨平台适配，完成 UI 体感交互改造、迷你游戏逻辑调整。",
      },
      {
        name: "《Generator Rex》跨平台项目（维塔士）",
        role: "游戏开发工程师",
        duty: "参与 PS3 / Xbox360 / Wii / 3DS / DS 多平台开发，统筹 UI、战斗、网络同步等模块的跨平台一致性适配；输出多份技术适配文档，指导跨职能协作；参与自研达芬奇游戏引擎优化，解决主机平台渲染、工具链兼容等工程化问题。",
      },
    ],
  },
  {
    title: "2. 技术 + 项目管理融合实践（2012 — 2014）",
    projects: [
      {
        name: "PC 版 MMORPG 项目（笑游信息）",
        role: "项目经理（技术背景）",
        duty: "搭建自动游戏版本发布系统，规范研发流程与评审机制；协调跨团队协作，从技术视角识别项目风险、把控版本进度。",
      },
      {
        name: "卡牌类 2D 回合制对战手游（实艺信息）",
        role: "游戏制作人 + 资深程序员",
        duty: "带领 12 人跨地域团队（上海 / 西安）完成项目研发，负责技术方案选型、初级程序员带教、核心战斗 / UI 模块开发；平衡技术实现与产品目标。",
      },
    ],
  },
  {
    title: "3. 移动端技术拓展（2014 — 2016）",
    projects: [
      {
        name: "「勺子收藏夹」知识管理 APP（镜月信息）",
        role: "程序开发（兼产品设计）",
        duty: "负责 iOS / Android 双端核心开发（Objective-C / Java），快速完成技术栈迁移；结合产品视角参与功能设计，验证游戏研发能力向通用 APP 的适配性。",
      },
    ],
  },
];

const skillsLeft = [
  "核心编程语言：精通 C++（游戏研发主力语言），熟练掌握 Lua、Python、C#（主机 / 工具链开发）、Objective-C、Java（移动端开发）",
  "平台适配：具备 Xbox360、Wii、PS3 等主机平台，以及 Windows、iOS、Android 多端开发与适配经验",
  "引擎与框架：参与自研达芬奇 Wii 游戏引擎优化，熟悉跨平台引擎适配、渲染逻辑、工具链搭建与工程化问题解决",
  "研发方法论：掌握敏捷开发 / Scrum 流程，擅长技术文档撰写、跨职能协作、版本发布管控与研发风险识别",
];

const skillsRight = [
  "业务系统：UI（多平台适配 / 体感交互改造）、任务 / 组队 / 自动寻路系统",
  "底层技术：渲染优化、特效开发、跨平台性能适配、美术工具链搭建",
  "工程保障：版本发布系统搭建、研发流程规范、技术方案选型与风险评估",
];

const values = [
  { title: "工程化思维", body: "沉淀「技术方案评估 — 风险预判 — 落地实现 — 文档同步」全流程能力，能精准判断技术可行性、评估研发成本。" },
  { title: "跨域适配能力", body: "掌握端 / 移动端多平台适配逻辑，熟悉不同硬件研发特性，能解决跨平台体验一致性、工程兼容等核心问题。" },
  { title: "技术协同价值", body: "依托一线编码经验构建跨职能协作优势，既能下沉解决技术问题，也能上升统筹项目节奏、控制风险。" },
  { title: "快速学习适配", body: "具备强技术学习与迁移能力，能短时间内完成技术栈切换并落地核心功能。" },
];

function SectionHeader({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-10">
      <div
        className="text-xs tracking-[0.5em] text-[#8B5A2B] mb-3"
        style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
      >
        S E C T I O N &nbsp; {index}
      </div>
      <h2
        className="text-[#2C3E50] flex items-baseline gap-3"
        style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(1.4rem, 2.5vw, 1.85rem)", fontWeight: 500 }}
      >
        <span className="w-8 h-px bg-[#8B5A2B] inline-block translate-y-[-0.4em]" />
        {title}
      </h2>
    </div>
  );
}

function AccordionPanel({ item, isOpen, onToggle }: { item: AccordionItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-[#8B5A2B]/15 bg-white/60 rounded-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 md:px-8 py-5 text-left hover:bg-[#8B5A2B]/[0.03] transition-colors"
      >
        <span
          className="text-[#2C3E50] tracking-wide"
          style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.1rem", fontWeight: 500 }}
        >
          {item.title}
        </span>
        <span
          className={`text-[#8B5A2B] transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`}
          style={{ fontSize: "1.1rem" }}
        >
          +
        </span>
      </button>
      <div
        className="grid transition-all duration-500 ease-out"
        style={{
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="px-6 md:px-8 pb-7 pt-1 border-t border-[#8B5A2B]/10 space-y-7">
            {item.projects.map((p, i) => (
              <div key={p.name} className="relative pl-6">
                <span
                  className="absolute left-0 top-1 text-[#8B5A2B] tracking-wider"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.78rem" }}
                >
                  ({i + 1})
                </span>
                <h4
                  className="text-[#2C3E50] mb-3"
                  style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", fontWeight: 500 }}
                >
                  {p.name}
                </h4>
                <ul className="space-y-2">
                  <li className="flex gap-3 text-[#2C3E50]/80" style={{ lineHeight: 1.6, fontSize: "0.92rem" }}>
                    <span className="text-[#8B5A2B] mt-2 w-1.5 h-1.5 rounded-full bg-[#8B5A2B] flex-shrink-0" />
                    <span><span className="text-[#8B5A2B] mr-1">技术角色：</span>{p.role}</span>
                  </li>
                  <li className="flex gap-3 text-[#2C3E50]/80" style={{ lineHeight: 1.6, fontSize: "0.92rem" }}>
                    <span className="text-[#8B5A2B] mt-2 w-1.5 h-1.5 rounded-full bg-[#8B5A2B] flex-shrink-0" />
                    <span><span className="text-[#8B5A2B] mr-1">核心职责：</span>{p.duty}</span>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameCareer() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div
      className="min-h-screen bg-[#F9F7F3] text-[#2C3E50]"
      style={{ fontFamily: "'Inter', 'Noto Sans SC', sans-serif" }}
    >
      <Nav />

      <main className="relative overflow-hidden">
        <Mandala className="absolute -top-32 -right-40 w-[680px] h-[680px] pointer-events-none" opacity={0.06} />

        {/* Title region */}
        <section className="relative pt-36 md:pt-44 pb-20">
          <div className="max-w-4xl mx-auto px-6 md:px-10">
            <Reveal>
              <Link
                to="/"
                className="inline-flex items-center text-sm text-[#8B5A2B] hover:text-[#2C3E50] transition-colors mb-10 tracking-wider group"
              >
                <span className="mr-2 transition-transform duration-500 group-hover:-translate-x-1">←</span>
                返回首页
              </Link>
            </Reveal>
            <Reveal delay={80}>
              <div
                className="text-xs tracking-[0.5em] text-[#8B5A2B] mb-5"
                style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
              >
                P R O J E C T &nbsp; 0 5
              </div>
            </Reveal>
            <Reveal delay={160}>
              <h1
                className="text-[#2C3E50] mb-6"
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
                  fontWeight: 500,
                  lineHeight: 1.4,
                }}
              >
                游戏开发领域技术履历
              </h1>
            </Reveal>
            <Reveal delay={240}>
              <p
                className="text-[#2C3E50]/65 tracking-wider"
                style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1rem", lineHeight: 1.6 }}
              >
                2008 — 2016 &nbsp;|&nbsp; 从一线程序员到技术负责人 &nbsp;|&nbsp; 全平台游戏研发经验
              </p>
            </Reveal>
            <Reveal delay={320}>
              <div className="w-12 h-px bg-[#8B5A2B] mt-10" />
            </Reveal>
          </div>
        </section>

        {/* Section 1 */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 md:px-10">
            <Reveal>
              <SectionHeader index="0 1" title="职业总览" />
            </Reveal>
            <Reveal delay={80}>
              <div className="bg-white/60 border border-[#8B5A2B]/10 p-8 md:p-10 rounded-sm shadow-[0_10px_40px_-30px_rgba(44,62,80,0.4)]">
                <p
                  className="text-[#2C3E50]/85"
                  style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.95rem", lineHeight: 1.9 }}
                >
                  2008 — 2016 年深耕游戏开发领域，覆盖端游、主机游戏、移动端游戏全链路研发，从一线程序员逐步成长为兼具
                  技术实现、跨平台适配、项目管理与产品视角的复合型技术人才。主导 / 参与多款知名跨平台游戏项目，沉淀了扎实的
                  工程开发能力、跨平台研发经验与跨团队协作方法论，核心围绕「复杂系统研发落地 + 跨域技术适配 + 技术与业务协同」
                  形成完整技术实践闭环。
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Section 2 */}
        <section className="py-16 md:py-20 bg-[#F4F1EA]">
          <div className="max-w-4xl mx-auto px-6 md:px-10">
            <Reveal>
              <SectionHeader index="0 2" title="核心技术能力" />
            </Reveal>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8 md:auto-rows-fr items-stretch">
              <Reveal delay={80} className="h-full">
                <div className="h-full bg-white/70 border border-[#8B5A2B]/10 p-7 md:p-8 rounded-sm shadow-[0_10px_40px_-30px_rgba(44,62,80,0.4)] hover:border-[#8B5A2B]/30 transition-all duration-500">
                  <h3
                    className="text-[#2C3E50] mb-5 pb-4 border-b border-[#8B5A2B]/15"
                    style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.15rem", fontWeight: 500 }}
                  >
                    1. 技术栈与工具
                  </h3>
                  <ul className="space-y-3">
                    {skillsLeft.map((s) => (
                      <li
                        key={s}
                        className="flex gap-3 text-[#2C3E50]/80"
                        style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.9rem", lineHeight: 1.6 }}
                      >
                        <span className="text-[#8B5A2B] mt-2 w-1.5 h-1.5 rounded-full bg-[#8B5A2B] flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={160} className="h-full">
                <div className="h-full bg-white/70 border border-[#8B5A2B]/10 p-7 md:p-8 rounded-sm shadow-[0_10px_40px_-30px_rgba(44,62,80,0.4)] hover:border-[#8B5A2B]/30 transition-all duration-500">
                  <h3
                    className="text-[#2C3E50] mb-5 pb-4 border-b border-[#8B5A2B]/15"
                    style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.15rem", fontWeight: 500 }}
                  >
                    2. 核心模块开发能力
                  </h3>
                  <ul className="space-y-3">
                    {skillsRight.map((s) => (
                      <li
                        key={s}
                        className="flex gap-3 text-[#2C3E50]/80"
                        style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.9rem", lineHeight: 1.6 }}
                      >
                        <span className="text-[#8B5A2B] mt-2 w-1.5 h-1.5 rounded-full bg-[#8B5A2B] flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-6 md:px-10">
            <Reveal>
              <SectionHeader index="0 3" title="关键技术项目经验" />
            </Reveal>
            <div className="space-y-4">
              {accordion.map((item, idx) => (
                <Reveal key={item.title} delay={idx * 80}>
                  <AccordionPanel
                    item={item}
                    isOpen={openIdx === idx}
                    onToggle={() => setOpenIdx(openIdx === idx ? null : idx)}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="py-16 md:py-24 bg-[#F4F1EA]">
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            <Reveal>
              <SectionHeader index="0 4" title="技术沉淀与核心价值" />
            </Reveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {values.map((v, i) => (
                <Reveal key={v.title} delay={i * 80} className="h-full">
                  <div className="h-full bg-white/70 border border-[#8B5A2B]/10 p-6 md:p-7 rounded-sm shadow-[0_10px_40px_-30px_rgba(44,62,80,0.4)] hover:border-[#8B5A2B]/30 hover:-translate-y-1 transition-all duration-500">
                    <div
                      className="text-xs tracking-[0.4em] text-[#8B5A2B] mb-3"
                      style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
                    >
                      0 {i + 1}
                    </div>
                    <h3
                      className="text-[#2C3E50] mb-4 pb-3 border-b border-[#8B5A2B]/15"
                      style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.05rem", fontWeight: 500 }}
                    >
                      {v.title}
                    </h3>
                    <p
                      className="text-[#2C3E50]/75"
                      style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.88rem", lineHeight: 1.6 }}
                    >
                      {v.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
