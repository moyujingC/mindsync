import { Container, CTAButton, ResearchCard, SectionLabel, Pill } from '../shared';
import { Link } from '../../router';
import { tracks, articles, featuredProducts } from '../../data';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const heroImg = 'https://images.unsplash.com/photo-1768836180164-070b4c1a8f94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1600&q=80';

export function HeroSection() {
  return (
      <section className="relative overflow-hidden">
        <div className="paper-grain absolute inset-0 pointer-events-none opacity-60" />
        <Container className="pt-20 md:pt-28 pb-16 md:pb-24 relative">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-7">
              <SectionLabel>OBSERVATORY · ISSUE 01 · 2026 SPRING</SectionLabel>
              <h1 className="mt-5 mb-6 leading-[1.25]" style={{ fontSize: 'clamp(2rem, 4.4vw, 3.4rem)' }}>
                心理疗愈 AI<br />
                <span style={{ color: 'var(--accent-green)' }}>产品观察室</span>
              </h1>
              <p className="m-0 max-w-[560px] text-[16px]" style={{ color: 'var(--ink-secondary)', lineHeight: 1.9 }}>
                这是一份个人研究项目：我持续观察心理疗愈领域的 AI 产品，从创业视角拆解它们的产品语言、技术路径、商业逻辑与安全边界。
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <CTAButton to={{ name: 'map' }}>浏览产品地图</CTAButton>
                <CTAButton to={{ name: 'method' }} variant="ghost">查看研究方法</CTAButton>
              </div>
            </div>
            <div className="md:col-span-5">
              <div className="relative hairline rounded-md overflow-hidden" style={{ background: 'var(--bg-soft)' }}>
                <div className="aspect-[4/5]">
                  <ImageWithFallback src={heroImg} alt="安静的研究室——温柔自然光下的工作台"
                    className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 backdrop-blur-md"
                  style={{ background: 'rgba(251,251,249,0.78)', borderTop: '1px solid var(--line)' }}>
                  <div className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--ink-tertiary)' }}>FIELD NOTE · 01</div>
                  <div className="text-[13px] mt-1" style={{ color: 'var(--ink-primary)' }}>"克制是稀缺的产品力——很多 AI 产品在抢着'给'，更成熟的心理 AI 在练习'接住'。"</div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
  );
}

