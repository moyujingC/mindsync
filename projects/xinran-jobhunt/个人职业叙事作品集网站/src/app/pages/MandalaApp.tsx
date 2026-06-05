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

const ACCENT = "#8B5A2B";

export default function MandalaApp() {
  return (
    <PageShell>
      <PageHero
        eyebrow="P R O J E C T &nbsp; 0 1"
        title="一镜一梳"
        subtitle="曼陀罗绘画 AI 解读与自我探索产品"
        oneLiner="一个面向 To C 用户的曼陀罗绘画上传与 AI 解读 Web MVP，围绕画作上传、三圈识别、Lite / Pro 报告、付费升级和报告追问构建最小产品闭环。"
        role="创始人 / AI 产品负责人 / 独立开发推进者"
        period="2025 — 至今"
        tags={["AI 产品", "Web MVP", "多模态", "Prompt Pack", "质量门", "报告追问"]}
        accent={ACCENT}
      />

      <Section index="0 1" title="项目背景 ｜ 为什么做" accent={ACCENT}>
        <Prose>
          <p>曼陀罗绘画解读是一种高信任、非标准化、强依赖咨询师经验的服务。人工解读通常需要大量时间，且解读质量会受到咨询师经验、表达方式和当次状态影响。</p>
          <p>我在一线疗愈学习与个案实践中发现，真正难的不是让 AI「看懂一张图」，而是把图像观察、领域知识、用户议题、表达边界和安全提醒组织成一条稳定的产品链路。</p>
          <p>这个项目的起点是一个真实问题：如何把原本偏人工、偏经验性的曼陀罗解读，转成一个用户可自助体验、结果可复用、边界可控制的 AI 产品。</p>
        </Prose>
      </Section>

      <Section index="0 2" title="我的工作 ｜ What I Did" shaded accent={ACCENT}>
        <BulletList
          accent={ACCENT}
          items={[
            "定义 To C Web MVP 主路径：上传画作、补充必要描述、生成 Lite 报告、从 Lite 升级 Pro、查看 Pro 内容、围绕当前报告继续追问、查看历史记录。",
            "设计 Lite / Pro 产品分层：Lite 面向首次体验用户，Pro 从 Lite 后升级，不提供独立购买入口。",
            "拆分报告生成链路：将视觉观察、领域知识、用户意图和输出规范分层处理，避免报告变成简单的「看图说话」。",
            "设计报告追问边界：追问只围绕本次画作和本次报告，不做长期陪伴，不做心理咨询，不替代医疗或人生决策。",
            "将产品迁入 MindSync Monorepo 正式工作区，持续完善项目入口、产品规范、知识层、报告契约和交付文档。",
          ]}
        />
      </Section>

      <Section index="0 3" title="用户路径 ｜ 七步主路径" accent={ACCENT}>
        <StepFlow
          accent={ACCENT}
          steps={[
            { title: "进入手机端 Web 产品", note: "降低首次体验门槛" },
            { title: "上传曼陀罗图片", note: "无登录即可开始" },
            { title: "补充少量必要描述", note: "补齐图像无法直接判断的主观信息" },
            { title: "生成一镜 Lite 报告", note: "先给用户一个低门槛反馈" },
            { title: "从 Lite 入口升级一梳 Pro", note: "只在用户已看到价值后再升级" },
            { title: "查看 Pro 报告内容", note: "结构化深度解读" },
            { title: "向曼曼围绕报告继续追问", note: "陪读，不扩展成长期咨询关系" },
            { title: "查看历史记录", note: "形成可复用的自我探索资产" },
          ]}
        />
      </Section>

      <Section index="0 4" title="AI 工作流 ｜ 两段式报告生成" shaded accent={ACCENT}>
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          <ModuleGrid
            cols={2}
            accent={ACCENT}
            modules={[
              { title: "Vision Pass", body: "基于用户原画作、三圈标记图和基础知识包，生成可复用的视觉基准。" },
              { title: "Reasoning Pass", body: "基于视觉基准、主题 prompt pack、输出规范和用户意图，生成 Lite / Pro 报告。" },
            ]}
          />
        </div>
        <Prose>
          <p className="text-[#8B5A2B]" style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem" }}>这套设计解决三个问题：</p>
          <ul className="space-y-2 pl-5 list-disc">
            <li>同一幅画先形成统一视觉基准，减少不同报告之间的观察矛盾。</li>
            <li>视觉观察与主题推理分层，方便未来复用同一画作生成不同议题报告。</li>
            <li>通过输出规范和质量门控制越界表达，保留报告的陪读感和流派感。</li>
          </ul>
        </Prose>
      </Section>

      <Section index="0 5" title="关键取舍 ｜ Product Decisions" accent={ACCENT}>
        <DecisionTable
          accent={ACCENT}
          headers={["取舍点", "我的选择", "原因"]}
          rows={[
            ["To C / To B / Studio 同时做", "当前只聚焦 To C Web MVP", "先验证用户主路径，避免产品线发散"],
            ["Lite 和 Pro 是否独立售卖", "Pro 只从 Lite 后升级", "让用户先获得低门槛体验，再决定是否深入"],
            ["报告是否直接一次生成", "拆成视觉基准和主题推理", "降低同一画作多次解读时的观察矛盾"],
            ["Avatar 是否长期陪伴", "只围绕本次画作和本次报告", "控制高信任场景的依赖和越界风险"],
            ["是否强调疗愈效果", "强调自我探索和参考性报告", "避免医疗化、诊断化表达"],
          ]}
        />
      </Section>

      <Section index="0 6" title="可视化证据 ｜ Artifact" shaded accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "To C MVP 用户路径图", body: "从上传到追问的 8 步主路径与设计意图。" },
            { title: "Lite / Pro 产品分层图", body: "明确分层关系与付费升级动线。" },
            { title: "Vision / Reasoning 工作流图", body: "两段式报告生成链路结构。" },
            { title: "报告追问边界说明", body: "围绕本次画作与报告范围的对话契约。" },
            { title: "Prompt Pack 结构示意", body: "主题、知识、规范的分层组织方式。" },
            { title: "质量门检查清单", body: "对越界表达、医疗化与无证据判断的拦截规则。" },
          ]}
        />
      </Section>

      <Section index="0 7" title="当前结果 ｜ Outcome" accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "产品结果", body: "To C MVP 主路径、Lite / Pro 分层、报告追问入口已形成完整闭环。" },
            { title: "系统结果", body: "两段式报告生成链路、prompt pack、质量门已沉淀为可复用资产。" },
            { title: "治理结果", body: "项目进入 MindSync Monorepo，有项目入口、规范和后续迭代路径。" },
          ]}
        />
      </Section>

      <Section index="0 8" title="岗位相关性 ｜ Relevance & 边界" shaded accent={ACCENT}>
        <RoleFit
          accent={ACCENT}
          items={[
            { role: "AI 产品经理", fit: "证明我能从真实痛点定义 MVP、产品分层、用户路径、AI 输出质量和上线边界。" },
            { role: "AI 转型咨询顾问", fit: "证明我能把高信任、非标准化的一线服务拆成可复用的 AI 工作流。" },
            { role: "FDE", fit: "证明我能把业务场景转成可验证 PoC、报告生成链路、质量门和后续迭代入口。" },
          ]}
        />
        <div className="mt-6">
          <Boundary accent={ACCENT}>
            不把它写成心理治疗工具、医疗诊断产品或成熟商业化平台。更稳妥的表达是：曼陀罗绘画解读与自我探索 Web MVP；提供参考性结构化报告和后续建议，可与人工咨询配合，但不替代专业医疗和心理治疗。
          </Boundary>
        </div>
      </Section>
    </PageShell>
  );
}
