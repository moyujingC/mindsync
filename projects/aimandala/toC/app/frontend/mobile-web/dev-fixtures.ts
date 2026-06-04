import mandalaTest01Url from "../../../../fixtures/toc-mvp/assets/mandala-test-01.JPG?url";
import mandalaTest02Url from "../../../../fixtures/toc-mvp/assets/mandala-test-02.jpeg?url";

import type { MobileWebUploadDraft } from "./state";

export interface MobileWebDevFixturePreset {
  id: string;
  label: string;
  imageUrl: string;
  filename: string;
  contentType: string;
  draftPatch: Pick<
    MobileWebUploadDraft,
    "theme" | "paintingIntention" | "paintingFeeling" | "reportType" | "reportVariant"
  >;
}

export const mobileWebDevFixturePresets: MobileWebDevFixturePreset[] = [
  {
    id: "mandala-test-01",
    label: "测试图 01",
    imageUrl: mandalaTest01Url,
    filename: "mandala-test-01.JPG",
    contentType: "image/jpeg",
    draftPatch: {
      theme: "wealth",
      reportType: "lite",
      reportVariant: "lite",
      paintingIntention: "",
      paintingFeeling: "",
    },
  },
  {
    id: "mandala-test-02-wealth",
    label: "测试图 02 / 财富",
    imageUrl: mandalaTest02Url,
    filename: "mandala-test-02.jpeg",
    contentType: "image/jpeg",
    draftPatch: {
      theme: "wealth",
      reportType: "lite",
      reportVariant: "lite",
      paintingIntention: "",
      paintingFeeling: "",
    },
  },
];

export async function createBrowserFileFromFixture(
  preset: MobileWebDevFixturePreset,
): Promise<File> {
  const response = await fetch(preset.imageUrl);
  if (!response.ok) {
    throw new Error(`加载测试图失败：${preset.label}`);
  }

  const blob = await response.blob();
  return new File([blob], preset.filename, {
    type: blob.type || preset.contentType,
  });
}
