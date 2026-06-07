import { useState, useMemo } from 'react';
import { Container, ResearchCard, SectionLabel, Pill } from '../shared';
import { products, tracks, featuredProductSlugs, Track, Confidence } from '../../data';

const confidenceLevels: Confidence[] = ['高', '中', '低', '待核验'];
const featuredSlugSet = new Set<string>(featuredProductSlugs);

export function MapPage() {
  const [activeTrack, setActiveTrack] = useState<Track | 'all'>('all');
  const [activeConf, setActiveConf] = useState<Confidence | 'all'>('all');
  const isDefaultView = activeTrack === 'all' && activeConf === 'all';

  const filtered = useMemo(() => products.filter(p =>
    (activeTrack === 'all' || p.track === activeTrack) &&
    (activeConf === 'all' || p.confidence === activeConf)
  ), [activeTrack, activeConf]);
  const featured = useMemo(
    () => products.filter((product) => featuredSlugSet.has(product.slug)),
    []
  );

  return (
    <main>
      <section className="pt-16 md:pt-20 pb-10" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <SectionLabel>PRODUCT MAP · 产品地图</SectionLabel>
          <h1 className="mt-4 mb-4" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>AI 心理产品，按角色与赛道排列</h1>
          <p className="m-0 max-w-[680px]" style={{ color: 'var(--ink-secondary)' }}>
            这张地图按"AI 在体验中承担的角色"分组。每张产品卡是一份研究摘要——不是导航条目，请用阅读研究卡的姿势来看它们。
          </p>
          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <span className="font-mono text-[11px] tracking-widest uppercase" style={{ color: 'var(--ink-tertiary)' }}>FILTER</span>
            <FilterChip active={activeTrack === 'all'} onClick={() => setActiveTrack('all')}>全部赛道</FilterChip>
            {tracks.map(t => (
              <FilterChip key={t.name} active={activeTrack === t.name} onClick={() => setActiveTrack(t.name)}>{t.name}</FilterChip>
            ))}
            <span className="mx-2 hairline h-5 w-px" />
            <FilterChip active={activeConf === 'all'} onClick={() => setActiveConf('all')}>全部置信度</FilterChip>
            {confidenceLevels.map(c => (
              <FilterChip key={c} active={activeConf === c} onClick={() => setActiveConf(c)}>{c}</FilterChip>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          {isDefaultView && (
            <div className="mb-16">
              <div className="flex items-baseline gap-4 mb-5 hairline-b pb-3">
                <span className="font-mono text-[12px]" style={{ color: 'var(--accent-green)' }}>START</span>
                <h2 className="m-0">先读这些重点样本</h2>
                <span className="text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>
                  分别代表心理伴侣、AI 日记、AI 教练、临床工作流四种路径
                </span>
              </div>
              <p className="m-0 mb-6 max-w-[720px] text-[14px]" style={{ color: 'var(--ink-secondary)' }}>
                它们不是推荐榜单，而是理解这个赛道的入口样本。先看这些代表产品，再看其余产品，会更容易分辨不同创业路径的机会、责任和风险。
              </p>
              <div className="mb-6">
                <Link to={{ name: 'focus' }} className="text-[14px]" style={{ color: 'var(--accent-green)' }}>
                  先看 4 个重点样本总览 →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {featured.map(p => <ResearchCard key={p.slug} p={p} />)}
              </div>
            </div>
          )}

          {activeTrack === 'all' ? (
            <div className="space-y-16">
              {tracks.map((t, i) => {
                const list = filtered.filter(p =>
                  p.track === t.name && (!isDefaultView || !featuredSlugSet.has(p.slug))
                );
                if (!list.length) return null;
                return (
                  <div key={t.name}>
                    <div className="flex items-baseline gap-4 mb-5 hairline-b pb-3">
                      <span className="font-mono text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>0{i + 1}</span>
                      <h2 className="m-0">{t.name}</h2>
                      <span className="text-[13px]" style={{ color: 'var(--ink-tertiary)' }}>{list.length} 个产品 · {t.desc}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {list.map(p => <ResearchCard key={p.slug} p={p} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(p => <ResearchCard key={p.slug} p={p} />)}
              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center" style={{ color: 'var(--ink-tertiary)' }}>
                  当前筛选下暂无产品。
                </div>
              )}
            </div>
          )}
        </Container>
      </section>

      <section className="py-12 hairline-t" style={{ background: 'var(--bg-soft)' }}>
        <Container className="flex flex-wrap items-center gap-6 justify-between">
          <div className="flex items-center gap-3">
            <Pill tone="green">置信度 · 高</Pill>
            <span className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>有官网/访谈/长期使用作为交叉来源</span>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone="blue">置信度 · 中</Pill>
            <span className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>有官网与试用，但缺长期数据</span>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone="warm">置信度 · 低</Pill>
            <span className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>主要基于官网与公开报道</span>
          </div>
          <div className="flex items-center gap-3">
            <Pill>待核验</Pill>
            <span className="text-[13px]" style={{ color: 'var(--ink-secondary)' }}>线索追踪中，尚未独立核验</span>
          </div>
        </Container>
      </section>
    </main>
  );
}

function FilterChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-sm text-[13px] hairline transition-colors"
      style={{
        background: active ? 'var(--ink-primary)' : 'var(--bg-paper)',
        color: active ? '#F6F7F5' : 'var(--ink-secondary)',
        borderColor: active ? 'var(--ink-primary)' : 'var(--line)',
      }}>
      {children}
    </button>
  );
}
