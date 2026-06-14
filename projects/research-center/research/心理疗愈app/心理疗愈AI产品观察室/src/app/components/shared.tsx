import { ReactNode } from 'react';
import { Link, Route } from '../router';
import type { Confidence, Product } from '../data';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1180px] px-5 md:px-8 ${className}`}>{children}</div>;
}

export function Reading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[720px] px-5 md:px-0 ${className}`}>{children}</div>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-[12px] tracking-[0.25em] uppercase font-mono"
      style={{ color: 'var(--ink-tertiary)' }}>
      <span className="inline-block h-px w-8" style={{ background: 'var(--accent-green)' }} />
      {children}
    </div>
  );
}

export function TrackBadge({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-sm text-[12px] hairline"
      style={{ background: 'var(--bg-soft)', color: 'var(--ink-secondary)' }}
    >
      {name}
    </span>
  );
}

const conf: Record<Confidence, { c: string; b: string; t: string }> = {
  高:   { c: 'var(--accent-green)', b: 'rgba(106,155,138,0.10)', t: '高置信' },
  中:   { c: 'var(--accent-blue)',  b: 'rgba(111,147,183,0.10)', t: '中置信' },
  低:   { c: 'var(--accent-warm)',  b: 'rgba(214,166,106,0.12)', t: '低置信' },
  待核验:{ c: 'var(--ink-tertiary)',b: 'rgba(138,149,152,0.12)', t: '待核验' },
};

export function ConfidenceBadge({ value }: { value: Confidence }) {
  const v = conf[value];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[12px]"
      style={{ color: v.c, background: v.b }}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: v.c }} />
      置信度 · {value}
    </span>
  );
}

export function CTAButton({
  children,
  to,
  variant = 'primary',
}: {
  children: ReactNode;
  to: Route;
  variant?: 'primary' | 'ghost';
}) {
  if (variant === 'primary') {
    return (
      <Link to={to}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-[14px] no-underline hover:no-underline"
        style={{ background: 'var(--ink-primary)', color: '#F6F7F5' }}>
        {children} <span aria-hidden>→</span>
      </Link>
    );
  }
  return (
    <Link to={to}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-[14px] hairline no-underline hover:no-underline"
      style={{ color: 'var(--ink-primary)', background: 'transparent' }}>
      {children} <span aria-hidden>→</span>
    </Link>
  );
}

export function ResearchCard({ p }: { p: Product }) {
  return (
    <Link to={{ name: 'product', slug: p.slug }}
      className="group block hairline rounded-md overflow-hidden no-underline hover:no-underline"
      style={{ background: 'var(--bg-paper)' }}>
      <div className="aspect-[16/10] overflow-hidden relative" style={{ background: 'var(--bg-soft)' }}>
        <ImageWithFallback src={p.image} alt={p.imageAlt ?? p.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
        <div className="absolute top-3 left-3"><TrackBadge name={p.track} /></div>
        <div className="absolute top-3 right-3"><ConfidenceBadge value={p.confidence} /></div>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-baseline gap-2">
          <h3 className="m-0" style={{ fontSize: '1.15rem' }}>{p.name}</h3>
          <span className="text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>· {p.track}</span>
        </div>
        <p className="m-0 text-[14px]" style={{ color: 'var(--ink-primary)' }}>{p.oneLiner}</p>
        <div className="grid grid-cols-1 gap-2 pt-2 hairline-t" />
        <Field label="核心体验" text={p.coreExperience} />
        <Field label="值得学" text={p.worthLearning} />
        <Field label="风险提示" text={p.risk} risk />
        <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[12px]" style={{ color: 'var(--ink-tertiary)' }}>
          <span className="leading-relaxed sm:truncate sm:max-w-[70%]">图片来源：{p.imageSource}</span>
          <span className="shrink-0" style={{ color: 'var(--accent-green)' }}>查看详情 →</span>
        </div>
      </div>
    </Link>
  );
}

function Field({ label, text, risk }: { label: string; text: string; risk?: boolean }) {
  return (
    <div className="text-[13px]">
      <span className="font-mono text-[11px] tracking-wider mr-2"
        style={{ color: risk ? 'var(--accent-risk)' : 'var(--ink-tertiary)' }}>{label}</span>
      <span style={{ color: 'var(--ink-primary)' }}>{text}</span>
    </div>
  );
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'warm' | 'blue' | 'green' }) {
  const map = {
    default: { c: 'var(--ink-secondary)', b: 'var(--bg-soft)' },
    warm:    { c: 'var(--accent-warm)',   b: 'rgba(214,166,106,0.12)' },
    blue:    { c: 'var(--accent-blue)',   b: 'rgba(111,147,183,0.10)' },
    green:   { c: 'var(--accent-green)',  b: 'rgba(106,155,138,0.10)' },
  }[tone];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[12px]"
      style={{ color: map.c, background: map.b }}>{children}</span>
  );
}
