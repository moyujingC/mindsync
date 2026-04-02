import {
  assertCareerAssetInput,
  assertReviewFeedback,
  assertWorkflowSnapshot
} from "./types.js";

function renderBulletList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function renderTimeline(timeline) {
  return timeline
    .map(
      (stage) => `### ${stage.label}

- 主要角色：${stage.roles.join("、")}
- 关键工作：${stage.keyWork.join("；")}
- 代表成果：${stage.highlights.join("；")}
- 关键转折：${stage.transitions.join("；")}`
    )
    .join("\n\n");
}

export function createCareerAssetMarkdown(input) {
  assertCareerAssetInput(input);

  return `# Career Asset

## 1. 当前目标与方向

- 当前目标：${input.profile.currentGoal}
- 目标方向：${input.profile.targetDirection}
- 当前约束：${input.profile.constraints.join("；")}

## 2. 职业时间线摘要

${renderTimeline(input.timeline)}

## 3. 叙事主线初稿

${input.narrative.summary}

${input.narrative.reframing}

## 4. 待补信息与下一步建议

### 待补信息

${renderBulletList(input.nextSteps.followUpQuestions)}

### 下一步建议

${input.nextSteps.recommendations.map((item, index) => `${index + 1}. ${item}`).join("\n")}
`;
}

export function createCareerAssetInputFromWorkflowSnapshot(snapshot) {
  assertWorkflowSnapshot(snapshot);

  return {
    profile: snapshot.profile,
    timeline: snapshot.structuringResult.timeline,
    narrative: snapshot.structuringResult.narrative,
    nextSteps: snapshot.structuringResult.nextSteps
  };
}

export function applyReviewFeedbackToCareerAssetInput(input, reviewFeedback) {
  assertCareerAssetInput(input);
  assertReviewFeedback(reviewFeedback);

  return {
    ...input,
    narrative: {
      summary: reviewFeedback.narrativeEdits?.summary ?? input.narrative.summary,
      reframing: reviewFeedback.narrativeEdits?.reframing ?? input.narrative.reframing
    },
    nextSteps: {
      followUpQuestions: [
        ...input.nextSteps.followUpQuestions,
        ...(reviewFeedback.extraFollowUpQuestions ?? [])
      ],
      recommendations: [
        ...input.nextSteps.recommendations,
        ...(reviewFeedback.extraRecommendations ?? [])
      ]
    },
    reviewMeta: {
      summary: reviewFeedback.summary
    }
  };
}
