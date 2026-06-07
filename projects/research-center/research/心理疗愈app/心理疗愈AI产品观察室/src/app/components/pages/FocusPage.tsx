import { Container, ResearchCard, SectionLabel, Pill } from '../shared';
import { Link } from '../../router';
import { featuredProducts } from '../../data';

const compareRows = [
  {
    label: '它代表的路线',
    values: [
      '高关系强度的消费者心理支持',
      '自我记录型长期陪跑',
      '教练方法论平台化',
      '高责任医疗工作流系统',
    ],
  },
  {
    label: '主要用户',
    values: [
      '个体消费者',
      '个体消费者',
      '组织、教练、培训方',
      '行为健康机构、临床团队',
    ],
  },
  {
    label: '核心问题',
    values: [
      '如何让用户感觉被持续理解',
      '如何把记录变成反思与成长',
      '如何把方法论稳定规模化交付',
      '如何让机构少出错、少漏钱、少返工',
    ],
  },
  {
    label: '产品重心',
    values: [
      '关系与安全',
      '记忆与连续性',
      '平台与配置',
      '工作流与治理',
    ],
  },
  {
    label: '商业形态',
    values: [
      '先规模，再看订阅 / EAP / 平台延展',
      '订阅',
      'B2B / 白标平台',
      '高客单价 B2B 医疗平台',
    ],
  },
  {
    label: '最该学什么',
    values: [
      '高责任关系设计怎么和模型叙事一起成立',
      '从高频低门槛习惯切入，再把价值做深',
      '把专家服务做成可配置平台',
      '抓住机构最痛、最贵、最可量化的流程问题',
    ],
  },
];

export function FocusPage() {
  return (
    <main>
      <section className="pt-16 md:pt-20 pb-10" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <SectionLabel>FOCUS SAMPLES · 重点样本总览</SectionLabel>
          <h1 className="mt-4 mb-4" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)' }}>
            先横向比较这 4 个样本，<br />再决定先读哪一个
          </h1>
          <p className="m-0 max-w-[760px]" style={{ color: 'var(--ink-secondary)', lineHeight: 1.85 }}>
            这 4 个重点样本不是同一类产品里的平替，而是 4 条不同路线：高关系强度消费者心理支持、自我记录型长期陪跑、教练方法论平台化，以及高责任医疗工作流系统。先看这张总览，再点进单个详情页，会更容易看清它们各自在解决什么问题。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to={{ name: 'map' }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-[14px] hairline no-underline hover:no-underline"
              style={{ color: 'var(--ink-primary)', background: 'var(--bg-paper)' }}
            >
              返回产品地图 <span aria-hidden>→</span>
            </Link>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {featuredProducts.map((product) => (
              <ResearchCard key={product.slug} p={product} />
            ))}
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16 hairline-t" style={{ background: 'var(--bg-paper)' }}>
        <Container>
          <div className="max-w-[980px]">
            <SectionLabel>COMPARE · 横向对比</SectionLabel>
            <h2 className="mt-4 mb-4">一张表看清它们为什么不是同一类产品</h2>
            <p className="m-0 mb-8 max-w-[760px]" style={{ color: 'var(--ink-secondary)', lineHeight: 1.85 }}>
              这张表不追求把所有细节都塞进去，只回答几个最重要的问题：它们分别在解决什么问题、核心价值在哪、商业逻辑有什么不同、作为创业样本最该学什么。
            </p>
          </div>

          <div className="overflow-x-auto hairline rounded-md" style={{ background: 'var(--bg-base)' }}>
            <table className="w-full min-w-[960px] border-collapse">
              <thead>
                <tr className="hairline-b" style={{ background: 'var(--bg-soft)' }}>
                  <th className="text-left p-4 text-[13px] font-mono tracking-widest uppercase" style={{ color: 'var(--ink-tertiary)', width: '18%' }}>维度</th>
                  {featuredProducts.map((product) => (
                    <th key={product.slug} className="text-left p-4 align-top">
                      <div className="flex flex-col gap-2">
                        <div className="font-serif text-[18px]" style={{ color: 'var(--ink-primary)' }}>{product.name}</div>
                        <Pill tone="green">{product.track}</Pill>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, rowIndex) => (
                  <tr key={row.label} className={rowIndex !== compareRows.length - 1 ? 'hairline-b' : undefined}>
                    <td className="p-4 align-top text-[13px] font-mono tracking-wide" style={{ color: 'var(--ink-tertiary)' }}>
                      {row.label}
                    </td>
                    {row.values.map((value, index) => (
                      <td key={`${row.label}-${index}`} className="p-4 align-top text-[14px]" style={{ color: 'var(--ink-primary)', lineHeight: 1.8 }}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16 hairline-t" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <SectionLabel>READ ORDER · 建议顺序</SectionLabel>
              <h2 className="mt-4 mb-4">如果你第一次来，建议这样读</h2>
              <p className="m-0" style={{ color: 'var(--ink-secondary)', lineHeight: 1.8 }}>
                这不是推荐榜单，而是理解路径。顺着这个顺序读，会更容易从熟悉的日常场景走到更复杂的机构系统。
              </p>
            </div>
            <div className="md:col-span-8 grid sm:grid-cols-2 gap-4">
              {[
                ['01', '先看 Rosebud', '最贴近日常经验，也最容易看懂“自我记录型 AI 产品”是怎么成立的。'],
                ['02', '再看 Ash', '能看到高关系强度产品为什么更有品牌张力，也更有责任压力。'],
                ['03', '再看 Rocky.ai', '能打开“AI 不只是产品，也可以是平台”的视角。'],
                ['04', '最后看 Eleos Health', '能看到高支付意愿、高责任行业里的工作流型 AI 到底在卖什么。'],
              ].map(([n, title, body]) => (
                <div key={n} className="hairline rounded-md p-5" style={{ background: 'var(--bg-paper)' }}>
                  <div className="font-mono text-[11px] tracking-widest mb-2" style={{ color: 'var(--accent-green)' }}>STEP {n}</div>
                  <h3 className="m-0 mb-2" style={{ fontSize: '1.05rem' }}>{title}</h3>
                  <p className="m-0 text-[14px]" style={{ color: 'var(--ink-secondary)', lineHeight: 1.75 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
