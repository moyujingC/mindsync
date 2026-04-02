import test from "node:test";
import assert from "node:assert/strict";
import sampleInput from "../data/sample-profile-01.json" with { type: "json" };
import sampleInput02 from "../data/sample-profile-02.json" with { type: "json" };
import sampleInput03 from "../data/sample-profile-03.json" with { type: "json" };
import reviewFeedback03 from "../data/review-feedback-03.json" with { type: "json" };
import {
  applyReviewFeedbackToCareerAssetInput,
  createCareerAssetInputFromWorkflowSnapshot,
  createCareerAssetMarkdown
} from "../domain/career-asset.js";

test("createCareerAssetMarkdown renders required sections", () => {
  const markdown = createCareerAssetMarkdown(
    createCareerAssetInputFromWorkflowSnapshot(sampleInput)
  );

  assert.match(markdown, /# Career Asset/);
  assert.match(markdown, /## 1\. 当前目标与方向/);
  assert.match(markdown, /## 2\. 职业时间线摘要/);
  assert.match(markdown, /## 3\. 叙事主线初稿/);
  assert.match(markdown, /## 4\. 待补信息与下一步建议/);
});

test("createCareerAssetMarkdown includes timeline and follow-up questions", () => {
  const markdown = createCareerAssetMarkdown(
    createCareerAssetInputFromWorkflowSnapshot(sampleInput)
  );

  assert.match(markdown, /### 阶段一/);
  assert.match(markdown, /互联网运营/);
  assert.match(markdown, /哪一段经历最能代表你的内容策划能力/);
});

test("createCareerAssetInputFromWorkflowSnapshot supports gap-period sample", () => {
  const markdown = createCareerAssetMarkdown(
    createCareerAssetInputFromWorkflowSnapshot(sampleInput02)
  );

  assert.match(markdown, /空档期/);
  assert.match(markdown, /家庭照护者/);
});

test("createCareerAssetInputFromWorkflowSnapshot supports failed-startup sample", () => {
  const markdown = createCareerAssetMarkdown(
    createCareerAssetInputFromWorkflowSnapshot(sampleInput03)
  );

  assert.match(markdown, /创业团队核心成员/);
  assert.match(markdown, /失败/);
});

test("applyReviewFeedbackToCareerAssetInput updates narrative and recommendations", () => {
  const baseInput = createCareerAssetInputFromWorkflowSnapshot(sampleInput03);
  const reviewedInput = applyReviewFeedbackToCareerAssetInput(baseInput, reviewFeedback03);
  const markdown = createCareerAssetMarkdown(reviewedInput);

  assert.match(markdown, /需要被诚实说明/);
  assert.match(markdown, /最大收获/);
  assert.match(markdown, /关键复盘写成可复用表达/);
});
