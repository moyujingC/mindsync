import { planKnowledgeCardsFromArticle } from "./cardPlanning";
import type { PlannerRequest, PlannerResponse } from "./plannerTypes";

export async function planCards(request: PlannerRequest): Promise<PlannerResponse> {
  try {
    const response = await fetch("/api/plan-cards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`plan-cards failed: ${response.status}`);
    }

    return (await response.json()) as PlannerResponse;
  } catch {
    const fallback = planKnowledgeCardsFromArticle(request.rawText);
    return {
      provider: "local-fallback",
      ...fallback,
    };
  }
}
