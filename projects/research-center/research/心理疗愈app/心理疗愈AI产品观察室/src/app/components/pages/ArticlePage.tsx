import { Container, Reading, SectionLabel } from '../shared';
import { Link } from '../../router';
import { articles } from '../../data';

interface Props { slug?: string }

export function ArticlePage({ slug }: Props) {
  const a = articles.find(x => x.slug === slug);
  const published = Boolean(a && a.status !== 'planned' && a.body?.length);

  if (!published) {
    return (
      <main>
        <section className="pt-14 pb-16">
          <Container>
            <Reading>
              <SectionLabel>FIELD NOTE · 后续选题</SectionLabel>
              <h1 className="mt-4 mb-5" style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)', lineHeight: 1.4 }}>{a?.title ?? '这篇文章还在准备中'}</h1>
              <p className="m-0" style={{ color: 'var(--ink-secondary)', fontSize: '1.05rem', lineHeight: 1.85 }}>{a?.excerpt ?? '为避免展示未完成内容，观察室暂不提供这篇文章的正文。'}</p>
              <div className="mt-6 flex items-center gap-4 text-[12px] font-mono" style={{ color: 'var(--ink-tertiary)' }}>
                <span>筹备中</span><span>·</span><span>暂未发布</span>
              </div>
              <div className="mt-10">
                <Link to={{ name: 'articles' }} style={{ color: 'var(--accent-green)' }}>返回赛道观察 →</Link>
              </div>
            </Reading>
          </Container>
        </section>
      </main>
    );
  }

  const body = a!.body!;

  return (
    <main>
      <section className="pt-14 pb-10">
        <Container>
          <div className="text-[12px] mb-6 flex items-center gap-2" style={{ color: 'var(--ink-tertiary)' }}>
            <Link to={{ name: 'articles' }} style={{ color: 'var(--ink-tertiary)' }}>赛道观察</Link>
            <span>/</span>
            <span style={{ color: 'var(--ink-primary)' }}>{a!.tag}</span>
          </div>
          <Reading>
            <SectionLabel>{a!.tag.toUpperCase()}</SectionLabel>
            <h1 className="mt-4 mb-5" style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)', lineHeight: 1.4 }}>{a!.title}</h1>
            <p className="m-0" style={{ color: 'var(--ink-secondary)', fontSize: '1.05rem', lineHeight: 1.85 }}>{a!.excerpt}</p>
            <div className="mt-6 flex items-center gap-4 text-[12px] font-mono" style={{ color: 'var(--ink-tertiary)' }}>
              <span>{a!.date}</span><span>·</span><span>{a!.readTime}</span><span>·</span><span>OBSERVATORY EDITORS</span>
            </div>
          </Reading>
        </Container>
      </section>
      <section className="hairline-t">
        <Container>
          <Reading className="py-12 prose-cn">
            {body.map((b, i) => {
              if (b.type === 'h2') return <h2 key={i}>{b.text}</h2>;
              if (b.type === 'h3') return <h3 key={i}>{b.text}</h3>;
              if (b.type === 'quote') return <blockquote key={i}>{b.text}</blockquote>;
              if (b.type === 'ul') return <ul key={i}>{b.items!.map((x, j) => <li key={j}>{x}</li>)}</ul>;
              return <p key={i}>{b.text}</p>;
            })}
            <div className="mt-16 pt-8 hairline-t">
              <div className="font-mono text-[11px] tracking-widest uppercase mb-3" style={{ color: 'var(--ink-tertiary)' }}>NOTES · 编者注</div>
              <p className="text-[13px] m-0" style={{ color: 'var(--ink-secondary)' }}>本文为观察室独立判断，不构成任何医疗、心理或投资建议。如需引用，请注明出处与访问日期。</p>
            </div>
          </Reading>
        </Container>
      </section>

      <section className="py-16 hairline-t" style={{ background: 'var(--bg-soft)' }}>
        <Container>
          <SectionLabel>继续阅读</SectionLabel>
          <div className="mt-6 grid md:grid-cols-3 gap-5">
            {articles.filter(x => x.slug !== a!.slug && x.status !== 'planned' && x.body?.length).slice(0, 3).map(x => (
              <Link key={x.slug} to={{ name: 'article', slug: x.slug }}
                className="hairline rounded-md p-5 no-underline hover:no-underline block"
                style={{ background: 'var(--bg-paper)' }}>
                <Pill>{x.tag}</Pill>
                <h4 className="mt-3 mb-2">{x.title}</h4>
                <p className="m-0 text-[13px]" style={{ color: 'var(--ink-secondary)' }}>{x.excerpt}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </main>
  );
}
