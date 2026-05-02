import { AppShell } from "@/components/app-shell";
import { ModelsView } from "@/components/views/models-view";

export default function ModelsPage() {
  return (
    <AppShell
      title="模型库"
      description="这里是模型条目、密钥状态和测试状态的正式维护面。模型库负责定义真实上游，入口页负责决定谁用哪个模型。"
    >
      <ModelsView />
    </AppShell>
  );
}
