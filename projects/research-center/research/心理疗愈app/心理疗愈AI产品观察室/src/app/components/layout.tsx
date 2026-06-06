import { ReactNode, useState } from 'react';
import { Link, Route, useRouter } from '../router';
import { Container } from './shared';

const navItems: { label: string; route: Route }[] = [
  { label: '首页', route: { name: 'home' } },
  { label: '产品地图', route: { name: 'map' } },
  { label: '赛道观察', route: { name: 'articles' } },
  { label: '方法论', route: { name: 'method' } },
  { label: '关于', route: { name: 'about' } },
];

export function Header() {
  const { route } = useRouter();
  const [open, setOpen] = useState(false);
  const active = (r: Route) => r.name === route.name;
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md hairline-b"
      style={{ background: 'rgba(246,247,245,0.86)' }}>
      <Container className="flex items-center justify-between h-16">
        <Link to={{ name: 'home' }} className="no-underline hover:no-underline flex items-center gap-3">
          <Logo />
          <div className="hidden sm:block leading-tight">
            <div className="font-serif text-[15px]" style={{ color: 'var(--ink-primary)' }}>心理疗愈 AI 产品观察室</div>
            <div className="text-[11px] font-mono tracking-wider" style={{ color: 'var(--ink-tertiary)' }}>OBSERVATORY · est. 2026</div>
          </div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((n) => (
            <Link key={n.label} to={n.route}
              className="px-3 py-2 rounded-sm text-[14px] no-underline hover:no-underline"
              style={{
                color: active(n.route) ? 'var(--ink-primary)' : 'var(--ink-secondary)',
                borderBottom: active(n.route) ? '1.5px solid var(--accent-green)' : '1.5px solid transparent',
              }}>{n.label}</Link>
          ))}
        </nav>
        <button onClick={() => setOpen(!open)} aria-label="menu"
          className="md:hidden p-2 hairline rounded-sm" style={{ color: 'var(--ink-primary)' }}>
          <span className="block w-4 h-px bg-current mb-1.5" />
          <span className="block w-4 h-px bg-current mb-1.5" />
          <span className="block w-4 h-px bg-current" />
        </button>
      </Container>
      {open && (
        <div className="md:hidden hairline-t" style={{ background: 'var(--bg-paper)' }}>
          <Container className="py-3 flex flex-col">
            {navItems.map((n) => (
              <Link key={n.label} to={n.route}
                className="py-2 text-[15px] no-underline hover:no-underline"
                style={{ color: active(n.route) ? 'var(--ink-primary)' : 'var(--ink-secondary)' }}
                onClick={() => setOpen(false)}>{n.label}</Link>
            ))}
          </Container>
        </div>
      )}
    </header>
  );
}

function Logo() {
  return (
    <div className="relative w-9 h-9 rounded-full flex items-center justify-center"
      style={{ background: 'var(--bg-soft)' }}>
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none">
        <circle cx="16" cy="16" r="11" stroke="var(--accent-green)" strokeWidth="1.4" />
        <path d="M10 18c2-3 4-4 6-4s4 1 6 4" stroke="var(--ink-primary)" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="16" cy="11" r="1.6" fill="var(--accent-warm)" />
      </svg>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 hairline-t" style={{ background: 'var(--bg-paper)' }}>
      <Container className="py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <div className="font-serif text-[18px] mb-3">心理疗愈 AI 产品观察室</div>
          <p className="text-[13px] m-0 max-w-md" style={{ color: 'var(--ink-secondary)' }}>
            一个研究型的、有判断力的垂直观察项目。我们以克制的态度，长期拆解全球 AI 心理疗愈、AI 教练、互动日记、企业心理健康与临床工作流产品。
          </p>
        </div>
        <FooterCol title="导航" items={[
          { label: '产品地图', to: { name: 'map' } },
          { label: '赛道观察', to: { name: 'articles' } },
          { label: '方法论', to: { name: 'method' } },
        ]} />
        <FooterCol title="关于" items={[
          { label: '关于观察室', to: { name: 'about' } },
          { label: '免责声明', to: { name: 'disclaimer' } },
        ]} />
      </Container>
      <div className="hairline-t">
        <Container className="py-5 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between text-[12px]"
          style={{ color: 'var(--ink-tertiary)' }}>
          <div className="max-w-3xl leading-relaxed">
            © 2026 心理疗愈 AI 产品观察室 · 本站仅用于产品研究、学习和评论，不构成医疗建议、心理咨询建议或投资建议。
          </div>
          <div className="font-mono shrink-0">最近一次内容更新：2026-06-04</div>
        </Container>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; to: Route }[] }) {
  return (
    <div>
      <div className="font-mono text-[11px] tracking-[0.25em] uppercase mb-4" style={{ color: 'var(--ink-tertiary)' }}>{title}</div>
      <ul className="space-y-2 list-none p-0 m-0">
        {items.map(i => (
          <li key={i.label}>
            <Link to={i.to} className="text-[14px] no-underline hover:no-underline"
              style={{ color: 'var(--ink-primary)' }}>{i.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
