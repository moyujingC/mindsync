import { afterEach, describe, expect, it, vi } from "vitest";

import { isReportFollowupEnabled } from "./config";

describe("shared/api config", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps report followup mocked by default in local dev preview", () => {
    expect(isReportFollowupEnabled()).toBe(false);
  });

  it("allows local dev preview to opt into the real report followup API", () => {
    vi.stubGlobal("process", {
      env: {
        AIMANDALA_REPORT_FOLLOWUP_ENABLED: "1",
      },
    });

    expect(isReportFollowupEnabled()).toBe(true);
  });

  it("allows local dev preview to keep the real report followup API disabled", () => {
    vi.stubGlobal("process", {
      env: {
        AIMANDALA_REPORT_FOLLOWUP_ENABLED: "0",
      },
    });

    expect(isReportFollowupEnabled()).toBe(false);
  });
});
