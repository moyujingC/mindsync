import type { CSSProperties } from 'react';

export default function ArtSlot({ file, ratio, tone = 'dark', className = '' }: { file: string; ratio: string; tone?: 'dark' | 'light'; className?: string }) {
  return <div className={`art-slot art-slot--${tone} ${className}`} style={{ '--ratio': ratio } as CSSProperties} role="img" aria-label={`插画位：${file}`}><span>插画位 · {file}</span></div>;
}
