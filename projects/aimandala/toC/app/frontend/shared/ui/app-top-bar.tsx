import type { CSSProperties, ReactNode } from "react";

function AppTopBarBackIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
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
  className?: string;
  style?: CSSProperties;
}

export function SharedAppTopBar({
  title,
  backLabel = "返回",
  trailing,
  onBack,
  className,
  style,
}: SharedAppTopBarProps) {
  return (
    <div
      className={className ? `am-app-topbar ${className}` : "am-app-topbar"}
      style={style}
    >
      <button
        type="button"
        className="am-app-topbar__back"
        onClick={onBack}
        aria-label={backLabel}
      >
        <AppTopBarBackIcon />
      </button>
      <h1 className="am-app-topbar__title">{title}</h1>
      {trailing ?? <div className="am-app-topbar__spacer" aria-hidden="true" />}
    </div>
  );
}
