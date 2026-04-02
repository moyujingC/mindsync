/**
 * Minimal schema guards for the first MVP implementation.
 */

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function assertString(value, fieldName) {
  if (!isNonEmptyString(value)) {
    throw new Error(`Invalid field "${fieldName}": expected non-empty string`);
  }
}

function assertStringArray(value, fieldName) {
  if (!Array.isArray(value) || value.some((item) => !isNonEmptyString(item))) {
    throw new Error(`Invalid field "${fieldName}": expected string[]`);
  }
}

function assertTimelineStage(stage, index) {
  if (!stage || typeof stage !== "object") {
    throw new Error(`Invalid timeline stage at index ${index}`);
  }

  assertString(stage.label, `timeline[${index}].label`);
  assertStringArray(stage.roles, `timeline[${index}].roles`);
  assertStringArray(stage.keyWork, `timeline[${index}].keyWork`);
  assertStringArray(stage.highlights, `timeline[${index}].highlights`);
  assertStringArray(stage.transitions, `timeline[${index}].transitions`);
}

function assertExplorationSession(session) {
  if (!session || typeof session !== "object") {
    throw new Error('Missing "explorationSession" object');
  }

  assertStringArray(session.rawSignals, "explorationSession.rawSignals");

  if (!Array.isArray(session.experienceItems) || session.experienceItems.length === 0) {
    throw new Error('Missing or empty "explorationSession.experienceItems"');
  }

  session.experienceItems.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Invalid experience item at index ${index}`);
    }

    assertString(item.stageLabel, `experienceItems[${index}].stageLabel`);
    assertString(item.role, `experienceItems[${index}].role`);
    assertStringArray(item.keyWork, `experienceItems[${index}].keyWork`);
    assertStringArray(item.highlights, `experienceItems[${index}].highlights`);
    assertStringArray(item.transitions, `experienceItems[${index}].transitions`);
  });
}

function assertStructuringResult(result) {
  if (!result || typeof result !== "object") {
    throw new Error('Missing "structuringResult" object');
  }

  if (!Array.isArray(result.timeline) || result.timeline.length === 0) {
    throw new Error('Missing or empty "structuringResult.timeline"');
  }

  result.timeline.forEach(assertTimelineStage);

  if (!result.narrative || typeof result.narrative !== "object") {
    throw new Error('Missing "structuringResult.narrative" object');
  }

  assertString(result.narrative.summary, "structuringResult.narrative.summary");
  assertString(result.narrative.reframing, "structuringResult.narrative.reframing");

  if (!result.nextSteps || typeof result.nextSteps !== "object") {
    throw new Error('Missing "structuringResult.nextSteps" object');
  }

  assertStringArray(
    result.nextSteps.followUpQuestions,
    "structuringResult.nextSteps.followUpQuestions"
  );
  assertStringArray(
    result.nextSteps.recommendations,
    "structuringResult.nextSteps.recommendations"
  );
}

export function assertReviewFeedback(reviewFeedback) {
  if (!reviewFeedback || typeof reviewFeedback !== "object") {
    throw new Error('Missing "reviewFeedback" object');
  }

  assertString(reviewFeedback.summary, "reviewFeedback.summary");

  if (reviewFeedback.narrativeEdits !== undefined) {
    if (!reviewFeedback.narrativeEdits || typeof reviewFeedback.narrativeEdits !== "object") {
      throw new Error('Invalid "reviewFeedback.narrativeEdits"');
    }

    if (reviewFeedback.narrativeEdits.summary !== undefined) {
      assertString(reviewFeedback.narrativeEdits.summary, "reviewFeedback.narrativeEdits.summary");
    }
    if (reviewFeedback.narrativeEdits.reframing !== undefined) {
      assertString(
        reviewFeedback.narrativeEdits.reframing,
        "reviewFeedback.narrativeEdits.reframing"
      );
    }
  }

  if (reviewFeedback.extraFollowUpQuestions !== undefined) {
    assertStringArray(
      reviewFeedback.extraFollowUpQuestions,
      "reviewFeedback.extraFollowUpQuestions"
    );
  }

  if (reviewFeedback.extraRecommendations !== undefined) {
    assertStringArray(
      reviewFeedback.extraRecommendations,
      "reviewFeedback.extraRecommendations"
    );
  }
}

export function assertCareerAssetInput(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Input must be an object");
  }

  if (!input.profile || typeof input.profile !== "object") {
    throw new Error('Missing "profile" object');
  }

  assertString(input.profile.currentGoal, "profile.currentGoal");
  assertString(input.profile.targetDirection, "profile.targetDirection");
  assertStringArray(input.profile.constraints, "profile.constraints");

  if (!Array.isArray(input.timeline) || input.timeline.length === 0) {
    throw new Error('Missing or empty "timeline"');
  }
  input.timeline.forEach(assertTimelineStage);

  if (!input.narrative || typeof input.narrative !== "object") {
    throw new Error('Missing "narrative" object');
  }
  assertString(input.narrative.summary, "narrative.summary");
  assertString(input.narrative.reframing, "narrative.reframing");

  if (!input.nextSteps || typeof input.nextSteps !== "object") {
    throw new Error('Missing "nextSteps" object');
  }
  assertStringArray(input.nextSteps.followUpQuestions, "nextSteps.followUpQuestions");
  assertStringArray(input.nextSteps.recommendations, "nextSteps.recommendations");
}

export function assertWorkflowSnapshot(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Workflow snapshot must be an object");
  }

  if (!input.profile || typeof input.profile !== "object") {
    throw new Error('Missing "profile" object');
  }

  assertString(input.profile.currentGoal, "profile.currentGoal");
  assertString(input.profile.targetDirection, "profile.targetDirection");
  assertStringArray(input.profile.constraints, "profile.constraints");

  assertExplorationSession(input.explorationSession);
  assertStructuringResult(input.structuringResult);
}
