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
};

export function validateFeishuConfig(config) {
  const errors = [];
  requireString(config, 'appId', errors);
  requireString(config, 'appSecret', errors);
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

  return {
    ok: errors.length === 0,
    errors,
  };
}

function requireString(object, displayPath, errors, key = displayPath) {
  if (!object?.[key] || typeof object[key] !== 'string') {
    errors.push(`Missing config value: ${displayPath}`);
  }
}

export { REQUIRED_TABLES };
