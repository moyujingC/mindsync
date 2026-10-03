export default function Eyebrow({ en, zh }: { en: string; zh: string }) {
  return <div className="eyebrow"><span>{en}</span><i aria-hidden="true"/><span>{zh}</span></div>;
}
