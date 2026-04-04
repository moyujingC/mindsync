import type { HistoryPageDescriptor } from "../pages";

export interface HistoryPageShellProps {
  descriptor: HistoryPageDescriptor;
}

export function HistoryPageShell({ descriptor }: HistoryPageShellProps) {
  return (
    <main>
      <header>
        <h1>{descriptor.title}</h1>
        <p>{descriptor.subtitle}</p>
      </header>

      <ul>
        {descriptor.items.map((item) => (
          <li key={item.interpretationId}>
            <h2>{item.title}</h2>
            <p>{item.subtitle}</p>
            <small>{item.canOpenReport ? "可查看报告" : "报告未就绪"}</small>
          </li>
        ))}
      </ul>
    </main>
  );
}
