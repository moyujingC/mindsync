import { Container, Reading, Pill, SectionLabel } from '../shared';
import { Link } from '../../router';
import { articles, Article } from '../../data';

const template: Article = {
  slug: 'template',
  title: '文章标题：在这里写下一个克制但有判断力的标题',
  excerpt: '副标题/摘要：用一两句话告诉读者，他们读完这一篇能带走什么。',
  date: '2026-06-04',
  tag: '方法论',
  readTime: '10 分钟',
  body: [
    { type: 'p', text: '导语段落：用一段简短的话引入这一篇文章要回答的问题。建议在 80 字以内，不放结论，留出阅读欲望。' },
    { type: 'h2', text: '一、第一个段落标题' },
    { type: 'p', text: '正文段落示例：中文阅读体验需要克制的字号、舒展的行距，以及最重要的——一行不要太长。本站正文区采用 720px 最大宽度，每行约 30–34 个汉字，是长篇阅读的舒适区。' },
    { type: 'quote', text: '可以使用引用块来高亮一句你愿意被读者记住的话。' },
    { type: 'h2', text: '二、第二个段落标题' },
    { type: 'ul', items: ['列表用于平行结构的要点。', '每条尽量 1 句话内说清。', '超过 5 条建议改回段落。'] },
    { type: 'h3', text: '一个三级标题' },
    { type: 'p', text: '收束段：可以用一句简短的话收束这一节，或者直接进入下一段。' },
  ],
};

interface Props { slug?: string; isTemplate?: boolean }

export function ArticlePage({ slug, isTemplate }: Props) {
  const a = isTemplate ? template : (articles.find(x => x.slug === slug) ?? template);
  const body = a.body ?? template.body!;
  return (
    <main>
      <section className="pt-14 pb-10">
        <Container>
          <div className="text-[12px] mb-6 flex items-center gap-2" style={{ color: 'var(--ink-tertiary)' }}>
            <Link to={{ name: 'articles' }} style={{ color: 'var(--ink-tertiary)' }}>赛道观察</Link>
            <span>/</span>
            <span style={{ color: 'var(--ink-primary)' }}>{a.tag}</span>
            {isTemplate && <Pill tone="warm">文章模板</Pill>}
          </div>
          <Reading>
            <SectionLabel>{a.tag.toUpperCase()}</SectionLabel>
            <h1 className="mt-4 mb-5" style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.4rem)', lineHeight: 1.4 }}>{a.title}</h1>
            <p className="m-0" style={{ color: 'var(--ink-secondary)', fontSize: '1.05rem', lineHeight: 1.85 }}>{a.excerpt}</p>
            <div className="mt-6 flex items-center gap-4 text-[12px] font-mono" style={{ color: 'var(--ink-tertiary)' }}>
              <span>{a.date}</span><span>·</span><span>{a.readTime}</span><span>·</span><span>OBSERVATORY EDITORS</span>
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
            {articles.filter(x => x.slug !== a.slug).slice(0, 3).map(x => (
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
