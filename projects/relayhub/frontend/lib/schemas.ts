import { z } from "zod";

export const reasoningEffortSchema = z.union([
  z.literal("low"),
  z.literal("medium"),
  z.literal("high"),
]).nullable();

export const modelEntryStatusSchema = z.union([
  z.literal("preset-unconfigured"),
  z.literal("configured-pending-test"),
  z.literal("active"),
  z.literal("test-failed"),
  z.literal("disabled"),
]);

export const modelCapabilitiesSchema = z.object({
  responses: z.object({
    ok: z.boolean(),
    streamOk: z.boolean(),
  }),
  chatCompletions: z.object({
    ok: z.boolean(),
  }),
  lastProbedAt: z.string().nullable(),
  lastErrorMessage: z.string().nullable(),
});

const modelCatalogFamilySchema = z.union([
  z.literal("openai-compatible"),
  z.literal("anthropic-compatible"),
]);

const modelCostTierSchema = z.union([
  z.literal("高"),
  z.literal("中"),
  z.literal("低"),
]);

export const modelEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  providerLabel: z.string(),
  kind: z.union([z.literal("coding-plan"), z.literal("domestic-model"), z.literal("relay-api")]),
  source: z.union([z.literal("preset"), z.literal("custom")]),
  baseUrl: z.string(),
  modelId: z.string(),
  reasoningEffort: reasoningEffortSchema,
  catalogFamily: modelCatalogFamilySchema.catch("openai-compatible"),
  purchaseUrl: z.string().nullable(),
  status: modelEntryStatusSchema,
  statusNote: z.string(),
  hasStoredApiKey: z.boolean(),
  maskedApiKey: z.string().nullable(),
  lastTestedAt: z.string().nullable(),
  lastTestResult: z.string().catch("idle"),
  lastTestCode: z.string().catch("not-tested"),
  lastTestMessage: z.string().catch("还没有测试记录。"),
  capabilities: modelCapabilitiesSchema,
  presetPriority: z.string().nullable().catch(null),
  recommendedTaskCategories: z.array(z.string()).catch([]),
  recommendedTaskIds: z.array(z.string()).catch([]),
  selectionReason: z.string().nullable().catch(null),
  activationHint: z.string().nullable().catch(null),
  costTier: modelCostTierSchema.nullable().catch(null),
  capabilityTags: z.array(z.string()).catch([]),
  tags: z.array(z.string()),
});

export const entryResolutionSchema = z.object({
  entryId: z.string(),
  alias: z.string().nullable(),
  clientFamily: z.union([z.literal("claude"), z.literal("codex"), z.literal("paperclip")]).nullable(),
  adapterType: z.union([
    z.literal("claude_local"),
    z.literal("codex_local"),
    z.literal("pi_local"),
    z.literal("hermes_local"),
    z.null(),
  ]),
  hostType: z.union([z.literal("mac"), z.literal("server"), z.literal("external-observe")]).nullable(),
  protocolFamily: z.union([
    z.literal("anthropic-messages"),
    z.literal("openai-responses"),
    z.literal("openai-chat-completions"),
    z.literal("observe-only"),
  ]).nullable(),
  controllable: z.boolean(),
  defaultModelEntryId: z.string().nullable(),
  fallbackModelEntryId: z.string().nullable(),
  reasoningEffortOverride: reasoningEffortSchema,
  effectiveReasoningEffort: reasoningEffortSchema,
  statusNote: z.string().nullable(),
  resolvedModel: z.object({
    id: z.string(),
    name: z.string(),
    baseUrl: z.string(),
    modelId: z.string(),
    reasoningEffort: reasoningEffortSchema,
    status: modelEntryStatusSchema,
    hasStoredApiKey: z.boolean(),
  }).nullable(),
});

export const relayAccessSummarySchema = z.object({
  hasStoredRelayToken: z.boolean(),
  maskedRelayToken: z.string().nullable(),
  effectiveSource: z.union([z.literal("control-plane"), z.literal("environment"), z.literal("missing")]),
  updatedAt: z.string().nullable(),
});

export const modelCatalogResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      supportedEndpointTypes: z.array(z.string()).optional(),
    }),
  ),
  fetchedAt: z.string(),
});

export type ModelEntry = z.infer<typeof modelEntrySchema>;
export type EntryBindingResolution = z.infer<typeof entryResolutionSchema>;
export type RelayAccessSummary = z.infer<typeof relayAccessSummarySchema>;
export type ModelCatalogResponse = z.infer<typeof modelCatalogResponseSchema>;
