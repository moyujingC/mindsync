import {
  PageShell,
  PageHero,
  Section,
  Prose,
  BulletList,
  ModuleGrid,
  DecisionTable,
  Boundary,
  RoleFit,
} from "./_blocks";

const ACCENT = "#9B8AB8";

export default function HealingAIResearch() {
  return (
    <PageShell>
      <PageHero
        eyebrow="P R O J E C T &nbsp; 0 4"
        title="心理疗愈 AI 产品观察"
        subtitle="AI + 人文场景的产品分析与趋势洞察"
        oneLiner="围绕心理疗愈、陪伴、情绪支持和自我探索类 AI 产品，观察产品模式、技术路径、边界风险和落地机会。"
        role="独立研究员 / AI 产品观察者"
        period="2026 — 至今"
        tags={["产品分析", "AI + 人文", "竞品观察", "边界风险", "行业洞察"]}
        accent={ACCENT}
      />

      <Section index="0 1" title="项目背景 ｜ 为什么做" accent={ACCENT}>
        <Prose>
          <p>AI 进入心理疗愈和情绪支持场景后，机会和风险同时存在。一方面，AI 可以降低用户获得陪伴、解释和自我探索工具的门槛；另一方面，这类场景天然涉及高信任、高敏感和强边界问题。</p>
          <p>我关注这个方向，是为了理解哪些体验适合产品化，哪些环节需要保留人工判断、交互边界和安全提醒。</p>
        </Prose>
      </Section>

      <Section index="0 2" title="我的工作 ｜ What I Did" shaded accent={ACCENT}>
        <BulletList
          accent={ACCENT}
          items={[
            "观察国内外心理疗愈、情绪陪伴、自我探索和 AI 助手类产品。",
            "分析不同产品在用户入口、交互方式、人格设定、记忆能力、付费模式和安全边界上的取舍。",
            "将观察结果反向用于一镜一梳的产品边界设计，尤其是报告追问、avatar persona 和安全协议。",
            "区分 AI 可以承担的陪读、解释、整理、引导功能，以及需要人工和专业服务承接的高风险环节。",
          ]}
        />
      </Section>

      <Section index="0 3" title="分析框架 ｜ 四维观察" accent={ACCENT}>
        <ModuleGrid
          cols={4}
          accent={ACCENT}
          modules={[
            { title: "用户场景", body: "情绪陪伴、自我探索、报告解读、日常记录、长期关系。" },
            { title: "产品形态", body: "聊天式、报告式、测评式、课程式、人工服务结合式。" },
            { title: "技术路径", body: "大模型对话、多模态识别、知识库、长期记忆、Agent 工作流。" },
            { title: "边界风险", body: "医疗化表达、依赖风险、过度拟人、错误建议、隐私与安全。" },
          ]}
        />
      </Section>

      <Section index="0 4" title="典型模式 ｜ Market Patterns" shaded accent={ACCENT}>
        <DecisionTable
          accent={ACCENT}
          headers={["产品模式", "用户价值", "风险点", "对一镜一梳的启发"]}
          rows={[
            ["聊天陪伴型", "降低表达门槛，提供即时回应", "依赖风险、过度拟人、边界模糊", "曼曼定位为当前报告陪读"],
            ["报告解读型", "把复杂信息整理为用户能理解的内容", "泛化、模板化、过度解释", "报告必须回到视觉证据和本次画作"],
            ["自我记录型", "帮用户持续观察状态", "长期记忆和隐私风险", "当前聚焦单次画作和报告资产"],
            ["人工服务结合型", "AI 提效，人工兜底高风险部分", "责任边界和交接机制复杂", "产品表达为辅助理解与报告陪读"],
          ]}
        />
      </Section>

      <Section index="0 5" title="关键判断 ｜ Product Judgement" accent={ACCENT}>
        <BulletList
          accent={ACCENT}
          items={[
            "AI 适合做信息整理、报告陪读、低风险解释和初步引导。",
            "诊断、治疗、危机干预和重大人生决策建议应由人工与专业服务承接。",
            "Persona 可以改善体验，同时需要事实观察、安全协议和质量门共同支撑。",
            "高信任场景的产品力同时来自生成效果、边界设计和责任口径。",
            "人文类 AI 产品需要把体验吸引力和交付克制放在同一套产品判断里。",
          ]}
        />
      </Section>

      <Section index="0 6" title="观察如何反哺项目 ｜ Research to Product" shaded accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "长期陪伴 → 边界模糊", body: "因此曼曼 avatar 被定义为当前报告陪读。" },
            { title: "报告类产品 → 容易泛化", body: "因此一镜一梳要求报告保留视觉证据和三圈带读。" },
            { title: "心理疗愈 → 易医疗化表达", body: "因此产品口径固定为自我探索和参考性报告。" },
          ]}
        />
      </Section>

      <Section index="0 7" title="当前结果与岗位相关性" accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "分析框架", body: "形成用户场景、产品形态、技术路径、边界风险四维框架。" },
            { title: "产品决策", body: "反哺一镜一梳的报告追问、avatar persona 和安全边界。" },
            { title: "岗位能力", body: "体现 AI 产品经理需要的行业洞察、竞品分析和风险判断。" },
          ]}
        />
        <div className="mt-8">
          <RoleFit
            accent={ACCENT}
            items={[
              { role: "AI 产品经理", fit: "体现用户场景分析、竞品拆解、产品边界设计和风险意识。" },
              { role: "AI 应用工程师", fit: "体现对模型输出、交互边界和风险控制的工程判断能力。" },
              { role: "FDE / AI 解决方案工程师", fit: "体现我能在方案落地前识别高风险边界，定义 AI 适合承担的环节、人工判断边界和交付责任口径。" },
            ]}
          />
        </div>
        <div className="mt-6">
          <Boundary accent={ACCENT}>
            对外定位为持续观察心理疗愈与情绪支持类 AI 产品，重点分析产品模式、交互边界和安全风险，并将观察用于自有产品设计。
          </Boundary>
        </div>
      </Section>
    </PageShell>
  );
}
