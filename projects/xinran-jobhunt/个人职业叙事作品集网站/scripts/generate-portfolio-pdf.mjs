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
      <p class="subtitle">技术研发、复杂服务咨询、创业实践和 AI 产品化交叉背景。当前聚焦 AI 产品经理、AI Agent / Workflow 产品经理、AI 转型咨询顾问、FDE / AI 解决方案工程师。</p>
      <div class="meta-grid">
        <div class="card"><strong>核心定位</strong><br/>把真实业务问题拆成 PoC、Agent 工作流、质量门、交付边界和团队可执行的 AI 产品方案。</div>
        <div class="card"><strong>当前城市</strong><br/>上海｜税前月薪 25k+｜可沟通 AI 产品、ToB 解决方案和 FDE 方向。</div>
        <div class="card"><strong>在线作品集</strong><br/>https://xinran.jingshu.cc<br/>完整履历见 online-resume-full.pdf</div>
      </div>
    </div>
    <div>
      <div class="tag-row">
        <span class="tag">AI 产品</span><span class="tag">PoC / MVP</span><span class="tag">BRD / PRD</span><span class="tag">Agent Loop</span>
        <span class="tag">RAG / 知识库</span><span class="tag">质量门</span><span class="tag">ToB / FDE</span><span class="tag">交付边界</span>
      </div>
    </div>
    <div class="footer"><span>崔兴｜作品集 PDF</span><span>2026.07</span></div>
  </section>

  <section class="page">
    <div class="section-title"><h2>能力地图</h2></div>
    <div class="grid-2">
      <div class="card"><h3>AI 产品定义</h3><ul><li>从真实痛点出发定义用户路径、MVP / PoC 范围和产品边界。</li><li>输出 BRD / PRD、原型、Prompt Pack、输出契约和评测口径。</li><li>关注 Agent Loop、反馈闭环、质量门和持续迭代。</li></ul></div>
      <div class="card"><h3>FDE / 解决方案落地</h3><ul><li>把客户场景拆成可验证 PoC、数据与权限边界、日志 / 人审 / 回滚机制。</li><li>能在业务方、交付方和技术实现方之间做需求翻译。</li><li>将需求沟通、流程诊断、试点建议和交付材料组织成闭环。</li></ul></div>
      <div class="card"><h3>AI 转型与工作流诊断</h3><ul><li>沉淀 AI 工作流诊断、文档知识库整理、售前诊断模板和样本沟通记录。</li><li>把专家经验、SOP、知识库、培训赋能和组织推广放进可执行边界。</li><li>不承诺泛化转型结果，先验证一条具体流程。</li></ul></div>
      <div class="card"><h3>工程与系统底座</h3><ul><li>C++ / Python / React / Git / 云服务器部署 / Nginx / HTTPS 基础。</li><li>长期工程交付、跨模块协作和复杂系统拆解经验。</li><li>用 Monorepo、artifact、QA、delivery 让 AI 协作可追踪。</li></ul></div>
    </div>
    <div class="footer"><span>能力地图</span><span>01</span></div>
  </section>

  <section class="page">
    <div class="section-title"><h2>代表项目</h2></div>
    <div class="project">
      <div><div class="project-index">PROJECT 01</div><h3>一镜一梳</h3><p class="muted">曼陀罗绘画 AI 解读应用｜2025 至今</p></div>
      <div>
        <p>面向 To C 用户的曼陀罗绘画上传与 AI 解读 Web MVP。围绕画作上传、三圈识别、Lite / Pro 报告、报告追问、历史记录和付费升级，形成可验证、可上线的 AI 原生产品闭环。</p>
        <ul><li>从人工解读服务痛点出发，拆出用户主路径、产品边界和 MVP 范围。</li><li>设计 Vision Pass + Reasoning Pass 两段式报告生成链路。</li><li>建立 Prompt Pack、输出契约、评测集 / Golden Case、质量门和安全边界。</li><li>推进从原型、AI Coding、联调、CI/CD 到云服务器部署的工程闭环。</li></ul>
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
      <div><div class="project-index">PROJECT 02</div><h3>知行工坊</h3><p class="muted">AI 一人公司 Monorepo｜2026 至今</p></div>
      <div>
        <p>自建自用的一人公司 AI Native 工作系统，用 Monorepo 管理公司治理、项目入口、Agent 角色、知识库、共享工具、自动化记忆和阶段产物，让 AI 产品、内容生产、求职材料和服务验证工作可追踪、可交接、可复盘。</p>
        <ul><li>建立 agents / company / projects / shared / knowledge-base 五层结构。</li><li>把 spec、task、QA、delivery、review 纳入项目闭环。</li><li>推进 ai-service-studio：沉淀 AI 工作流诊断、知识库整理、FDE 售前诊断模板、低压力获客话术和样本沟通记录。</li><li>推进 influencer-tracker：打通对标账号追踪、内容标准化、去重、飞书写入、选题候选、brief、每日摘要和评论入库链路。</li></ul>
        <div class="tag-row"><span class="tag">Agent 协作</span><span class="tag">AI 服务验证</span><span class="tag">内容系统</span><span class="tag">交付回写</span></div>
      </div>
    </div>
    <div class="footer"><span>代表项目</span><span>02</span></div>
  </section>

  <section class="page">
    <div class="section-title"><h2>补充项目与迁移能力</h2></div>
    <div class="project">
      <div><div class="project-index">PROJECT 03</div><h3>曼陀罗疗愈知识库</h3><p class="muted">结构化东方疗愈体系</p></div>
      <div><p>把一线解读经验整理为三圈结构、五行对应、视觉证据、报告表达和安全边界，接入 AI 报告链路与 RAG 思路下的知识层。价值在于把非标准化专家经验拆成可审阅、可复用、可边界控制的知识结构。</p></div>
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
      <div class="card"><strong>AI 产品经理</strong><br/>一镜一梳、知行工坊、产品观察，共同证明 0 到 1、PoC、质量门和迭代能力。</div>
      <div class="card"><strong>AI 转型咨询顾问</strong><br/>房产咨询、ai-service-studio 和知识库治理，共同证明流程诊断与服务边界设计能力。</div>
      <div class="card"><strong>FDE / 解决方案</strong><br/>工程履历、Monorepo、influencer-tracker 和部署经验，共同证明技术转译与交付闭环能力。</div>
    </div>
    <div class="footer"><span>补充项目与岗位相关性</span><span>03</span></div>
  </section>

  <section class="page">
    <div class="section-title"><h2>联系与链接</h2></div>
    <div class="grid-2">
      <div class="card"><h3>联系</h3><p>邮箱：alinecui@qq.com</p><p>GitHub：github.com/MindSyncHub</p><p>作品集：https://xinran.jingshu.cc</p></div>
      <div class="card"><h3>可沟通方向</h3><ul><li>AI 产品经理 / AI Agent / Workflow 产品经理</li><li>AI 转型咨询顾问 / AI 服务验证</li><li>FDE / AI 解决方案工程师 / 售前解决方案</li></ul></div>
    </div>
    <div style="margin-top: 12mm;" class="card">
      <h3>表达边界</h3>
      <p>本作品集呈现的是可公开说明的自用产品、工作系统、研究与服务验证材料。ai-service-studio 仍处于验证期，不包装成成熟商业案例；influencer-tracker 是内容系统数据入口和工作流样板，不包装成独立 SaaS。</p>
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
