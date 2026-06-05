import {
  PageShell,
  PageHero,
  Section,
  Prose,
  BulletList,
  StepFlow,
  ModuleGrid,
  DecisionTable,
  Boundary,
} from "./_blocks";

const ACCENT = "#2C3E50";

export default function Monorepo() {
  return (
    <PageShell>
      <PageHero
        eyebrow="P R O J E C T &nbsp; 0 2"
        title="知行工坊"
        subtitle="AI 一人公司 Monorepo / 公司工作空间"
        oneLiner="一套中文语境下的 AI 一人公司工作系统，用 Monorepo 管理公司治理、项目入口、角色定义、知识库、共享工具和阶段 artifact。"
        role="系统设计者 / 一人公司工作空间搭建者 / Agent 协作机制推进者"
        period="2026 — 至今"
        tags={["Monorepo", "Agent 协作", "Docs As System", "知识治理", "任务流转"]}
        accent={ACCENT}
      />

      <Section index="0 1" title="项目背景 ｜ 为什么做" accent={ACCENT}>
        <Prose>
          <p>当 AI 真正参与长期工作后，问题不再只是「怎么写一个 prompt」，而是信息、任务、角色和项目如何持续保持可追踪。</p>
          <p>在多项目并行时，如果所有信息都散落在聊天记录、临时文档和运行时工具里，Agent 很难稳定接手上下文，人也很难判断当前项目到底处于什么阶段。</p>
          <p>知行工坊要解决的是一人公司在 AI 协作下的长期运转问题：让公司治理、项目实现、角色分工和知识沉淀有统一入口。</p>
        </Prose>
      </Section>

      <Section index="0 2" title="我的工作 ｜ What I Did" shaded accent={ACCENT}>
        <BulletList
          accent={ACCENT}
          items={[
            "设计并落地 MindSync Monorepo / 公司工作空间。",
            "建立 company、projects、agents、shared、knowledge-base 五层结构。",
            "建立项目注册表、公司蓝图、研发原则、任务状态流转规则和文档治理入口。",
            "将 AI 产品、研究、内容、求职材料等项目纳入统一工作区。",
            "基于 Paperclip、本地 Codex / Claude Code 和 artifact-based handoff，设计多角色 Agent 协作方式。",
            "将 spec、task、QA、delivery 等阶段产物纳入项目推进闭环。",
          ]}
        />
      </Section>

      <Section index="0 3" title="系统结构 ｜ 五层架构" accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "agents", body: "角色定义，回答谁负责做什么。" },
            { title: "company", body: "公司治理规则、注册表、蓝图和公司级入口。" },
            { title: "projects", body: "项目工作区、项目实现和项目级文档。" },
            { title: "shared", body: "共享脚本、模板和跨项目工具。" },
            { title: "company / knowledge-base", body: "长期复用知识沉淀。" },
          ]}
        />
      </Section>

      <Section index="0 4" title="任务流转 ｜ 从需求到交付" shaded accent={ACCENT}>
        <StepFlow
          accent={ACCENT}
          steps={[
            { title: "输入", note: "用户想法、项目问题、研究材料或业务判断。" },
            { title: "Framing", note: "判断任务属于产品、能力、品牌还是治理。" },
            { title: "Spec", note: "把模糊目标写成边界清楚的需求或问题定义。" },
            { title: "Task", note: "拆成可执行任务，明确 owner、状态和验收方式。" },
            { title: "Implementation", note: "在对应项目工作区内实现，不混入公司级文档。" },
            { title: "QA", note: "用验证记录确认是否满足目标。" },
            { title: "Delivery", note: "交付说明沉淀为后续角色可接手的 artifact。" },
            { title: "Knowledge", note: "长期有效的判断进入知识库。" },
          ]}
        />
      </Section>

      <Section index="0 5" title="关键设计选择 ｜ System Decisions" accent={ACCENT}>
        <DecisionTable
          accent={ACCENT}
          headers={["设计问题", "我的选择", "解决的问题"]}
          rows={[
            ["公司规则和项目实现放在哪里", "company 和 projects 分层", "避免公司治理和项目源码混在一起"],
            ["Agent 如何接手上下文", "每个项目有稳定入口文件", "减少重复解释和聊天依赖"],
            ["任务如何避免只停留在聊天里", "spec / task / QA / delivery artifact", "让工作过程可追踪、可复盘、可交接"],
            ["多项目如何保持边界", "项目注册表和项目工作区", "避免把品牌、产品、能力混为一谈"],
            ["知识如何复用", "knowledge-base 长期沉淀", "把一次性研究变成可调用资产"],
          ]}
        />
      </Section>

      <Section index="0 6" title="可视化证据 ｜ Artifact" shaded accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "Monorepo 五层结构图", body: "公司、项目、角色、共享、知识层的边界与连接。" },
            { title: "项目注册表", body: "所有在册项目的入口、负责人与状态。" },
            { title: "Agent 角色边界示意", body: "产品、研究、内容、工程、QA 等角色协作图。" },
            { title: "Spec / Task / QA / Delivery 流程卡", body: "阶段 artifact 在项目中的位置与流转。" },
            { title: "聊天 → artifact → knowledge", body: "对话沉淀为可复用知识的转化路径。" },
            { title: "多项目工作区地图", body: "AI 产品、研究、内容、求职等并行项目的全景。" },
          ]}
        />
      </Section>

      <Section index="0 7" title="当前结果与岗位相关性" accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "承载公司治理", body: "公司蓝图、研发原则、任务规范。" },
            { title: "承载项目推进", body: "AI 产品、研究中心、内容体系、求职材料。" },
            { title: "承载角色协作", body: "产品、研究、内容、工程、QA 等角色入口。" },
            { title: "承载知识沉淀", body: "把阶段性研究和实践结果转为长期知识。" },
          ]}
        />
        <div className="mt-8">
          <Prose>
            <p>这个项目证明我能把模糊的长期工作拆成系统结构、角色边界和可执行流程。</p>
            <p><span style={{ color: ACCENT }}>对应 AI 产品经理岗位 ｜ </span>体现信息架构、工作流产品思维、复杂系统拆解和工程协作理解。</p>
            <p><span style={{ color: ACCENT }}>对应 AI 转型咨询顾问岗位 ｜ </span>体现组织知识治理、AI 协作流程设计和从工具使用走向工作系统建设的能力。</p>
          </Prose>
        </div>
        <div className="mt-6">
          <Boundary accent={ACCENT}>
            不把它写成成熟商业化 SaaS、企业级多人平台或完全自动化公司。更稳妥的表达是：自用 AI 一人公司工作系统；Monorepo 实践；一人公司操作系统原型。
          </Boundary>
        </div>
      </Section>
    </PageShell>
  );
}
