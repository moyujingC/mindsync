import { ChevronDown, History, Settings, HelpCircle, Search } from "lucide-react";
import { Separator } from "./ui/separator";
import type { AppTabKey } from "../types";

interface TopNavProps {
  activeTab: AppTabKey;
  onTabChange: (tab: AppTabKey) => void;
}

const tabs: Array<{ key: AppTabKey; label: string }> = [
  { key: "workspace", label: "工作台" },
  { key: "style-library", label: "风格资产" },
  { key: "asset-library", label: "素材库" },
  { key: "sync-history", label: "同步记录" },
];

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <header className="h-12 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-5 gap-4 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-[5px] bg-primary text-primary-foreground flex items-center justify-center" style={{ fontFamily: "var(--font-serif)" }}>
          <span className="text-[12px]">墨</span>
        </div>
        <span className="text-[13px] tracking-wide" style={{ fontFamily: "var(--font-serif)", fontWeight: 600 }}>内容视觉工坊</span>
      </div>

      <Separator orientation="vertical" className="h-4 mx-1" />

      <nav className="flex items-center gap-0.5 text-[12.5px]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === tab.key ? { fontWeight: 500 } : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 max-w-[320px] ml-3">
        <div className="flex items-center gap-2 px-2.5 h-7 rounded-md bg-secondary/60 text-[12px] text-muted-foreground hover:bg-secondary/80 transition-colors cursor-text">
          <Search className="w-3 h-3" />
          <span>检索文章、卡片或同步记录</span>
          <span className="ml-auto text-[10px] tracking-widest opacity-70">⌘K</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button className="flex items-center gap-1.5 text-[12px] text-foreground/85 px-2 py-1 rounded-md hover:bg-secondary/60 transition-colors">
          <span className="w-4 h-4 rounded-[3px] bg-primary text-primary-foreground flex items-center justify-center text-[9px]" style={{ fontFamily: "var(--font-serif)" }}>墨</span>
          墨予镜
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
        <Separator orientation="vertical" className="h-4 mx-1.5" />
        <IconBtn><History className="w-3.5 h-3.5" /></IconBtn>
        <IconBtn><Settings className="w-3.5 h-3.5" /></IconBtn>
        <IconBtn><HelpCircle className="w-3.5 h-3.5" /></IconBtn>
        <div className="w-6 h-6 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center text-[10.5px] ml-1.5" style={{ fontFamily: "var(--font-serif)" }}>予</div>
      </div>
    </header>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
      {children}
    </button>
  );
}
