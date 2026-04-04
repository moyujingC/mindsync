import type { UploadPageDescriptor } from "../pages";

export interface UploadPageShellProps {
  descriptor: UploadPageDescriptor;
}

export function UploadPageShell({ descriptor }: UploadPageShellProps) {
  return (
    <main>
      <header>
        <h1>{descriptor.title}</h1>
        <p>{descriptor.subtitle}</p>
      </header>

      {descriptor.sections.map((section) => (
        <section key={section.id}>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </section>
      ))}
    </main>
  );
}
