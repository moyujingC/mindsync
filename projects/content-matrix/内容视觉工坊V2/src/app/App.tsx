import {
  LayoutGrid,
  FileType,
  Palette,
  ImageIcon,
  History,
  Settings,
  Search,
} from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Workbench } from "./components/workbench";
import { WechatLayout } from "./components/wechat-layout";
import { StyleAssets } from "./components/style-assets";
import { GeneralImage } from "./components/general-image";
import { SyncRecords } from "./components/sync-records";
import { WorkspaceProvider, useWorkspace, type WorkspaceTab } from "./workspace";

const TABS = [
  { id: "workbench", label: "工作台", icon: LayoutGrid },
  { id: "wechat", label: "公众号排版", icon: FileType },
  { id: "assets", label: "风格资产", icon: Palette },
  { id: "image", label: "通用出图", icon: ImageIcon },
  { id: "sync", label: "同步记录", icon: History },
] as const;

export default function App() {
  return (
    <AppErrorBoundary>
      <WorkspaceProvider>
        <AppShell />
      </WorkspaceProvider>
    </AppErrorBoundary>
  );
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; stack: string }
> {
  state = { error: null as Error | null, stack: "" };

  static getDerivedStateFromError(error: Error) {
    return { error, stack: "" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, stack: info.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 32,
          background: "#F2F0EB",
          color: "#2E3340",
          fontFamily:
            '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",-apple-system,sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 760,
            border: "1px solid #E0D8C8",
            background: "#FBFAF7",
            borderRadius: 8,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600 }}>页面运行出错</div>
          <div style={{ marginTop: 8, color: "#8A5A44", fontSize: 13 }}>
            {this.state.error.message}
          </div>
          {this.state.stack ? (
            <pre
              style={{
                marginTop: 16,
                whiteSpace: "pre-wrap",
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              {this.state.stack}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}

function AppShell() {
  const { activeTab, setActiveTab } = useWorkspace();

  return (
    <div
      className="size-full min-h-screen flex flex-col"
      style={{
        background: "#F2F0EB",
        color: "#2E3340",
        fontFamily:
          '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",-apple-system,sans-serif',
      }}
    >
      <header
        className="flex items-center justify-between px-8 h-16 border-b"
        style={{ borderColor: "#E5E2DA", background: "#FBFAF7" }}
      >
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg,#8FA3B8 0%,#5B6E84 100%)",
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ background: "#FBFAF7", opacity: 0.9 }}
              />
            </div>
            <div className="leading-tight">
              <div style={{ color: "#2E3340", letterSpacing: "0.02em" }}>
                内容视觉工坊
              </div>
              <div style={{ color: "#A0A4AD", fontSize: 11 }}>
                Content Visual Studio
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as WorkspaceTab)}
                  className="flex items-center gap-2 px-3.5 h-9 rounded-md transition-colors"
                  style={{
                    color: active ? "#2E3340" : "#7A8090",
                    background: active ? "#ECEEF2" : "transparent",
                  }}
                >
                  <Icon size={15} strokeWidth={1.6} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 h-8 rounded-md"
            style={{ background: "#ECEAE3", color: "#8A8F99" }}
          >
            <Search size={14} strokeWidth={1.6} />
            <span style={{ fontSize: 13 }}>搜索文章 / 资产</span>
            <span
              className="ml-6 px-1.5 rounded text-xs"
              style={{ background: "#FBFAF7", color: "#A0A4AD" }}
            >
              ⌘K
            </span>
          </div>
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center"
            style={{ color: "#7A8090" }}
          >
            <Settings size={16} strokeWidth={1.6} />
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center ml-1"
            style={{ background: "#D6DEE7", color: "#5B6E84", fontSize: 12 }}
          >
            林
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {activeTab === "workbench" && <Workbench />}
        {activeTab === "wechat" && <WechatLayout />}
        {activeTab === "assets" && <StyleAssets />}
        {activeTab === "image" && <GeneralImage />}
        {activeTab === "sync" && <SyncRecords />}
      </main>
    </div>
  );
}
