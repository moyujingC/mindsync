import {
  applyDetection,
  applyError,
  applyInterpretationCreated,
  applyReport,
  applyStatus,
  initialMandalaFlowState,
  selectImage,
} from "../shared/core";
import {
  createInterpretation,
  detectCircles,
  getInterpretationReport,
  getInterpretationStatus,
} from "../shared/api";
import type {
  CreateInterpretationResponse,
  DetectCirclesResponse,
  InterpretationStatusResponse,
  MandalaFlowState,
  ReportResponse,
  StartCreatePayload,
} from "../shared/types";

export interface MobileWebFlowSnapshot {
  state: MandalaFlowState;
  detection?: DetectCirclesResponse;
  interpretation?: CreateInterpretationResponse;
  status?: InterpretationStatusResponse;
  report?: ReportResponse;
}

export async function bootstrapMobileWebFlow(
  imagePath: string,
): Promise<MobileWebFlowSnapshot> {
  const state = selectImage(initialMandalaFlowState, imagePath);
  return { state };
}

export async function runMobileWebLiteFlow(
  payload: StartCreatePayload,
): Promise<MobileWebFlowSnapshot> {
  let state = selectImage(initialMandalaFlowState, payload.imagePath);

  try {
    const detection = await detectCircles({
      image_path: payload.imagePath,
    });
    state = applyDetection(state, detection);

    const interpretation = await createInterpretation({
      user_id: payload.userId,
      image_path: payload.imagePath,
      theme: payload.theme,
      painting_intention: payload.paintingIntention,
      painting_feeling: payload.paintingFeeling,
      inner_radius: payload.innerRadius,
      middle_radius: payload.middleRadius,
    });
    state = applyInterpretationCreated(state, interpretation);

    const status = await getInterpretationStatus(interpretation.interpretation_id);
    state = applyStatus(state, status);

    const report = await getInterpretationReport(interpretation.interpretation_id);
    state = applyReport(state, report);

    return {
      state,
      detection,
      interpretation,
      status,
      report,
    };
  } catch (error) {
    state = applyError(
      state,
      error instanceof Error ? error.message : "Mobile web flow failed",
    );

    return {
      state,
    };
  }
}

export async function refreshMobileWebReport(
  interpretationId: string,
  currentState: MandalaFlowState = initialMandalaFlowState,
): Promise<MobileWebFlowSnapshot> {
  let state = currentState;

  try {
    const status = await getInterpretationStatus(interpretationId);
    state = applyStatus(state, status);

    const report = await getInterpretationReport(interpretationId);
    state = applyReport(state, report);

    return {
      state,
      status,
      report,
    };
  } catch (error) {
    state = applyError(
      state,
      error instanceof Error ? error.message : "Failed to refresh report",
    );

    return {
      state,
    };
  }
}
