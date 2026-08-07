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
        title="AI 辅助研发与交付流程"
        subtitle="需求到验证的可追踪协作系统"
        oneLiner="将需求定义、方案拆解、实现、验证、交付与复盘组织为可追踪文档流，支持多个 AI 应用并行推进并减少 AI 协作中的上下文断裂。"
        role="系统设计者 / AI 协作流程推进者"
        period="2026 — 至今"
        tags={["SDD", "TDD", "Agent 协作", "质量门", "交付回写"]}
        accent={ACCENT}
      />

      <Section index="0 1" title="项目背景 ｜ 为什么做" accent={ACCENT}>
        <Prose>
          <p>当 AI 参与长期工作后，问题会从「怎么写一个 prompt」扩展到信息、任务、角色和项目如何持续保持可追踪。</p>
          <p>在多项目并行时，如果所有信息都散落在聊天记录、临时文档和运行时工具里，Agent 很难稳定接手上下文，人也很难判断当前项目到底处于什么阶段。</p>
          <p>这套流程解决的是 AI 协作下的长期研发问题：让项目、角色、知识、任务和验证记录有稳定入口，工作可以被复核和交接。</p>
        </Prose>
      </Section>

      <Section index="0 2" title="我的工作 ｜ What I Did" shaded accent={ACCENT}>
        <BulletList
          accent={ACCENT}
          items={[
            "设计并落地 Monorepo（单仓多项目工作区）与项目级入口，区分公司治理、项目实现、共享工具和知识资产。",
            "建立项目注册表、研发原则、任务状态流转规则和文档治理入口。",
            "将 AI 产品、研究、内容和求职材料纳入统一工作区，保证对象边界和上下文可追踪。",
            "基于 AI 编程助手与文档化交接，设计多角色协作方式。",
            "将 spec、task、QA、delivery 等阶段产物纳入项目推进闭环，保留质量检查、问题定位、验收口径和交付回写记录。",
          ]}
        />
      </Section>

      <Section index="0 3" title="真实案例 ｜ 从需求到交付的工作流" accent={ACCENT}>
        <div className="space-y-6">
          <StepFlow
            accent={ACCENT}
            steps={[
              { title: "需求与事实", note: "保留原始输入、约束、假设和可核验事实，避免后续实现脱离问题。" },
              { title: "方案与任务", note: "将产品决策、接口约束、实现任务和验收条件拆开记录。" },
              { title: "实现与验证", note: "以测试、质量门、人工检查和运行记录验证关键主张。" },
              { title: "交付与复盘", note: "将交付物、遗留风险、问题定位和后续行动回写到项目入口。" },
            ]}
          />
          <Prose>
            <p>这套系统的重点，是让不同阶段的产物有明确位置，并把问题、方案、实现和验证之间的关系保留下来。</p>
            <p>它减少了临时文件夹和一次性聊天上下文带来的断裂，也让后续项目可以复用已验证的质量标准和交付经验。</p>
          </Prose>
        </div>
      </Section>

      <Section index="0 4" title="系统结构 ｜ 五层架构" shaded accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "项目入口", body: "明确当前目标、事实来源、工作范围和交付入口。" },
            { title: "方案与任务", body: "记录关键决策、实现约束、任务拆解与验收条件。" },
            { title: "质量记录", body: "通过测试、质量门和人工检查保存验证依据。" },
            { title: "交付与复盘", body: "交付物、遗留风险、问题定位和后续行动持续回写。" },
          ]}
        />
      </Section>

      <Section index="0 5" title="关键设计选择 ｜ System Decisions" accent={ACCENT}>
        <DecisionTable
          accent={ACCENT}
          headers={["设计问题", "我的选择", "解决的问题"]}
          rows={[
            ["AI 如何接手上下文", "每个项目设置稳定入口与事实来源", "减少重复解释和上下文断裂"],
            ["任务如何进入闭环", "规格、任务、质量检查和交付记录分阶段沉淀", "让工作过程可追踪、可复盘、可交接"],
            ["AI 输出如何保持质量", "将验收条件、测试样例和人工检查前置", "避免只依赖一次生成结果"],
            ["多项目如何保持边界", "对象登记与项目级工作区", "区分项目、共享能力与公开材料"],
            ["经验如何复用", "将经验证的判断沉淀为知识与模板", "让下一次交付更快进入可执行状态"],
          ]}
        />
      </Section>

      <Section index="0 6" title="可核验物证 ｜ Artifact" shaded accent={ACCENT}>
        <DecisionTable
          accent={ACCENT}
          headers={["物证", "类型", "说明什么"]}
          rows={[
            ["项目入口", "结构化项目文档", "目标、事实来源、工作范围和交付入口可被持续追踪。"],
            ["规格与任务", "方案与实现记录", "关键决策、实现约束、任务拆解和验收条件可复核。"],
            ["质量门", "测试与人工检查", "关键链路的测试样例、检查项和问题定位依据可回看。"],
            ["交付记录", "交付与复盘文档", "保留交付物、遗留风险、后续行动和经验回写。"],
          ]}
        />
      </Section>

      <Section index="0 7" title="当前结果 ｜ 已形成什么能力" accent={ACCENT}>
        <div className="space-y-6">
          <ModuleGrid
            cols={2}
            accent={ACCENT}
            modules={[
              { title: "项目入口稳定", body: "项目目标、事实来源、当前范围和交付入口可被持续定位。"},
              { title: "协作上下文可交接", body: "角色、任务、约束和阶段产物进入可复用的交接结构。"},
              { title: "验证依据可回看", body: "测试、质量门、人工检查和问题定位不只留在一次对话中。"},
              { title: "经验能够回写", body: "完成的交付、遗留风险和复盘结论可进入下一轮实现和方案判断。"},
            ]}
          />
          <BulletList
            accent={ACCENT}
            items={[
              "支持从需求定义到交付复盘的连续工作流，而不是依赖零散聊天记录推进项目。",
              "支持在产品、工程、内容和研究等不同任务之间保持事实来源、约束和当前状态一致。",
              "支持将已验证的判断、质量要求和问题定位方法沉淀为下一次可复用的工作资产。",
            ]}
          />
        </div>
      </Section>

      <Section index="0 8" title="岗位相关性 ｜ Relevance & 边界" accent={ACCENT}>
        <RoleFit
          accent={ACCENT}
          items={[
            { role: "AI 产品经理", fit: "体现我能把复杂需求转成可推进的产品路径、任务与验收条件。" },
            { role: "AI 应用工程师", fit: "体现我能将测试、质量门、问题定位和交付回写纳入日常研发闭环。" },
            { role: "FDE / AI 解决方案工程师", fit: "体现我能将客户约束、方案边界、验证记录和交付物组织成可复核的协作过程。" },
          ]}
        />
        <div className="mt-6">
          <Boundary accent={ACCENT}>
            对外定位为自用的 AI 辅助研发与交付流程。它呈现项目入口、任务流转、质量记录、交付回写和问题复盘能力，不将内部工具或工作方式包装成独立商业产品。
          </Boundary>
        </div>
      </Section>
    </PageShell>
  );
}
