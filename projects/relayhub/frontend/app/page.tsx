import { AppShell } from "@/components/app-shell";
import { EntriesView } from "@/components/views/entries-view";

export default function HomePage() {
  return (
    <AppShell
      title="入口工作台"
      description="先看入口，而不是先看模型。你未来日常切模型，应该先从这里确认：哪个入口现在实际会打到哪个真实模型。"
    >
      <EntriesView />
    </AppShell>
  );
}
