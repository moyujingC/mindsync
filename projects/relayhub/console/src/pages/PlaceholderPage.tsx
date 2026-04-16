import { Section } from "../components/Section";

interface PlaceholderPageProps {
  title: string;
  eyebrow: string;
  description: string;
  purpose: string;
  futureSections: string[];
  notIncluded: string[];
}

export function PlaceholderPage({
  title,
  eyebrow,
  description,
  purpose,
  futureSections,
  notIncluded,
}: PlaceholderPageProps) {
  return (
    <div className="page-grid">
      <section className="hero-card">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </section>

      <Section title="页面目的" description="占位页也只表达目的与边界，不伪装成真实控制面。">
        <article className="data-card">
          <p>{purpose}</p>
        </article>
      </Section>

      <Section title="未来承接的信息" description="为后续真实后端接入预留结构。">
        <div className="card-grid card-grid-3">
          {futureSections.map((item) => (
            <article key={item} className="data-card">
              <span className="mini-label">Future</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="v1 明确不做" description="避免误导下一棒实现者越界进入真实控制面。">
        <div className="card-grid card-grid-3">
          {notIncluded.map((item) => (
            <article key={item} className="data-card">
              <span className="mini-label">Not in v1</span>
              <p>{item}</p>
            </article>
          ))}
        </div>
      </Section>
    </div>
  );
}