export function TrackPreviewSection() {
  return (
      <section className="py-16 md:py-24 hairline-t" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <SectionLabel>PRODUCT MAP</SectionLabel>
              <h2 className="mt-3 mb-2">按角色分组的产品地图</h2>
              <p className="m-0 max-w-[560px]" style={{ color: 'var(--ink-secondary)' }}>
                按"AI 在体验中承担的角色"为轴，把这一新兴领域拆成几种典型路径。每条路径都有自己的产品语言、监管阈值与商业范式。
              </p>
            </div>
            <Link to={{ name: 'map' }} className="text-[14px]" style={{ color: 'var(--accent-green)' }}>查看完整地图 →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tracks.map((t, i) => {
              return (
                <div key={t.name} className="hairline rounded-md p-5 group cursor-default"
                  style={{ background: 'var(--bg-paper)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[11px]" style={{ color: 'var(--ink-tertiary)' }}>
                      0{i + 1}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>研究路径</span>
                  </div>
                  <h4 className="m-0 mb-2">{t.name}</h4>
                  <p className="m-0 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>{t.desc}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
  );
}

export function MethodPreviewSection() {
  return (
      <section className="py-16 md:py-24">
        <Container>
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-4">
              <SectionLabel>RESEARCH METHOD</SectionLabel>
              <h2 className="mt-3 mb-5">从产品判断走到技术判断</h2>
              <p className="m-0" style={{ color: 'var(--ink-secondary)' }}>
                每款产品会先看场景、关系、输入、干预、记忆、边界与商业，再补一层 AI 技术架构：模型策略、记忆、RAG、工作流、安全护栏与合规证据。
              </p>
              <div className="mt-6">
                <Link to={{ name: 'method' }} style={{ color: 'var(--accent-green)' }}>查看完整研究方法 →</Link>
              </div>
            </div>
            <div className="md:col-span-8 grid sm:grid-cols-2 gap-3">
              {[
                ['01', '用户痛点', '它解决的是真实痛点，还是想象中的需求？'],
                ['02', '心理学机制', '它背后引用的是哪种心理学技术？被严肃执行了吗？'],
                ['03', '技术实现路径', '它只是通用模型封装，还是有记忆、检索、编排和垂直数据？'],
                ['04', '商业模式', '它向谁收钱？这门生意可持续吗？'],
                ['05', '安全与信任', '高风险情境的识别、降级与转介，做到了什么程度？'],
              ].map(([n, t, d]) => (
                <div key={n} className="hairline rounded-md p-5" style={{ background: 'var(--bg-paper)' }}>
                  <div className="font-mono text-[11px] tracking-widest mb-2" style={{ color: 'var(--accent-green)' }}>METHOD {n}</div>
                  <h4 className="m-0 mb-2">{t}</h4>
                  <p className="m-0 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>{d}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
  );
}

export function FeaturedProductsSection() {
  return (
      <section className="py-16 md:py-24 hairline-t hairline-b" style={{ background: 'var(--bg-cool)' }}>
        <Container>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <SectionLabel>FEATURED · 代表产品</SectionLabel>
              <h2 className="mt-3 mb-2">先从这些代表样本开始</h2>
              <p className="m-0 max-w-[560px]" style={{ color: 'var(--ink-secondary)' }}>
                它们分别代表"陪伴 / 日记 / 教练 / 临床"几种 AI 在心理领域的典型角色，是理解这个赛道最经济的入口。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link to={{ name: 'focus' }} className="text-[14px]" style={{ color: 'var(--accent-green)' }}>先看重点样本总览 →</Link>
              <Link to={{ name: 'map' }} className="text-[14px]" style={{ color: 'var(--ink-tertiary)' }}>查看完整地图 →</Link>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProducts.map(p => <ResearchCard key={p.slug} p={p} />)}
          </div>
        </Container>
      </section>
  );
}

export function FocusRoutesSection() {
  const routes = [
    {
      code: '01',
      title: '高关系强度消费者心理产品',
      product: 'Ash / Slingshot AI',
      note: '重点不是“会聊天”，而是“关系 + 垂直模型 + 安全系统”如何一起成立。',
      tone: 'green' as const,
    },
    {
      code: '02',
      title: '自我记录型长期陪跑产品',
      product: 'Rosebud',
      note: '最稳的切入口是高频低门槛习惯，再把价值做在长期记忆和反思连续性上。',
      tone: 'blue' as const,
    },
    {
      code: '03',
      title: '方法论平台化产品',
      product: 'Rocky.ai',
      note: '卖的不只是 bot，而是把专家知识、流程、角色和交付结构打包进平台。',
      tone: 'warm' as const,
    },
    {
      code: '04',
      title: '高责任医疗工作流产品',
      product: 'Eleos Health',
      note: '在高监管行业，更值钱的是“懂机构风险和工作流”，不是“更会安慰人”。',
      tone: 'default' as const,
    },
  ];

  return (
      <section className="py-16 md:py-24 hairline-t" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <SectionLabel>FOCUS ROUTES · 四条高价值路线</SectionLabel>
              <h2 className="mt-3 mb-2">这 4 个样本，不是同一类产品里的平替</h2>
              <p className="m-0 max-w-[700px]" style={{ color: 'var(--ink-secondary)' }}>
                这轮研究最重要的收获，不是“哪一款更好”，而是把心理疗愈 / 行为健康 AI 拆成了 4 条不同路线：高关系消费者产品、自我记录型长期陪跑、方法论平台化，以及高责任工作流系统。
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {routes.map((route) => (
              <div key={route.code} className="hairline rounded-md p-6" style={{ background: 'var(--bg-paper)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-[11px] tracking-widest" style={{ color: 'var(--ink-tertiary)' }}>{route.code}</span>
                  <Pill tone={route.tone}>{route.product}</Pill>
                </div>
                <h3 className="m-0 mb-3" style={{ fontSize: '1.15rem' }}>{route.title}</h3>
                <p className="m-0 text-[14px]" style={{ color: 'var(--ink-secondary)', lineHeight: 1.8 }}>{route.note}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
  );
}

export function ArticlesPreviewSection() {
  return (
      <section className="py-16 md:py-24">
        <Container>
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <SectionLabel>FIELD NOTES · 首发文章</SectionLabel>
              <h2 className="mt-3 mb-2">先发布一组可复用的观察样张</h2>
              <p className="m-0 max-w-[560px] mt-2" style={{ color: 'var(--ink-secondary)' }}>
                文章不追产能：先把判断讲清楚，再发布给读者。这里先放产品地图、AI 安全边界和临床工作流三个方向的样张。
              </p>
            </div>
            <Link to={{ name: 'articles' }} className="text-[14px]" style={{ color: 'var(--accent-green)' }}>查看文章列表 →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {articles.slice(0, 2).map((a, i) => (
              <Link key={a.slug} to={{ name: 'article', slug: a.slug }}
                className="block hairline rounded-md p-6 md:p-7 no-underline hover:no-underline group"
                style={{ background: 'var(--bg-paper)' }}>
                <div className="flex items-center gap-3 mb-3 text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>
                  <span className="font-mono">№ {String(i + 1).padStart(2, '0')}</span>
                  <span>·</span>
                  <Pill>{a.tag}</Pill>
                  <span>·</span>
                  <span>{a.readTime}</span>
                </div>
                <h3 className="m-0 mb-3 group-hover:underline underline-offset-4" style={{ fontSize: '1.2rem' }}>{a.title}</h3>
                <p className="m-0 text-[14px]" style={{ color: 'var(--ink-secondary)' }}>{a.excerpt}</p>
                <div className="mt-5 flex items-center justify-between text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>
                  <span className="font-mono">{a.date}</span>
                  <span style={{ color: 'var(--accent-green)' }}>阅读全文 →</span>
                </div>
              </Link>
            ))}
            <div className="block hairline rounded-md p-6 md:p-7"
              style={{ background: 'var(--bg-soft)', borderStyle: 'dashed' }}>
              <div className="flex items-center gap-3 mb-3 text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>
                <span className="font-mono">NEXT</span>
                <span>·</span>
                <Pill tone="warm">后续选题</Pill>
              </div>
              <h3 className="m-0 mb-3" style={{ fontSize: '1.2rem' }}>临床场景里，AI 更适合做副驾</h3>
              <p className="m-0 text-[14px]" style={{ color: 'var(--ink-secondary)' }}>
                以 Eleos Health 为样本，谈被严格监管的领域里，AI 如何服务专业人员而不是替代专业判断。计划在下一期发布。
              </p>
              <div className="mt-5 text-[12px] font-mono" style={{ color: 'var(--ink-tertiary)' }}>
                筹备中 · 暂未发布
              </div>
            </div>
          </div>
        </Container>
      </section>
  );
}

export function AboutSubscribeSection() {
  const showSubscribe = false;

  return (
      <section className="py-16 md:py-24 hairline-t" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <div className="grid md:grid-cols-12 gap-10">
            <div className={showSubscribe ? 'md:col-span-6' : 'md:col-span-8'}>
              <SectionLabel>ABOUT</SectionLabel>
              <h2 className="mt-3 mb-4">一份个人研究项目，<br />不是产品导航站。</h2>
              <p className="m-0 max-w-[620px]" style={{ color: 'var(--ink-secondary)' }}>
                我持续整理 AI 心理疗愈产品的公开资料和上手观察，用创业视角去看每一款产品背后的机会与风险。每段评价都标注来源和置信度——置信度反映的是资料可核验程度，不是产品好坏。
              </p>
              <div className="mt-7 flex gap-3">
                <CTAButton to={{ name: 'about' }} variant="ghost">关于观察室</CTAButton>
                <CTAButton to={{ name: 'method' }} variant="ghost">研究方法</CTAButton>
              </div>
            </div>
            {showSubscribe && <div className="md:col-span-6">
              <div className="hairline rounded-md p-7" style={{ background: 'var(--bg-paper)' }}>
                <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--accent-green)' }}>SUBSCRIBE</div>
                <h3 className="m-0 mb-3">订阅每月一封的观察通讯</h3>
                <p className="m-0 mb-5 text-[14px]" style={{ color: 'var(--ink-secondary)' }}>
                  每月 1 封，约 1500 字。包含当月最值得关注的 2–3 款产品、1 个赛道判断、1 份方法论卡片。低频，不打扰。
                </p>
                <form className="flex flex-col sm:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder="your@email.com"
                    className="flex-1 px-4 py-2.5 rounded-sm hairline text-[14px] outline-none"
                    style={{ background: 'var(--bg-base)', color: 'var(--ink-primary)' }} />
                  <button type="submit"
                    className="px-5 py-2.5 rounded-sm text-[14px]"
                    style={{ background: 'var(--ink-primary)', color: '#F6F7F5' }}>订阅</button>
                </form>
                <div className="mt-3 text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>
                  · 你的邮箱不会被分享。随时可退订。
                </div>
              </div>
            </div>}
          </div>
        </Container>
      </section>
  );
}
