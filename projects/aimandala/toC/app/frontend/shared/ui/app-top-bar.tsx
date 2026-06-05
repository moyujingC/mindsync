import type { ReactNode } from "react";

function AppTopBarBackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 6.5 9 12l5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface SharedAppTopBarProps {
  title: string;
  backLabel?: string;
  trailing?: ReactNode;
  onBack?: () => void;
}

export function SharedAppTopBar({
  title,
  backLabel = "返回",
  trailing,
  onBack,
}: SharedAppTopBarProps) {
  return (
    <div className="am-app-topbar">
      <button type="button" className="am-app-topbar__back" onClick={onBack} aria-label={backLabel}>
        <AppTopBarBackIcon />
      </button>
      <h1 className="am-app-topbar__title">{title}</h1>
      {trailing ?? <div className="am-app-topbar__spacer" aria-hidden="true" />}
    </div>
  );
}
