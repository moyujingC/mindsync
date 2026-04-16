import { ReactNode } from "react";

interface SectionProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function Section({ title, description, actions, children }: SectionProps) {
  return (
    <section className="section-card">
      <div className="section-head">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
