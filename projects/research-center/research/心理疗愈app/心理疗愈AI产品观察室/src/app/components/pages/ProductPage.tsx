import { Container, SectionLabel, TrackBadge, ConfidenceBadge, Pill } from '../shared';
import { Link } from '../../router';
import { products, Product } from '../../data';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface Props { slug?: string; template?: boolean }

const templateProduct: Product = {
  slug: 'template',
  name: '产品名称',
  track: 'AI 心理伴侣',
  oneLiner: '一句话定位：这款产品在解决谁的什么问题。',
  coreExperience: '核心体验：进入产品后，用户经历的关键互动。',
  worthLearning: '值得学：从这款产品提炼的可迁移产品判断。',
  risk: '风险提示：使用与商业化层面需要警惕的事。',
  confidence: '中',
  imageSource: '占位图：图片来源应注明 OG / 官网截图 / App Store 截图等。',
  image: products[0].image,
  url: 'https://example.com',
  detail: {
    take30s: '30 秒带走：用一段克制的话告诉读者，这款产品最值得记住的一个判断。',
    positioning: '产品定位：面向谁，提供什么，与同赛道竞品的差异。',
    userPain: ['痛点 1：具体的、可被识别的真实痛点。', '痛点 2：补足读者画像。', '痛点 3：必要时讲清楚使用情境。'],
    coreExperienceLong: '核心体验（长版）：从打开 App 到完成一次有意义的互动的完整路径，关键交互节点，节奏与情绪。',
    psychMechanism: ['对应的心理学技术 1。', '对应的心理学技术 2。', '对应的心理学技术 3。'],
    aiRole: 'AI 的角色：在体验里 AI 承担什么、不承担什么。能力边界如何被设计。',
    business: '商业模式：向谁收钱，订阅价位/企业合同/平台分成等。',
    safety: '安全边界：高风险场景下的降级、转介与免责设计。',
    inspiration: ['启发 1', '启发 2', '启发 3'],
    learningCard: '学习卡：一句可贴在工位上的判断，用作团队共享的"产品观点"。',
    sources: [{ label: '官网 / 访谈 / 评测', note: '说明每条来源的访问时间与可信度' }],
  },
};

export function ProductPage({ slug, template }: Props) {
  const p = template ? templateProduct : products.find(x => x.slug === slug);
  if (!p) return <div className="py-40 text-center">未找到该产品</div>;
  const d = p.detail ?? templateProduct.detail!;

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
            {template && <Pill tone="warm">详情页模板</Pill>}
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
            <p className="m-0" style={{ fontSize: '1.05rem', lineHeight: 1.9 }}>{d.take30s}</p>
          </div>
        </Container>
      </section>

      {/* Detail grid */}
      <section className="pb-16">
        <Container>
          <div className="grid md:grid-cols-12 gap-10">
            <article className="md:col-span-8 prose-cn">
              <Block label="01" title="产品定位"><p>{d.positioning}</p></Block>
              <Block label="02" title="用户痛点"><ul>{d.userPain.map((x, i) => <li key={i}>{x}</li>)}</ul></Block>
              <Block label="03" title="核心体验"><p>{d.coreExperienceLong}</p></Block>
              <Block label="04" title="心理学机制"><ul>{d.psychMechanism.map((x, i) => <li key={i}>{x}</li>)}</ul></Block>
              <Block label="05" title="AI 的角色"><p>{d.aiRole}</p></Block>
              <Block label="06" title="商业模式"><p>{d.business}</p></Block>
              <Block label="07" title="安全边界">
                <div className="hairline rounded-md p-5" style={{ background: 'rgba(184,107,94,0.06)', borderColor: 'rgba(184,107,94,0.3)' }}>
                  <div className="font-mono text-[11px] tracking-widest mb-2" style={{ color: 'var(--accent-risk)' }}>SAFETY NOTE</div>
                  <p className="m-0">{d.safety}</p>
                </div>
              </Block>
              <Block label="08" title="风险提示">
                <div className="hairline rounded-md p-5" style={{ background: 'rgba(214,166,106,0.08)', borderColor: 'rgba(214,166,106,0.35)' }}>
                  <div className="font-mono text-[11px] tracking-widest mb-2" style={{ color: 'var(--accent-warm)' }}>RISK NOTE · 待核验事项</div>
                  <p className="m-0">{p.risk}</p>
                </div>
              </Block>
              <Block label="09" title="创业启发"><ul>{d.inspiration.map((x, i) => <li key={i}>{x}</li>)}</ul></Block>
            </article>

            <aside className="md:col-span-4 md:sticky md:top-24 self-start space-y-5">
              <div className="hairline rounded-md p-5" style={{ background: 'var(--bg-cool)' }}>
                <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--accent-blue)' }}>学习卡 · LEARNING CARD</div>
                <p className="m-0 font-serif" style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>"{d.learningCard}"</p>
              </div>
              <div className="hairline rounded-md p-5" style={{ background: 'var(--bg-paper)' }}>
                <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--ink-tertiary)' }}>来源与核验</div>
                <ul className="m-0 p-0 list-none space-y-3">
                  {d.sources.map((s, i) => (
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

function Block({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[12px] tracking-widest" style={{ color: 'var(--accent-green)' }}>{label}</span>
        <h2 className="m-0" style={{ fontSize: '1.35rem' }}>{title}</h2>
      </div>
      <div className="hairline-t pt-4">{children}</div>
    </section>
  );
}
