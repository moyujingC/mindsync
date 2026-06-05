import { Container, SectionLabel, Pill } from '../shared';
import { Link } from '../../router';
import { articles, Article } from '../../data';
import { useState } from 'react';

export function ArticlesPage() {
  const tags = Array.from(new Set(articles.map(a => a.tag)));
  const [tag, setTag] = useState<string | 'all'>('all');
  const list = tag === 'all' ? articles : articles.filter(a => a.tag === tag);
  return (
    <main>
      <section className="pt-16 pb-10" style={{ background: 'var(--bg-cool)' }}>
        <Container>
          <SectionLabel>FIELD NOTES · 赛道观察</SectionLabel>
          <h1 className="mt-4 mb-4" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.6rem)' }}>长期跟踪下来的判断与方法论</h1>
          <p className="m-0 max-w-[680px]" style={{ color: 'var(--ink-secondary)' }}>
            写作频率不高。我们更愿意把同一个判断在多款产品里反复验证后再下笔。这里的每一篇都尝试给读者一个可被复用的"看法"，而不是一个新闻摘要。
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Chip active={tag === 'all'} onClick={() => setTag('all')}>全部</Chip>
            {tags.map(t => <Chip key={t} active={tag === t} onClick={() => setTag(t)}>{t}</Chip>)}
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <ul className="list-none p-0 m-0 space-y-4 max-w-[920px] mx-auto">
            {list.map((a, i) => <ArticleRow key={a.slug} a={a} i={i} />)}
          </ul>
        </Container>
      </section>
    </main>
  );
}

function ArticleRow({ a, i }: { a: Article; i: number }) {
  return (
    <li>
      <Link to={{ name: 'article', slug: a.slug }}
        className="hairline rounded-md p-6 md:p-7 grid md:grid-cols-12 gap-6 no-underline hover:no-underline group items-start"
        style={{ background: 'var(--bg-paper)' }}>
        <div className="md:col-span-2 flex md:flex-col md:items-start gap-3 md:gap-1">
          <span className="font-mono text-[11px] tracking-widest" style={{ color: 'var(--accent-green)' }}>№ {String(i + 1).padStart(2, '0')}</span>
          <span className="font-mono text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>{a.date}</span>
        </div>
        <div className="md:col-span-10">
          <div className="flex items-center gap-2 mb-2 text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>
            <Pill>{a.tag}</Pill><span>·</span><span>{a.readTime}</span>
          </div>
          <h3 className="m-0 mb-3 group-hover:underline underline-offset-4" style={{ fontSize: '1.3rem' }}>{a.title}</h3>
          <p className="m-0 text-[14.5px]" style={{ color: 'var(--ink-secondary)' }}>{a.excerpt}</p>
        </div>
      </Link>
    </li>
  );
}

function Chip({ children, active, onClick }: any) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-sm text-[13px] hairline"
      style={{
        background: active ? 'var(--ink-primary)' : 'var(--bg-paper)',
        color: active ? '#F6F7F5' : 'var(--ink-secondary)',
      }}>
      {children}
    </button>
  );
}
