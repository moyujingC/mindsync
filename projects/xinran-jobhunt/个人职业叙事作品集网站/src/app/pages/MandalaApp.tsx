import {
  PageShell,
  PageHero,
  Section,
  Prose,
  BulletList,
  StepFlow,
  ModuleGrid,
  EvidenceGallery,
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
        subtitle="手绘图像 AI 解读与个性化报告产品"
        oneLiner="一个面向用户手绘图像输入的 AI 解读 Web 产品。线上主链覆盖画作上传、画面结构标定、Lite 报告、报告内追问和历史记录；Pro 为内部预备形态。"
        role="创始人 / AI 产品负责人 / 独立开发推进者"
        period="2025 — 至今"
        tags={["AI 产品", "Web MVP", "多模态", "Prompt Pack", "质量门", "验收口径"]}
        accent={ACCENT}
      />

      <Section index="0 1" title="项目背景 ｜ 为什么做" accent={ACCENT}>
        <Prose>
          <p>曼陀罗绘画解读是一种高信任、非标准化、强依赖咨询师经验的服务。人工解读通常需要大量时间，且解读质量会受到咨询师经验、表达方式和当次状态影响。</p>
          <p>我在 100+ 小时一线服务实践中发现，产品难点在于把图像观察、领域知识、用户议题、表达边界和安全提醒组织成一条稳定的产品链路。</p>
          <p>这个项目的起点是一个真实问题：如何把原本偏人工、偏经验性的曼陀罗解读，转成一个用户可自助体验、结果可复用、边界可控制的 AI 产品。</p>
        </Prose>
      </Section>

      <Section index="0 2" title="我的工作 ｜ What I Did" shaded accent={ACCENT}>
        <BulletList
          accent={ACCENT}
          items={[
            "定义当前线上主路径：上传画作、画面结构标定、生成 Lite 报告、围绕当前报告继续追问、查看历史记录。",
            "设计 Lite / Pro 产品分层：Lite 为当前线上产品，Pro 为内部预备形态；以内测兑换码验证报告价值感、理解成本与后续付费路径。",
            "拆分报告生成链路：将视觉观察、领域知识、用户意图和输出规范分层处理；“视觉草稿 → 议题报告”两阶段链路已接入线上 API 主链。",
            "设计报告追问边界：将追问范围聚焦在本次画作和本次报告，把产品定位收束在自我探索与内容解读场景。",
            "建立需求、规格、任务、质检、验证和交付的可追踪协作流程，持续完善产品规范、报告契约、质量验收和问题复盘。",
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
            ["To C / To B / Studio 同时做", "当前聚焦 To C Web MVP", "先验证用户主路径和报告交付质量"],
            ["Lite 和 Pro 是否独立售卖", "Pro 只从 Lite 后升级", "让用户先获得低门槛体验，再决定是否深入"],
            ["报告是否直接一次生成", "拆成视觉基准和主题推理", "降低同一画作多次解读时的观察矛盾"],
            ["Avatar 是否长期陪伴", "只围绕本次画作和本次报告", "控制高信任场景的依赖和越界风险"],
            ["是否强调疗愈效果", "强调自我探索和参考性报告", "保持产品表达边界和交付责任边界"],
          ]}
        />
      </Section>

      <Section index="0 6" title="可视化证据 ｜ Artifact" shaded accent={ACCENT}>
        <div className="space-y-8">
          <EvidenceGallery
            accent={ACCENT}
            items={[
              {
                title: "启动页",
                src: "/works/mandala-app/01-landing.png",
                alt: "一镜一梳启动页截图",
                body: "启动页先给出产品气质、价值承诺和单一主按钮，让首次用户明确这是一款围绕曼陀罗解读展开的自我探索产品。",
              },
              {
                title: "方案选择",
                src: "/works/mandala-app/02-plan-comparison.png",
                alt: "一镜一梳 Lite 和 Pro 方案对比截图",
                body: "用 Lite / Pro 两档方案把价格、内容范围和升级路径说清楚，帮助用户先建立预期，再决定是否深入。",
              },
              {
                title: "上传画作",
                src: "/works/mandala-app/03-upload.png",
                alt: "一镜一梳上传画作截图",
                body: "上传页把三圈边界调整、当前议题选择、创作意图和创作感受放在同一主路径里，用产品交互组织图像证据和用户上下文。",
              },
              {
                title: "支付确认",
                src: "/works/mandala-app/04-payment.png",
                alt: "一镜一梳支付确认截图",
                body: "付款页承接 Lite 解读确认和最小支付动作，把版本、价格、适用场景和结果预期讲清楚，降低高信任场景中的商业动线干扰。",
              },
              {
                title: "解读中",
                src: "/works/mandala-app/05-loading.png",
                alt: "一镜一梳解读中截图",
                body: "解读中页面把进度、正在分析的步骤和知识提示展示出来，强化用户对生成过程的可见性，也降低等待时的不安感。",
              },
              {
                title: "Lite 报告",
                src: "/works/mandala-app/06-lite-report.png",
                alt: "一镜一梳 Lite 解读报告截图",
                body: "Lite 报告用分段结构呈现整体印象和核心看见，让首次体验用户快速获得可读、可回看的解读结果。",
              },
              {
                title: "历史记录",
                src: "/works/mandala-app/07-history.png",
                alt: "一镜一梳历史解读列表截图",
                body: "历史页展示已生成和待查看的解读记录，方便用户回看每次画作对应的结果，也让产品形成可复用的自我探索资产。",
              },
              {
                title: "解读详情",
                src: "/works/mandala-app/08-detail.png",
                alt: "一镜一梳解读详情截图",
                body: "详情页把当前状态、版本进度和 Lite / Pro 解读入口放在同一个页面里，帮助用户理解本次报告从初步解读到深入解读的路径。",
              },
            ]}
          />
          <ModuleGrid
            accent={ACCENT}
            modules={[
              { title: "主路径已落到页面层", body: "启动、上传、支付和历史页面已经形成真实可点开的产品路径。" },
              { title: "关键输入已结构化", body: "三圈边界、议题、创作意图和创作感受都已经在页面层承接。" },
              { title: "付费与回看都已闭环", body: "方案对比、付款确认、历史记录和筛选管理都已经在页面层打通。" },
            ]}
          />
        </div>
      </Section>

      <Section index="0 7" title="当前结果 ｜ Outcome" accent={ACCENT}>
        <ModuleGrid
          accent={ACCENT}
          modules={[
            { title: "线上产品", body: "当前 Web 版已覆盖上传、画面结构标定、Lite 报告、报告内追问和历史记录；以内测兑换码模式运行。" },
            { title: "质量验证", body: "以 11 个完整案例进行两类方案 A/B 对照，并用 5 组 Golden Case 做改动后的质量回归。" },
            { title: "边界设计", body: "RAG 共用解读引擎处于规格阶段；线上产品通过失败降级和追问安全拦截控制越界风险。" },
          ]}
        />
      </Section>

      <Section index="0 8" title="岗位相关性 ｜ Relevance & 边界" shaded accent={ACCENT}>
        <RoleFit
          accent={ACCENT}
          items={[
            { role: "AI 产品经理", fit: "证明我能从真实痛点定义 MVP、产品分层、用户路径、AI 输出质量和上线边界。" },
            { role: "AI 应用工程师", fit: "证明我能将模型调用、两段式生成、评测回归、失败降级和部署组织为可运行的 AI 应用。" },
            { role: "FDE / AI 解决方案工程师", fit: "证明我能把一线服务场景转成可验证 PoC、报告生成链路、质量门与交付边界。" },
          ]}
        />
        <div className="mt-6">
          <Boundary accent={ACCENT}>
            对外定位为曼陀罗绘画解读与自我探索 Web MVP，交付参考性结构化报告和后续建议；产品边界聚焦内容解读与自我探索，可与人工咨询配合。
          </Boundary>
        </div>
      </Section>
    </PageShell>
  );
}
