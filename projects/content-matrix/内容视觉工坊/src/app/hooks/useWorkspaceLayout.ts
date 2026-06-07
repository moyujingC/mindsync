import { useEffect, useState } from "react";
import type { InputMode, WorkspaceLayoutState } from "../types";

const TABLET_BREAKPOINT = 1024;

function readIsTablet() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.innerWidth < TABLET_BREAKPOINT;
}

export function useWorkspaceLayout() {
  const [layout, setLayout] = useState<WorkspaceLayoutState>({
    inputMode: "md",
    isLeftPanelOpen: false,
    isRightPanelOpen: false,
  });

  const [isTablet, setIsTablet] = useState(readIsTablet);

  useEffect(() => {
    const onResize = () => {
      const nextIsTablet = readIsTablet();
      setIsTablet(nextIsTablet);
      if (!nextIsTablet) {
        setLayout((prev) => ({
          ...prev,
          isLeftPanelOpen: false,
          isRightPanelOpen: false,
        }));
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const setInputMode = (inputMode: InputMode) => {
    setLayout((prev) => ({ ...prev, inputMode }));
  };

  const toggleLeftPanel = () => {
    setLayout((prev) => ({ ...prev, isLeftPanelOpen: !prev.isLeftPanelOpen }));
  };

  const toggleRightPanel = () => {
    setLayout((prev) => ({ ...prev, isRightPanelOpen: !prev.isRightPanelOpen }));
  };

  const closePanels = () => {
    setLayout((prev) => ({ ...prev, isLeftPanelOpen: false, isRightPanelOpen: false }));
  };

  return {
    layout,
    isTablet,
    setInputMode,
    toggleLeftPanel,
    toggleRightPanel,
    closePanels,
  };
}
