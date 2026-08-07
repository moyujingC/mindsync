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
    @page { size: A4; margin: 13mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #203746;
      background: #fff;
      font-family: "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif;
      font-size: 11.2pt;
      line-height: 1.72;
    }
    h1, h2, h3, p { margin: 0; }
    h1, h2, h3 { font-family: "Songti SC", "Noto Serif SC", serif; font-weight: 600; }
    h1 { font-size: 27pt; line-height: 1.25; letter-spacing: .01em; }
    h2 { font-size: 20pt; line-height: 1.3; }
    h3 { font-size: 13.5pt; line-height: 1.45; }
    p { margin-bottom: 4mm; }
    ul { margin: 0; padding-left: 5mm; }
    li { margin-bottom: 2.4mm; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .eyebrow { color: #9a6128; font-size: 8.5pt; letter-spacing: .24em; margin-bottom: 7mm; }
    .rule { width: 28mm; height: 1px; margin: 7mm 0; background: #9a6128; }
    .cover { min-height: 266mm; padding: 10mm 1mm 5mm; display: flex; flex-direction: column; justify-content: space-between; }
    .cover-lead { max-width: 160mm; color: #4a5e69; font-size: 13pt; line-height: 1.75; }
    .hero-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin-top: 12mm; }
    .hero-card, .metric, .track, .note { border: 1px solid #d8cabc; background: #fffdf9; }
    .hero-card { padding: 5mm; font-size: 10.2pt; line-height: 1.65; }
    .hero-card strong { display: block; color: #9a6128; margin-bottom: 2mm; }
    .tag-row { display: flex; flex-wrap: wrap; gap: 2mm; margin-top: 6mm; }
    .tag { border: 1px solid #c9aa8a; color: #8b5728; padding: 1.2mm 2.4mm; font-size: 8.3pt; letter-spacing: .04em; }
    .page-header { display: flex; align-items: baseline; gap: 4mm; border-bottom: 1px solid #dccfc2; padding-bottom: 5mm; margin-bottom: 7mm; }
    .index { color: #9a6128; font-size: 8.5pt; letter-spacing: .22em; }
    .section-lead { color: #4a5e69; font-size: 11.4pt; max-width: 165mm; margin-bottom: 6mm; }
    .track { padding: 5mm 6mm; margin-bottom: 4mm; break-inside: avoid; }
    .track h3 { color: #284656; margin-bottom: 1.8mm; }
    .track p { color: #4d616c; margin-bottom: 3mm; }
    .track ul { font-size: 10.5pt; }
    .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; margin: 5mm 0 7mm; }
    .metric { padding: 4mm 4.5mm; break-inside: avoid; }
    .metric strong { display: block; color: #9a6128; font-size: 15pt; line-height: 1.2; margin-bottom: 1mm; }
    .metric span { font-size: 9.6pt; color: #526570; line-height: 1.5; }
    .project-title { display: flex; align-items: baseline; gap: 4mm; margin-bottom: 3mm; }
    .project-kicker { color: #9a6128; font-size: 8.5pt; letter-spacing: .22em; }
    .project-meta { color: #667780; font-size: 9.8pt; margin-bottom: 5mm; }
    .project-copy { font-size: 11.2pt; }
    .evidence { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3.5mm; margin-top: 6mm; }
    .evidence figure { margin: 0; border: 1px solid #d8cabc; background: #f8f5ef; padding: 2mm; break-inside: avoid; }
    .evidence img { display: block; width: 100%; height: 56mm; object-fit: contain; object-position: top; }
    .evidence figcaption { color: #596a73; font-size: 8.4pt; line-height: 1.45; margin-top: 1.8mm; }
    .two-col { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; }
    .note { padding: 5mm 6mm; margin-bottom: 5mm; break-inside: avoid; }
    .note h3 { color: #284656; margin-bottom: 2mm; }
    .note p { color: #4d616c; margin-bottom: 2.5mm; }
    .note ul { font-size: 10.3pt; }
    .footer { margin-top: 7mm; color: #829098; font-size: 8.3pt; border-top: 1px solid #dccfc2; padding-top: 3mm; display: flex; justify-content: space-between; }
    .boundary { background: #f6f1e8; border-left: 3px solid #9a6128; padding: 4.5mm 5mm; color: #425965; font-size: 10pt; line-height: 1.65; }
    .contact { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
    .contact .note { min-height: 46mm; }
  </style>
</head>
<body>
  <section class="page cover">
    <div>
      <div class="eyebrow">AI PRODUCT · FDE · SOLUTION DELIVERY</div>
      <h1>崔兴｜AI 产品与解决方案作品集</h1>
      <div class="rule"></div>
      <p class="cover-lead">9 年商业研发、7 年高信任服务与近 2 年 AI 应用实践。当前主投 FDE（驻场交付工程师）/ AI 解决方案工程师，并定向匹配 AI 产品经理与 AI 应用工程师岗位。</p>
      <div class="hero-list">
        <div class="hero-card"><strong>核心定位</strong>从真实业务场景识别问题、约束与风险，并将其落成可运行、可评测、可交付的 AI 应用与方案。</div>
        <div class="hero-card"><strong>当前状态</strong>上海｜离职，随时到岗｜可沟通 FDE、AI 解决方案、AI 产品与 AI 应用工程方向。</div>
        <div class="hero-card"><strong>在线作品集</strong>https://xinran.jingshu.cc<br/>完整履历：online-resume-full.pdf</div>
      </div>
    </div>
    <div>
      <div class="tag-row"><span class="tag">FDE / AI 解决方案</span><span class="tag">AI 产品 0 到 1</span><span class="tag">模型评测</span><span class="tag">Golden Case</span><span class="tag">安全边界</span><span class="tag">工程交付</span></div>
      <div class="footer"><span>崔兴｜作品集</span><span>2026.08</span></div>
    </div>
  </section>

  <section class="page">
    <div class="page-header"><span class="index">01 / CAPABILITY</span><h2>三条岗位主线</h2></div>
    <p class="section-lead">同一条底层主线：将复杂、非标准的问题拆成可交付、可复用、可验证的系统。不同岗位以不同的证据重点展开。</p>
    <article class="track"><h3>FDE / AI 解决方案工程师</h3><p>从客户场景中识别目标、约束与风险，将非标准服务拆成可验证 PoC、方案边界、工程联调与可复用交付体系。</p><ul><li>150+ 高信任客户服务，约 70% 来自转介绍；4 人团队年营收约 200 万。</li><li>将服务沉淀为 SOP、知识库、风控清单与培训体系，孵化 30+ 经纪人。</li><li>独立上线 AI 产品，具备模型评测、质量验证、失败降级与交付边界设计经验。</li></ul></article>
    <article class="track"><h3>AI 产品经理</h3><p>从真实问题定义产品路径，完成 MVP 取舍、AI 输出质量设计、商业化路径设计与端到端上线推进。</p><ul><li>从 100+ 小时一线服务痛点定义一镜一梳的当前产品路径。</li><li>完成用户路径、Lite / Pro 分层、报告追问与安全边界设计。</li><li>通过两段式生成、案例对照和质量回归，让 AI 输出具备可评测的产品标准。</li></ul></article>
    <article class="track"><h3>AI 应用工程师</h3><p>将模型调用、生成链路、评测回归、失败降级和部署运维组织为可运行、可测试、可排障的 AI 应用系统。</p><ul><li>Python / FastAPI、React / Vite、API 联调、私有存储、签名 URL 与公网部署。</li><li>两段式报告生成、模型稳定性评测、Golden Case 回归与安全拦截。</li><li>5 个开源 PR 合入主干，覆盖缺陷修复、测试补齐、审查反馈与 CI 协作。</li></ul></article>
    <div class="footer"><span>能力地图</span><span>01</span></div>
  </section>

  <section class="page">
    <div class="page-header"><span class="index">02 / PROJECT</span><h2>一镜一梳：从专家经验到 AI 产品</h2></div>
    <div class="project-title"><span class="project-kicker">PROJECT 01</span><h3>手绘图像 AI 解读与个性化报告产品</h3></div>
    <p class="project-meta">角色：独立产品负责人 / 开发推进 ｜ 时间：2025 至今 ｜ 线上产品：https://web.jingshu.cc</p>
    <p class="project-copy">当前线上主链覆盖画作上传、画面结构标定、Lite 报告、报告内追问和历史记录；Pro 为内部预备形态，产品以内测兑换码模式运行。</p>
    <div class="metrics"><div class="metric"><strong>100+ 小时</strong><span>一线服务实践，作为产品问题与边界的来源。</span></div><div class="metric"><strong>11 个案例</strong><span>两类报告方案的 A/B 对照批跑。</span></div><div class="metric"><strong>5 组案例</strong><span>Golden Case（标准回归案例）用于质量检查。</span></div></div>
    <div class="two-col">
      <div class="note"><h3>产品与方案取舍</h3><ul><li>将人工解读拆成可执行的上传、画面结构标定、报告与追问路径。</li><li>Lite 先让用户获得低门槛反馈；Pro 作为内部预备形态，等待进一步验证。</li><li>报告内追问聚焦本次画作与报告，控制高信任场景的依赖和越界风险。</li></ul></div>
      <div class="note"><h3>工程与质量控制</h3><ul><li>“视觉草稿 → 议题报告”两段式链路已接入线上 API 主链。</li><li>通过模型评测、案例对照与 Golden Case 回归检查生成质量。</li><li>采用失败降级、追问安全拦截、私有存储与签名 URL 控制风险。</li></ul></div>
    </div>
    <div class="evidence">
      <figure><img src="${asset("works/mandala-app/01-landing.png")}"/><figcaption>启动页：明确产品价值与主路径。</figcaption></figure>
      <figure><img src="${asset("works/mandala-app/03-upload.png")}"/><figcaption>上传页：承接图像和用户上下文。</figcaption></figure>
      <figure><img src="${asset("works/mandala-app/06-lite-report.png")}"/><figcaption>Lite 报告：结构化呈现初步结果。</figcaption></figure>
      <figure><img src="${asset("works/mandala-app/07-history.png")}"/><figcaption>历史页：沉淀可回看的探索记录。</figcaption></figure>
    </div>
    <div class="footer"><span>一镜一梳</span><span>02</span></div>
  </section>

  <section class="page">
    <div class="page-header"><span class="index">03 / DELIVERY</span><h2>AI 辅助研发与交付流程</h2></div>
    <p class="section-lead">将需求、规格、任务、质检、验证和交付组织为可追踪文档流，支撑多项目并行推进，并保留问题定位、质量检查和复盘依据。</p>
    <div class="two-col">
      <div>
        <article class="note"><h3>从问题到实现</h3><ul><li>项目入口明确当前目标、事实来源、范围与交付物。</li><li>关键决策、实现约束、任务拆解和验收条件分阶段记录。</li><li>让 AI 协作能基于相同约束接手工作，而不是依赖一次性聊天上下文。</li></ul></article>
        <article class="note"><h3>从验证到复盘</h3><ul><li>通过测试、质量门和人工检查保留关键链路的验证依据。</li><li>将交付物、遗留风险与复盘结论回写，供下一轮实现和方案判断复用。</li><li>4 个月 2200+ 次提交、连续 70+ 天自动化复盘，作为持续投入的辅助证据。</li></ul></article>
      </div>
      <div>
        <article class="note"><h3>商业工程与跨角色协作底座</h3><ul><li>早期覆盖 C++ / Lua / C# / Objective-C / Java / Qt，参与端游、主机、移动端与工具软件研发。</li><li>从程序员到项目经理、制作人 / 技术负责人，带领上海 / 西安 12 人团队推进手游研发。</li><li>搭建 Jenkins CI/CD 与自动化版本发布流程，积累复杂模块调试、跨平台适配与交付风险判断经验。</li></ul></article>
        <article class="note"><h3>公开工程协作</h3><ul><li>向 paperclipai/paperclip 合入 5 个 PR，全部进入主干。</li><li>完成 Issue 分析、测试编写、代码修改、审查反馈和 CI 协作全流程。</li></ul></article>
      </div>
    </div>
    <div class="footer"><span>研发与交付流程</span><span>03</span></div>
  </section>

  <section class="page">
    <div class="page-header"><span class="index">04 / CONTEXT</span><h2>领域知识、服务与迁移能力</h2></div>
    <article class="note"><h3>领域知识层与 RAG 规格</h3><p>将一线解读经验整理为画面结构、视觉证据、报告表达和安全边界，形成可审阅、可复用的领域知识层。RAG（检索增强生成）共用解读引擎当前处于规格阶段，尚未上线。</p></article>
    <article class="note"><h3>高信任服务与标准化交付</h3><p>在房产咨询中长期处理高金额、高风险、非标准化客户决策场景，通过访谈识别真实目标、预算约束与交易风险，并将服务沉淀为 SOP、知识库、风控清单和培训体系。</p><ul><li>累计服务 150+ 高净值客户，约 70% 来自转介绍；4 人团队年营收约 200 万。</li><li>孵化 30+ 经纪人，新人独立上岗周期从约 18 个月压缩至约 6 个月。</li></ul></article>
    <article class="note"><h3>岗位匹配边界</h3><ul><li>FDE / AI 解决方案：优先匹配业务诊断、AI 应用方案、PoC / MVP、工程联调和交付验证并重的机会。</li><li>AI 产品经理：聚焦 AI Builder、产品工程型 PM、中小团队产品负责人。</li><li>AI 应用工程师：适合模型编排、评测、应用集成和业务落地导向的应用层岗位。</li></ul></article>
    <div class="boundary"><strong>表达边界：</strong>本作品集呈现可公开说明的独立产品、工程实践与工作流程。线上主链、内部预备形态与规格阶段能力分别表述，不将个人项目包装成企业客户交付或成熟商业案例。</div>
    <div class="contact" style="margin-top: 6mm;">
      <div class="note"><h3>联系</h3><p>邮箱：alinecui@qq.com<br/>GitHub：github.com/MindSyncHub<br/>作品集：xinran.jingshu.cc</p></div>
      <div class="note"><h3>可沟通方向</h3><p>FDE / AI 解决方案工程师<br/>AI 产品经理 / AI Builder<br/>AI 应用工程师 / 大模型应用工程师</p></div>
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

try {
  execFileSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-pdf-header-footer",
    `--print-to-pdf=${out}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: "inherit" });
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

console.log(out);
