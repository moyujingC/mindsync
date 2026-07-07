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
  RoleFit,
} from "./_blocks";

const ACCENT = "#2C3E50";

export default function Monorepo() {
  return (
    <PageShell>
      <PageHero
        eyebrow="P R O J E C T &nbsp; 0 2"
        title="知行工坊"
        subtitle="AI 一人公司 Monorepo / 公司工作空间"
        oneLiner="一个自用中的 AI 一人公司工作系统原型：把公司治理、项目入口、角色定义、知识库、共享工具、质量记录和阶段 artifact 收束到同一仓库，减少长期协作对聊天记录的依赖。"
        role="系统设计者 / 一人公司工作空间搭建者 / Agent 协作机制推进者"
        period="2026 — 至今"
        tags={["Monorepo", "Agent 协作", "Docs As System", "知识治理", "交付回写"]}
        accent={ACCENT}
      />

      <Section index="0 1" title="项目背景 ｜ 为什么做" accent={ACCENT}>
        <Prose>
          <p>当 AI 参与长期工作后，问题会从「怎么写一个 prompt」扩展到信息、任务、角色和项目如何持续保持可追踪。</p>
          <p>在多项目并行时，如果所有信息都散落在聊天记录、临时文档和运行时工具里，Agent 很难稳定接手上下文，人也很难判断当前项目到底处于什么阶段。</p>
          <p>知行工坊要解决的是一人公司在 AI 协作下的长期运转问题：让公司治理、项目实现、角色分工和知识沉淀有统一入口。</p>
        </Prose>
      </Section>

      <Section index="0 2" title="我的工作 ｜ What I Did" shaded accent={ACCENT}>
        <BulletList
          accent={ACCENT}
          items={[
            "设计并落地 MindSync（知行工坊）Monorepo / 公司工作空间。",
            "建立 company、projects、agents、shared、knowledge-base 五层结构。",
            "建立项目注册表、公司蓝图、研发原则、任务状态流转规则和文档治理入口。",
            "将 AI 产品、研究、内容、求职材料等项目纳入统一工作区。",
            "基于 Paperclip、本地 Codex / Claude Code 和 artifact-based handoff，设计多角色 Agent 协作方式。",
            "将 spec、task、QA、delivery 等阶段产物纳入项目推进闭环，保留质量检查、问题定位和交付回写记录。",
          ]}
        />
      </Section>

      <Section index="0 3" title="真实案例 ｜ 研究母库如何和项目研究衔接" accent={ACCENT}>
        <div className="space-y-6">
          <StepFlow
            accent={ACCENT}
            steps={[
              { title: "研究项目区", note: "心理疗愈 app 研究先留在 projects/research-center/research/，允许保留原始报告和过程材料。" },
              { title: "研究母库", note: "从项目研究中抽取长期可复用判断，进入 projects/research-center/kb/ 这一层。" },
              { title: "主题分流", note: "AI 产品方法进入 kb/wiki/ai；可核验心理学方法才谨慎进入 kb/wiki/healing。" },
              { title: "产品化知识库", note: "已经明确服务 Aimandala 的知识，再进入 projects/aimandala/docs/疗愈体系知识库/。" },
              { title: "公司级知识库", note: "只有跨项目、跨角色、边界清楚的稳定知识，才晋升到 company/knowledge-base/。" },
              { title: "对外发布", note: "适合公开表达的部分，再转去网站、内容矩阵或作品集，原始研究材料保留在内部研究区。" },
            ]}
          />
          <Prose>
            <p>这套系统的关键，是明确不同产物应该去哪里，并让研究、知识、产品和内容之间形成可追踪的中间层。</p>
            <p>我在 2026-06-08 新补的《研究母库与项目研究衔接说明》中，把这条链路正式写清了：研究项目区保留过程材料；研究母库沉淀长期判断；产品化知识库只接收已经能服务产品链路的知识；公司级知识库只保留成熟稳定的跨项目资产。</p>
            <p>知行工坊把研究、知识、产品和内容之间的分工写成结构化规则，减少对临时文件夹和单次聊天上下文的依赖。</p>
          </Prose>
        </div>
      </Section>

      <Section index="0 4" title="系统结构 ｜ 五层架构" shaded accent={ACCENT}>
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

      <Section index="0 5" title="关键设计选择 ｜ System Decisions" accent={ACCENT}>
        <DecisionTable
          accent={ACCENT}
          headers={["设计问题", "我的选择", "解决的问题"]}
          rows={[
            ["公司规则和项目实现放在哪里", "company 和 projects 分层", "区分公司治理和项目源码边界"],
            ["Agent 如何接手上下文", "每个项目有稳定入口文件", "减少重复解释和聊天依赖"],
            ["任务如何进入长期闭环", "spec / task / QA / delivery artifact", "让工作过程可追踪、可复盘、可交接"],
            ["多项目如何保持边界", "项目注册表和项目工作区", "区分品牌、产品、能力和项目对象"],
            ["知识如何复用", "knowledge-base 长期沉淀", "把一次性研究变成可调用资产"],
          ]}
        />
      </Section>

      <Section index="0 6" title="真实物证 ｜ Artifact" shaded accent={ACCENT}>
        <DecisionTable
          accent={ACCENT}
          headers={["真实物证", "仓库位置", "说明什么"]}
          rows={[
            ["项目注册表", "company/项目注册表.yaml", "公司对象有唯一权威清单；当前登记 8 个对象。"],
            ["公司蓝图", "company/公司蓝图.md", "公司定义、对象类型、角色哲学和长期原则有稳定落点。"],
            ["任务审阅规范", "company/任务审阅与状态流转规范.md", "任务 review 有明确状态流转规则。"],
            ["角色入口", "agents/*/AGENTS.md", "当前独立维护 10 个核心角色入口，明确谁负责什么。"],
            ["研究母库衔接文档", "projects/research-center/kb/研究母库与项目研究衔接说明.md", "明确写清 research、kb、产品化知识库和公司级知识库四层分工。"],
            ["研究中心双入口", "company/projects/研究中心/PROJECT.md + projects/research-center/PROJECT.md", "公司级说明和项目级工作区明确分层。"],
            ["研究母库目录", "projects/research-center/kb/", "研究母库是一层正式工作区，包含 README、模板、规则和主题知识。"],
          ]}
        />
      </Section>

      <Section index="0 7" title="当前结果 ｜ 目前已经跑起来什么" accent={ACCENT}>
        <div className="space-y-6">
          <ModuleGrid
            cols={2}
            accent={ACCENT}
            modules={[
              { title: "8 个公司对象已统一登记", body: "产品、能力和品牌对象都已经进入 company/项目注册表.yaml，形成稳定登记口径。"},
              { title: "10 个核心角色入口已独立维护", body: "CEO、产品、研究、架构、工程、QA、内容等角色有各自 AGENTS.md。"},
              { title: "8 个主工作区已进入 projects", body: "研究、内容、求职、产品和共享能力底座都在同一仓库内并行推进。"},
              { title: "知识分流规则已正式成文", body: "研究区、研究母库、产品化知识库、公司级知识库之间的边界已正式成文。"},
            ]}
          />
          <BulletList
            accent={ACCENT}
            items={[
              "它已经承载公司治理：公司蓝图、研发原则、任务规范、对象注册表都有正式入口。",
              "它已经承载项目推进：一镜一梳、研究中心、内容矩阵、馨冉求职等工作进入统一项目入口。",
              "它已经承载角色协作：当任务需要换角色时，有明确入口和上下文交接材料。",
              "它已经承载知识沉淀：研究与交付可以继续回写成长期资产。",
            ]}
          />
        </div>
      </Section>

      <Section index="0 8" title="岗位相关性 ｜ Relevance & 边界" accent={ACCENT}>
        <RoleFit
          accent={ACCENT}
          items={[
            { role: "AI 产品经理", fit: "体现信息架构、工作流产品思维、复杂系统拆解和工程协作理解。" },
            { role: "AI 转型咨询顾问", fit: "体现组织知识治理、AI 协作流程设计和从工具使用走向工作系统建设的能力。" },
            { role: "FDE", fit: "体现我能为复杂客户场景搭建 Agent 协作、项目入口、质量记录、交付 artifact、问题排查和复盘回写系统。" },
          ]}
        />
        <div className="mt-6">
          <Boundary accent={ACCENT}>
            对外定位为自用 AI 一人公司工作系统、Monorepo 实践和一人公司操作系统原型；重点呈现项目入口、知识治理、任务流转、质量记录和交付回写能力。
          </Boundary>
        </div>
      </Section>
    </PageShell>
  );
}
