import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const out = resolve(root, "public/xinran-portfolio.pdf");
const tmpDir = resolve(root, ".tmp");
const htmlPath = resolve(tmpDir, "xinran-portfolio.html");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function asset(path) {
  return pathToFileURL(resolve(root, "public", path)).href;
}

const html = String.raw`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>崔兴｜AI 产品与解决方案作品集</title>
  <style>
    @page { size: A4; margin: 15mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #253746;
      background: #f9f7f3;
      font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", sans-serif;
      font-size: 10.5pt;
      line-height: 1.62;
    }
    h1, h2, h3 {
      margin: 0;
      font-family: "Noto Serif SC", "Songti SC", serif;
      font-weight: 520;
      color: #243746;
    }
    h1 { font-size: 28pt; line-height: 1.25; letter-spacing: 0.02em; }
    h2 { font-size: 18pt; margin-bottom: 9mm; }
    h3 { font-size: 12.5pt; margin-bottom: 3mm; }
    p { margin: 0 0 4mm; }
    .page { page-break-after: always; min-height: 267mm; position: relative; }
    .page:last-child { page-break-after: auto; }
    .eyebrow {
      color: #8b5a2b;
      letter-spacing: 0.26em;
      text-transform: uppercase;
      font-size: 8pt;
      margin-bottom: 8mm;
    }
    .cover {
      min-height: 267mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 6mm 0;
    }
    .cover-line { width: 28mm; height: 1px; background: #8b5a2b; margin: 9mm 0; }
    .subtitle { font-size: 12pt; color: rgba(37,55,70,.72); max-width: 165mm; }
    .meta-grid, .grid-2, .grid-3 { display: grid; gap: 5mm; }
    .meta-grid { grid-template-columns: repeat(3, 1fr); margin-top: 13mm; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .card {
      background: rgba(255,255,255,.72);
      border: 1px solid rgba(139,90,43,.18);
      padding: 5mm;
      break-inside: avoid;
    }
    .card strong { color: #8b5a2b; font-weight: 600; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 2mm; margin-top: 4mm; }
    .tag {
      border: 1px solid rgba(139,90,43,.32);
      color: #8b5a2b;
      padding: 1.2mm 2.4mm;
      font-size: 8pt;
      letter-spacing: .06em;
    }
    ul { margin: 0; padding-left: 4.5mm; }
    li { margin-bottom: 2mm; }
    .section-title {
      display: flex;
      align-items: center;
      gap: 4mm;
      margin-bottom: 8mm;
    }
    .section-title::before { content: ""; width: 12mm; height: 1px; background: #8b5a2b; }
    .project {
      display: grid;
      grid-template-columns: 43mm 1fr;
      gap: 6mm;
      padding: 5mm 0;
      border-top: 1px solid rgba(139,90,43,.18);
      break-inside: avoid;
    }
    .project:first-of-type { border-top: 0; }
    .project-index {
      color: #8b5a2b;
      font-size: 8pt;
      letter-spacing: .24em;
      margin-bottom: 3mm;
    }
    .image-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 3mm;
      margin-top: 5mm;
    }
    .image-strip img {
      width: 100%;
      border: 1px solid rgba(139,90,43,.18);
      background: #fff;
    }
    .muted { color: rgba(37,55,70,.65); }
    .footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      color: rgba(37,55,70,.46);
      font-size: 8pt;
      border-top: 1px solid rgba(139,90,43,.12);
      padding-top: 3mm;
    }
  </style>
</head>
<body>
  <section class="page cover">
    <div>
      <div class="eyebrow">AI PRODUCT · FDE · SOLUTION DELIVERY</div>
      <h1>崔兴｜AI 产品与解决方案作品集</h1>
      <div class="cover-line"></div>
      <p class="subtitle">技术研发、复杂服务咨询、创业实践和 AI 应用交付交叉背景。当前主投 FDE（驻场交付工程师）/ AI 解决方案工程师，并定向匹配 AI 产品经理与 AI 应用工程师岗位。</p>
      <div class="meta-grid">
        <div class="card"><strong>核心定位</strong><br/>从真实业务场景识别问题、约束与风险，并将其落成可运行、可评测、可交付的 AI 应用与方案。</div>
        <div class="card"><strong>当前城市</strong><br/>上海｜离职，随时到岗｜可沟通 FDE、AI 解决方案、AI 产品与 AI 应用工程方向。</div>
        <div class="card"><strong>在线作品集</strong><br/>https://xinran.jingshu.cc<br/>完整履历见 online-resume-full.pdf</div>
      </div>
    </div>
    <div>
      <div class="tag-row">
        <span class="tag">AI 产品</span><span class="tag">PoC / MVP</span><span class="tag">模型评测</span><span class="tag">Golden Case</span>
        <span class="tag">安全边界</span><span class="tag">质量门</span><span class="tag">FDE</span><span class="tag">工程交付</span>
      </div>
    </div>
    <div class="footer"><span>崔兴｜作品集 PDF</span><span>2026.07</span></div>
  </section>

  <section class="page">
    <div class="section-title"><h2>能力地图</h2></div>
    <div class="grid-2">
      <div class="card"><h3>AI 产品定义</h3><ul><li>从真实痛点出发定义用户路径、MVP / PoC 范围和产品边界。</li><li>输出 BRD / PRD、原型、Prompt Pack、输出契约和评测口径。</li><li>关注 Agent Loop、反馈闭环、质量门和持续迭代。</li></ul></div>
      <div class="card"><h3>FDE / 解决方案落地</h3><ul><li>把客户场景拆成可验证 PoC、数据与权限边界、日志 / 人审 / 回滚机制。</li><li>能在业务方、交付方和技术实现方之间做需求翻译。</li><li>将需求沟通、流程诊断、试点建议和交付材料组织成闭环。</li></ul></div>
      <div class="card"><h3>AI 应用工程</h3><ul><li>两段式生成链路、模型评测、Golden Case 回归与失败降级。</li><li>Python / FastAPI、React / Vite、API 联调、私有存储与公网部署。</li><li>通过测试、代码审查、CI 协作和运行检查保持质量可追溯。</li></ul></div>
      <div class="card"><h3>工程与系统底座</h3><ul><li>C++ / Python / React / Git / 云服务器部署 / Nginx / HTTPS 基础。</li><li>长期工程交付、跨模块协作和复杂系统拆解经验。</li><li>用 Monorepo、artifact、QA、delivery 让 AI 协作可追踪。</li></ul></div>
    </div>
    <div class="footer"><span>能力地图</span><span>01</span></div>
  </section>

  <section class="page">
    <div class="section-title"><h2>代表项目</h2></div>
    <div class="project">
      <div><div class="project-index">PROJECT 01</div><h3>一镜一梳</h3><p class="muted">曼陀罗绘画 AI 解读应用｜2025 至今</p></div>
      <div>
        <p>面向用户手绘图像输入的 AI 解读 Web 产品。当前线上主链覆盖画作上传、画面结构标定、Lite 报告、报告内追问和历史记录；Pro 为内部预备形态，产品以内测兑换码模式运行。</p>
        <ul><li>从 100+ 小时一线服务痛点出发，拆出用户主路径、产品边界和 MVP 范围。</li><li>已将“视觉草稿 → 议题报告”两段式报告生成链路接入线上 API 主链。</li><li>以 11 个完整案例进行两类方案 A/B 对照，并用 5 组 Golden Case 做质量回归。</li><li>通过失败降级、追问安全拦截、私有存储与签名 URL 控制高信任场景风险。</li></ul>
        <div class="tag-row"><span class="tag">AI 产品</span><span class="tag">多模态</span><span class="tag">Prompt Pack</span><span class="tag">质量门</span><span class="tag">Web MVP</span></div>
        <div class="image-strip">
          <img src="${asset("works/mandala-app/01-landing.png")}" />
          <img src="${asset("works/mandala-app/03-upload.png")}" />
          <img src="${asset("works/mandala-app/06-lite-report.png")}" />
          <img src="${asset("works/mandala-app/07-history.png")}" />
        </div>
      </div>
    </div>
    <div class="project">
      <div><div class="project-index">PROJECT 02</div><h3>AI 辅助研发与交付流程</h3><p class="muted">需求到验证的可追踪协作系统｜2026 至今</p></div>
      <div>
        <p>自用的 AI 辅助研发与交付流程，将需求、规格、任务、质检、验证和交付组织为可追踪文档流，支撑多项目并行推进并保留问题定位、质量检查和复盘依据。</p>
        <ul><li>以项目入口明确当前目标、事实来源、范围与交付物。</li><li>将关键决策、实现约束、任务拆解和验收条件分阶段记录。</li><li>通过测试、质量门和人工检查保留关键链路的验证依据。</li><li>将交付物、遗留风险与复盘结论回写，供下一轮实现和方案判断复用。</li></ul>
        <div class="tag-row"><span class="tag">SDD</span><span class="tag">TDD</span><span class="tag">质量门</span><span class="tag">交付回写</span></div>
      </div>
    </div>
    <div class="footer"><span>代表项目</span><span>02</span></div>
  </section>

  <section class="page">
    <div class="section-title"><h2>补充项目与迁移能力</h2></div>
    <div class="project">
      <div><div class="project-index">PROJECT 03</div><h3>领域知识层与 RAG 规格</h3><p class="muted">从专家经验到可复用知识</p></div>
      <div><p>将一线解读经验整理为画面结构、视觉证据、报告表达和安全边界，形成可审阅、可复用的领域知识层。RAG（检索增强生成）共用解读引擎当前处于规格阶段，尚未上线。</p></div>
    </div>
    <div class="project">
      <div><div class="project-index">PROJECT 04</div><h3>心理疗愈 AI 产品观察</h3><p class="muted">产品分析与趋势洞察</p></div>
      <div><p>持续观察心理疗愈、情绪支持和自我探索类 AI 产品，分析产品模式、技术路径、交互边界、风险控制和落地机会，为 AI 产品边界、用户信任和安全兜底提供参考。</p></div>
    </div>
    <div class="project">
      <div><div class="project-index">PROJECT 05</div><h3>工程与高信任服务背景</h3><p class="muted">游戏 / 工具软件 / 房产咨询</p></div>
      <div><p>早期覆盖主机游戏、端游、移动端和工具软件开发，后续在房产咨询中长期处理高金额、高风险、非标准化客户决策场景。迁移价值在于技术转译、复杂系统拆解、客户需求诊断、方案设计、SOP 和交付复盘。</p></div>
    </div>
    <div class="grid-3" style="margin-top: 8mm;">
      <div class="card"><strong>FDE / AI 解决方案工程师</strong><br/>高信任客户服务、SOP 与培训体系、AI 产品上线，共同证明客户诊断、方案边界和交付推进能力。</div>
      <div class="card"><strong>AI 产品经理</strong><br/>一镜一梳的真实问题、MVP 取舍、质量设计和商业化路径，共同证明 0 到 1 产品能力。</div>
      <div class="card"><strong>AI 应用工程师</strong><br/>两段式生成、模型评测、质量回归、失败降级和商业工程履历，共同证明应用层落地能力。</div>
    </div>
    <div class="footer"><span>补充项目与岗位相关性</span><span>03</span></div>
  </section>

  <section class="page">
    <div class="section-title"><h2>联系与链接</h2></div>
    <div class="grid-2">
      <div class="card"><h3>联系</h3><p>邮箱：alinecui@qq.com</p><p>GitHub：github.com/MindSyncHub</p><p>作品集：https://xinran.jingshu.cc</p></div>
      <div class="card"><h3>可沟通方向</h3><ul><li>FDE（驻场交付工程师）/ AI 解决方案工程师</li><li>AI 产品经理 / AI Builder / 产品工程型 PM</li><li>AI 应用工程师 / 大模型应用工程师 / Agent 应用工程师</li></ul></div>
    </div>
    <div style="margin-top: 12mm;" class="card">
      <h3>表达边界</h3>
      <p>本作品集呈现可公开说明的独立产品、工程实践与工作流程。所有产品状态以页面说明为准：线上主链、内部预备形态与规格阶段能力分别表述，不将个人项目包装成企业客户交付或成熟商业案例。</p>
    </div>
    <div class="footer"><span>联系与边界</span><span>04</span></div>
  </section>
</body>
</html>`;

if (!existsSync(chrome)) {
  throw new Error(`Chrome not found: ${chrome}`);
}

mkdirSync(tmpDir, { recursive: true });
writeFileSync(htmlPath, html);

execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  `--print-to-pdf=${out}`,
  "--print-to-pdf-no-header",
  pathToFileURL(htmlPath).href,
], { stdio: "inherit" });

rmSync(tmpDir, { recursive: true, force: true });
console.log(out);
