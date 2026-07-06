import {
  PageShell,
  PageHero,
  Section,
  Prose,
  BulletList,
  StepFlow,
  ModuleGrid,
  Boundary,
  RoleFit,
} from "./_blocks";

const ACCENT = "#6FA8A0";

export default function HealingKB() {
  return (
    <PageShell>
      <PageHero
        eyebrow="P R O J E C T &nbsp; 0 3"
        title="曼陀罗疗愈知识库"
        subtitle="从一线解读经验沉淀出的结构化知识体系"
        oneLiner="围绕曼陀罗绘画解读场景，将三圈结构、五行对应、颜色与主题观察、解读边界和报告表达沉淀为可复用的知识层，作为 RAG 思路下的产品知识底座。"
        role="体系构建者 / 内容结构化负责人"
        period="2025 — 至今"
        tags={["知识工程", "RAG 思路", "结构化梳理", "AI 知识层", "报告标准"]}
        accent={ACCENT}
      />

      <Section index="0 1" title="项目背景 ｜ 为什么做" accent={ACCENT}>
        <Prose>
          <p>AI 曼陀罗产品不能只依赖大模型的通用理解。曼陀罗解读涉及颜色、结构、象征、用户议题和表达方式，如果没有稳定知识层，报告就容易变得泛泛、跳跃或缺乏流派感。</p>
          <p>知识库的作用，是把一线个案经验、学习材料和产品输出要求整理成可被产品复用的结构。它不是成熟商业 RAG 系统，但承担的是类似知识底座的职责：让 AI 报告不只是「生成一段文案」，而是遵循明确的观察路径和表达边界。</p>
        </Prose>
      </Section>

      <Section index="0 2" title="我的工作 ｜ What I Did" shaded accent={ACCENT}>
        <BulletList
          accent={ACCENT}
          items={[
            "将曼陀罗解读中的三圈结构、五行理论、颜色观察和主题表达整理为产品可用的知识模块。",
            "从人工解读经验中提炼常见观察维度，服务 Lite / Pro 报告生成。",
            "设计报告输出规范，帮助 AI 在观察、解释、建议和边界提醒之间保持稳定结构。",
            "配合 prompt pack、RAG 思路和质量门，把知识层纳入报告生成链路。",
            "保持疗愈表达边界，避免把自我探索报告写成心理诊断或确定性判断。",
          ]}
        />
      </Section>

      <Section index="0 3" title="知识结构 ｜ 五大知识模块" accent={ACCENT}>
        <ModuleGrid
          cols={3}
          accent={ACCENT}
          modules={[
            { title: "三圈结构", body: "外圈、中圈、内圈分别承载不同观察层次。" },
            { title: "五行对应", body: "用东方五行理论提供颜色和主题的解释框架。" },
            { title: "视觉证据", body: "颜色、面积、位置、密度、边界和重复元素。" },
            { title: "主题表达", body: "把观察转成用户能理解的语言，而不是直接下判断。" },
            { title: "安全边界", body: "避免诊断化、绝对化、恐吓式或过度承诺表达。" },
          ]}
        />
      </Section>

      <Section index="0 4" title="知识层如何进入产品 ｜ Workflow" shaded accent={ACCENT}>
        <StepFlow
          accent={ACCENT}
          steps={[
            { title: "用户上传画作", note: "并补充必要描述" },
            { title: "形成视觉基准", note: "系统建立可复用的画面观察底层" },
            { title: "调用知识模块", note: "报告生成阶段引入相关知识层" },
            { title: "输出分层报告", note: "形成 Lite / Pro 分层结构" },
            { title: "质量门检查", note: "校验越界、视觉证据与三圈带读逻辑" },
          ]}
        />
      </Section>

      <Section index="0 5" title="从经验到知识层 ｜ Method" accent={ACCENT}>
        <ModuleGrid
          cols={4}
          accent={ACCENT}
          modules={[
            { title: "记录", body: "保留人工解读中的常见观察维度和表达方式。" },
            { title: "抽象", body: "把个案语言拆成结构、颜色、主题、建议和边界。" },
            { title: "标准化", body: "形成报告章节、字段和输出规范。" },
            { title: "接入", body: "把知识模块放入 prompt pack 和质量门。" },
          ]}
        />
      </Section>

      <Section index="0 6" title="报告质量标准 ｜ Output Standard" shaded accent={ACCENT}>
        <BulletList
          accent={ACCENT}
          items={[
            "有视觉证据：不是空泛判断，要能回到画面中的颜色、结构和位置。",
            "有陪读感：像带用户读懂自己的画，而不是冷冰冰检测结果。",
            "有结构：从观察到解释，再到建议和提醒。",
            "有边界：避免医疗诊断、心理治疗承诺和决定性建议。",
            "可复用：同一套结构能支持 Lite / Pro 分层报告。",
          ]}
        />
      </Section>

      <Section index="0 7" title="当前结果与岗位相关性" accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "内容层", body: "形成可复用的曼陀罗解读知识模块。" },
            { title: "产品层", body: "支撑 Lite / Pro 报告结构和用户理解路径。" },
            { title: "工程层", body: "进入 prompt pack、RAG 思路、报告契约和质量门，而不是停留在散文资料。" },
          ]}
        />
        <div className="mt-8">
          <RoleFit
            accent={ACCENT}
            items={[
              { role: "AI 产品经理", fit: "体现领域知识建模、AI 输出规范设计和高信任场景的质量控制能力。" },
              { role: "AI 转型咨询顾问", fit: "体现把专家经验沉淀成 SOP、知识库和可复用工作流的能力。" },
              { role: "FDE", fit: "体现我能把专家经验转成系统可调用的知识层、输出契约和质量检查规则。" },
            ]}
          />
        </div>
        <div className="mt-6">
          <Boundary accent={ACCENT}>
            不把它写成医学知识库、心理诊断库或成熟商业知识图谱。更稳妥的表达是：曼陀罗绘画解读场景下的结构化知识层，用于辅助生成参考性自我探索报告。
          </Boundary>
        </div>
      </Section>
    </PageShell>
  );
}
