import { Container, SectionLabel, TrackBadge, ConfidenceBadge } from '../shared';
import { Link } from '../../router';
import { products, Product } from '../../data';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Props { slug?: string }

export function ProductPage({ slug }: Props) {
  const p = products.find(x => x.slug === slug);
  if (!p) return <div className="py-40 text-center">未找到该产品</div>;
  const d = p.detail;
  if (!d) return <ProductStubPage p={p} />;
  const detail = d;
  const offset = d.technical ? 1 : 0;

  return (
    <main>
      <section style={{ background: 'var(--bg-soft)' }} className="pt-12 md:pt-16 pb-10 hairline-b">
        <Container>
          <div className="text-[12px] mb-6 flex items-center gap-2" style={{ color: 'var(--ink-tertiary)' }}>
            <Link to={{ name: 'map' }} style={{ color: 'var(--ink-tertiary)' }}>产品地图</Link>
            <span>/</span>
            <span>{p.track}</span>
            <span>/</span>
            <span style={{ color: 'var(--ink-primary)' }}>{p.name}</span>
          </div>
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-7">
              <div className="flex flex-wrap gap-2 mb-5">
                <TrackBadge name={p.track} />
                <ConfidenceBadge value={p.confidence} />
              </div>
              <h1 className="m-0 mb-5" style={{ fontSize: 'clamp(2rem, 3.6vw, 2.8rem)' }}>{p.name}</h1>
              <p className="m-0 text-[17px]" style={{ color: 'var(--ink-primary)', lineHeight: 1.8 }}>{p.oneLiner}</p>
              {p.url && (
                <div className="mt-6 flex items-center gap-3 text-[14px]">
                  <span className="font-mono text-[11px] tracking-widest uppercase" style={{ color: 'var(--ink-tertiary)' }}>OFFICIAL</span>
                  <a href={p.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-green)' }}>{p.url.replace('https://', '')} ↗</a>
                </div>
              )}
            </div>
            <div className="md:col-span-5">
              <div className="hairline rounded-md overflow-hidden" style={{ background: 'var(--bg-paper)' }}>
                <div className="aspect-[4/3]">
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 text-[12px] hairline-t" style={{ color: 'var(--ink-tertiary)' }}>
                  图片来源：{p.imageSource}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 30s take */}
      <section className="py-12">
        <Container>
          <div className="hairline rounded-md p-7 md:p-9 mx-auto max-w-[820px]"
            style={{ background: 'var(--bg-paper)', borderLeft: '3px solid var(--accent-green)' }}>
            <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--accent-green)' }}>30 秒带走</div>
            <p className="m-0" style={{ fontSize: '1.05rem', lineHeight: 1.9 }}>{detail.take30s}</p>
          </div>
        </Container>
      </section>

      {/* Detail grid */}
      <section className="pb-16">
        <Container>
          <div className="grid md:grid-cols-12 gap-10">
            <article className="md:col-span-8 prose-cn">
              <SectionDivider
                eyebrow="PRODUCT READ"
                title="先看懂这款产品到底在解决什么问题"
                body="这一部分先不急着谈模型和架构，而是先回答：它面向谁、解决什么痛点、体验是怎么成立的。"
              />
              <Block label="01" title="产品定位"><p>{detail.positioning}</p></Block>
              <Block label="02" title="用户痛点"><ul>{detail.userPain.map((x, i) => <li key={i}>{x}</li>)}</ul></Block>
              <Block label="03" title="核心体验"><p>{detail.coreExperienceLong}</p></Block>
              <Block label="04" title="心理学机制"><ul>{detail.psychMechanism.map((x, i) => <li key={i}>{x}</li>)}</ul></Block>
              <Block label="05" title="AI 的角色"><p>{detail.aiRole}</p></Block>
              <SectionDivider
                eyebrow="SYSTEM VIEW"
                title="再看它背后的技术、边界和商业判断"
                body="这部分不是为了证明“技术多先进”，而是帮助读者判断：这套产品大概怎么运转、哪里最容易出问题、哪些结论还不能下得太早。"
              />
              {detail.technical && (
                <Block label="06" title="AI 技术架构">
                  <TechnicalSection technical={detail.technical} />
                </Block>
              )}
              <Block label={String(6 + offset).padStart(2, '0')} title="商业模式"><p>{detail.business}</p></Block>
              <Block label={String(7 + offset).padStart(2, '0')} title="安全边界">
                <div className="hairline rounded-md p-5" style={{ background: 'rgba(184,107,94,0.06)', borderColor: 'rgba(184,107,94,0.3)' }}>
                  <div className="font-mono text-[11px] tracking-widest mb-2" style={{ color: 'var(--accent-risk)' }}>SAFETY NOTE</div>
                  <p className="m-0">{detail.safety}</p>
                </div>
              </Block>
              <Block label={String(8 + offset).padStart(2, '0')} title="风险提示">
                <div className="hairline rounded-md p-5" style={{ background: 'rgba(214,166,106,0.08)', borderColor: 'rgba(214,166,106,0.35)' }}>
                  <div className="font-mono text-[11px] tracking-widest mb-2" style={{ color: 'var(--accent-warm)' }}>RISK NOTE · 待核验事项</div>
                  <p className="m-0">{p.risk}</p>
                </div>
              </Block>
              <Block label={String(9 + offset).padStart(2, '0')} title="创业启发"><ul>{detail.inspiration.map((x, i) => <li key={i}>{x}</li>)}</ul></Block>
            </article>

            <aside className="md:col-span-4 md:sticky md:top-24 self-start space-y-5">
              <div className="hairline rounded-md p-5" style={{ background: 'var(--bg-cool)' }}>
                <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--accent-blue)' }}>学习卡 · LEARNING CARD</div>
                <p className="m-0 font-serif" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>"{detail.learningCard}"</p>
              </div>
              <div className="hairline rounded-md p-5" style={{ background: 'var(--bg-paper)' }}>
                <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--ink-tertiary)' }}>来源与核验</div>
                <ul className="m-0 p-0 list-none space-y-3">
                  {detail.sources.map((s, i) => (
                    <li key={i} className="text-[13px]">
                      <div style={{ color: 'var(--ink-primary)' }}>· {s.label}</div>
                      <div className="ml-3 mt-1" style={{ color: 'var(--ink-tertiary)' }}>{s.note}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hairline rounded-md p-5" style={{ background: 'var(--bg-paper)' }}>
                <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--ink-tertiary)' }}>同赛道</div>
                <div className="space-y-2">
                  {products.filter(x => x.track === p.track && x.slug !== p.slug).slice(0, 4).map(x => (
                    <Link key={x.slug} to={{ name: 'product', slug: x.slug }}
                      className="block text-[14px] no-underline hover:no-underline"
                      style={{ color: 'var(--ink-primary)' }}>
                      <span style={{ color: 'var(--ink-tertiary)' }}>→ </span>{x.name}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}

function ProductStubPage({ p }: { p: Product }) {
  return (
    <main>
      <section style={{ background: 'var(--bg-soft)' }} className="pt-12 md:pt-16 pb-10 hairline-b">
        <Container>
          <div className="text-[12px] mb-6 flex items-center gap-2" style={{ color: 'var(--ink-tertiary)' }}>
            <Link to={{ name: 'map' }} style={{ color: 'var(--ink-tertiary)' }}>产品地图</Link>
            <span>/</span>
            <span>{p.track}</span>
            <span>/</span>
            <span style={{ color: 'var(--ink-primary)' }}>{p.name}</span>
          </div>
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-7">
              <div className="flex flex-wrap gap-2 mb-5">
                <TrackBadge name={p.track} />
                <ConfidenceBadge value={p.confidence} />
              </div>
              <h1 className="m-0 mb-5" style={{ fontSize: 'clamp(2rem, 3.6vw, 2.8rem)' }}>{p.name}</h1>
              <p className="m-0 text-[17px]" style={{ color: 'var(--ink-primary)', lineHeight: 1.8 }}>{p.oneLiner}</p>
            </div>
            <div className="md:col-span-5">
              <div className="hairline rounded-md overflow-hidden" style={{ background: 'var(--bg-paper)' }}>
                <div className="aspect-[4/3]">
                  <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 text-[12px] hairline-t" style={{ color: 'var(--ink-tertiary)' }}>
                  图片来源：{p.imageSource}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12">
        <Container>
          <div className="grid md:grid-cols-12 gap-10">
            <article className="md:col-span-8 prose-cn">
              <Block label="01" title="当前研究状态">
                <p>这款产品目前只有研究卡片摘要，完整详情页还在补充中。为避免把未核验信息写成结论，观察室暂不展示完整拆解。</p>
              </Block>
              <Block label="02" title="已形成的初步判断">
                <div className="space-y-3">
                  <Field label="核心体验" text={p.coreExperience} />
                  <Field label="值得学" text={p.worthLearning} />
                  <Field label="风险提示" text={p.risk} risk />
                </div>
              </Block>
            </article>
            <aside className="md:col-span-4 md:sticky md:top-24 self-start">
              <div className="hairline rounded-md p-5" style={{ background: 'var(--bg-paper)' }}>
                <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--ink-tertiary)' }}>下一步核验</div>
                <ul className="m-0 p-0 list-none space-y-2 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>
                  <li>· 补齐官网、应用商店或公开报道来源。</li>
                  <li>· 核验产品定位、定价与安全边界。</li>
                  <li>· 判断是否值得进入重点样本。</li>
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}

function Block({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 md:grid md:grid-cols-12 md:gap-8">
      <div className="md:col-span-3 mb-3 md:mb-0">
        <div className="flex items-baseline gap-3 md:block">
          <span className="font-mono text-[12px] tracking-widest block mb-2" style={{ color: 'var(--accent-green)' }}>{label}</span>
          <h2 className="m-0 leading-tight" style={{ fontSize: '1.2rem' }}>{title}</h2>
        </div>
      </div>
      <div className="md:col-span-9">
        <div className="hairline-t pt-4">{children}</div>
      </div>
    </section>
  );
}

function SectionDivider({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <section className="mb-10 pb-4 hairline-b">
      <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--ink-tertiary)' }}>
        {eyebrow}
      </div>
      <h2 className="m-0 mb-3" style={{ fontSize: '1.45rem' }}>{title}</h2>
      <p className="m-0 max-w-[760px]" style={{ color: 'var(--ink-secondary)', lineHeight: 1.8 }}>
        {body}
      </p>
    </section>
  );
}

function Field({ label, text, risk }: { label: string; text: string; risk?: boolean }) {
  return (
    <div className="text-[14px]">
      <span className="font-mono text-[11px] tracking-wider mr-2"
        style={{ color: risk ? 'var(--accent-risk)' : 'var(--ink-tertiary)' }}>{label}</span>
      <span style={{ color: 'var(--ink-primary)' }}>{text}</span>
    </div>
  );
}

function TechnicalSection({ technical }: { technical: NonNullable<NonNullable<Product['detail']>['technical']> }) {
  return (
    <div className="space-y-5">
      <div className="hairline rounded-md p-5" style={{ background: 'var(--bg-cool)' }}>
        <div className="font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color: 'var(--accent-blue)' }}>HOW TO READ · 怎么看这一段</div>
        <p className="m-0">{technical.evidenceLevel}</p>
      </div>
      <TechList title="一句话理解" items={[technical.architecture]} />
      <TechList title="已经能确认的部分" items={technical.verified} />
      <TechList title="大概是怎么运转的" items={technical.likelyPath} />
      <TechList title="这里最容易出问题的地方" items={technical.risks} tone="risk" />
      <TechList title="还有哪些没公开说清楚" items={technical.openQuestions} tone="warm" />
      <TechList title="这些话现在还不能直接下结论" items={technical.notFacts} tone="muted" />
    </div>
  );
}

function TechList({
  title,
  items,
  tone = 'default',
}: {
  title: string;
  items: string[];
  tone?: 'default' | 'risk' | 'warm' | 'muted';
}) {
  const color = {
    default: 'var(--accent-green)',
    risk: 'var(--accent-risk)',
    warm: 'var(--accent-warm)',
    muted: 'var(--ink-tertiary)',
  }[tone];

  return (
    <div>
      <div className="font-mono text-[11px] tracking-widest uppercase mb-2" style={{ color }}>{title}</div>
      <ul className="m-0">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}
