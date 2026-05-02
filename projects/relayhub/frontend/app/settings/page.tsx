import { AppShell } from "@/components/app-shell";
import { SettingsView } from "@/components/views/settings-view";

export default function SettingsPage() {
  return (
    <AppShell
      title="系统设置"
      description="这里先只管一件重要的事：谁能调用 RelayHub 的中转 API。也就是门禁卡，而不是上游厂商的模型密钥。"
    >
      <SettingsView />
    </AppShell>
  );
}
