const REQUIRED_TABLES = {
  creators: [
    'name',
    'platform',
    'externalId',
    'homepageUrl',
    'enabledStatus',
    'checkFrequency',
    'lastCheckedAt',
    'latestContentAt',
    'lastStatus',
    'failureReason',
    'sourceKind',
    'sourcePath',
  ],
  contents: [
    'uniqueKey',
    'platform',
    'externalId',
    'url',
    'title',
    'description',
    'publishedAt',
    'collectedAt',
    'contentType',
    'tags',
    'likeCount',
    'commentCount',
    'favoriteCount',
    'shareCount',
    'analysisStatus',
  ],
  comments: [
    'commentKey',
    'contentKey',
    'commentText',
    'commentedAt',
    'likeCount',
    'userHandle',
    'demandType',
    'sentiment',
    'insightStatus',
  ],
  insights: [
    'title',
    'sourceContentKeys',
    'sourceCommentKeys',
    'insightType',
    'targetAccounts',
    'evidenceSummary',
    'nextAction',
    'status',
  ],
};

const OPTIONAL_TABLES = {
  researchRequests: [
    'requestId',
    'purpose',
    'serviceDirection',
    'targetAccount',
    'collectMode',
    'platform',
    'sampleLimit',
    'contentCount',
    'commentCount',
    'requestCount',
    'status',
    'nextAction',
    'briefPath',
    'createdAt',
    'updatedAt',
  ],
  linkInbox: [
    'inboxId',
    'originalUrl',
    'finalUrl',
    'platform',
    'linkKind',
    'receivedAt',
    'source',
    'status',
    'result',
    'retryCount',
    'errorSummary',
  ],
  contentProcessingTasks: [
    'taskKey', 'contentKey', 'taskType', 'triggerReason', 'status', 'priority',
    'targetAccount', 'dependencyTaskKey', 'artifactPath', 'errorSummary', 'createdAt', 'updatedAt',
  ],
  engagementSnapshots: [
    'snapshotKey', 'contentKey', 'publishedAt', 'capturedAt', 'contentAgeDays',
    'likeCount', 'commentCount', 'favoriteCount', 'shareCount', 'runId', 'source',
  ],
  contentExperiments: [
    'experimentId', 'topicTitle', 'targetAccount', 'contentFormat', 'topicSource',
    'hypothesis', 'evidenceRefs', 'primaryGoal', 'status', 'platform', 'publishUrl',
    'publishedAt', 'observedUntil', 'impressions', 'likes', 'favorites', 'comments',
    'shares', 'directMessages', 'qualifiedResponses', 'qualifiedConsultations',
    'humanConclusion', 'nextAdjustment', 'createdAt', 'updatedAt',
  ],
};

const OPTIONAL_TABLE_FIELDS = {
  contents: [
    'refinementStatus',
    'transcriptSource',
    'transcriptText',
    'screeningStatus',
    'topicPotentialScore',
    'substanceSignalScore',
    'topicRecommendation',
    'substanceRecommendation',
    'scoredAt',
    'screeningNote',
  ],
  creators: [
    'sourceLink',
    'linkType',
    'collectAction',
    'taskStatus',
    'collectSince',
    'taskReport',
    'taskLockedAt',
  ],
};

export function validateFeishuConfig(config) {
  const errors = [];
  if (config.mode !== 'lark-cli') {
    requireString(config, 'appId', errors);
    requireString(config, 'appSecret', errors);
  }
  requireString(config, 'baseAppToken', errors);

  for (const [tableName, requiredFields] of Object.entries(REQUIRED_TABLES)) {
    const table = config.tables?.[tableName];
    if (!table) {
      errors.push(`Missing table config: ${tableName}`);
      continue;
    }
    requireString(table, `tables.${tableName}.tableId`, errors, 'tableId');
    for (const field of requiredFields) {
      const fieldValue = table.fields?.[field];
      if (!fieldValue || typeof fieldValue !== 'string') {
        errors.push(`Missing field mapping: tables.${tableName}.fields.${field}`);
      }
    }
  }

  for (const [tableName, requiredFields] of Object.entries(OPTIONAL_TABLES)) {
    const table = config.tables?.[tableName];
    if (!table) {
      continue;
    }
    requireString(table, `tables.${tableName}.tableId`, errors, 'tableId');
    for (const field of requiredFields) {
      const fieldValue = table.fields?.[field];
      if (!fieldValue || typeof fieldValue !== 'string') {
        errors.push(`Missing field mapping: tables.${tableName}.fields.${field}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validateFeishuTableFields(config, actualFieldsByTable) {
  const errors = [];
  const warnings = [];

  for (const [tableName, requiredFields] of Object.entries(REQUIRED_TABLES)) {
    const mappedFields = config.tables?.[tableName]?.fields ?? {};
    const actualFields = actualFieldsByTable[tableName] ?? [];
    const actualNames = new Set(actualFields.map((field) => field.fieldName));

    for (const fieldKey of requiredFields) {
      const mappedName = mappedFields[fieldKey];
      if (!mappedName) {
        errors.push(`Missing field mapping: tables.${tableName}.fields.${fieldKey}`);
      } else if (!actualNames.has(mappedName)) {
        errors.push(`Mapped field not found in Feishu table: ${tableName}.${fieldKey} -> ${mappedName}`);
      }
    }

    for (const actualField of actualFields) {
      const configured = Object.values(mappedFields).includes(actualField.fieldName);
      if (!configured) {
        warnings.push(`Unmapped Feishu field in ${tableName}: ${actualField.fieldName}`);
      }
    }
  }

  for (const [tableName, requiredFields] of Object.entries(OPTIONAL_TABLES)) {
    if (!config.tables?.[tableName]) {
      continue;
    }
    const mappedFields = config.tables[tableName].fields ?? {};
    const actualFields = actualFieldsByTable[tableName] ?? [];
    const actualNames = new Set(actualFields.map((field) => field.fieldName));
    for (const fieldKey of requiredFields) {
      const mappedName = mappedFields[fieldKey];
      if (!mappedName) {
        errors.push(`Missing field mapping: tables.${tableName}.fields.${fieldKey}`);
      } else if (!actualNames.has(mappedName)) {
        errors.push(`Mapped field not found in Feishu table: ${tableName}.${fieldKey} -> ${mappedName}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function requireString(object, displayPath, errors, key = displayPath) {
  if (!object?.[key] || typeof object[key] !== 'string') {
    errors.push(`Missing config value: ${displayPath}`);
  }
}

export { REQUIRED_TABLES };
export { OPTIONAL_TABLE_FIELDS };
export { OPTIONAL_TABLES };
