import type { ReportPageDescriptor } from "../pages";

export interface ReportPageShellProps {
  descriptor: ReportPageDescriptor;
}

export function ReportPageShell({ descriptor }: ReportPageShellProps) {
  return (
    <main>
      <header>
        <h1>{descriptor.title}</h1>
        <p>{descriptor.subtitle}</p>
      </header>

      {descriptor.sections.map((section) => (
        <section key={section.id}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}

      <footer>
        <button type="button">{descriptor.primaryActionLabel}</button>
      </footer>
    </main>
  );
}
