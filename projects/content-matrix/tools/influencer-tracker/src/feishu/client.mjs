const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';

export class FeishuBitableClient {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.baseUrl ?? FEISHU_BASE_URL;
  }

  async getTenantAccessToken() {
    if (this.tenantAccessToken) {
      return this.tenantAccessToken;
    }
    const response = await this.request('/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      auth: false,
      body: {
        app_id: this.config.appId,
        app_secret: this.config.appSecret,
      },
    });
    this.tenantAccessToken = response.tenant_access_token;
    return this.tenantAccessToken;
  }

  async listRecords(tableName) {
    const table = this.getTable(tableName);
    const response = await this.request(
      `/bitable/v1/apps/${this.config.baseAppToken}/tables/${table.tableId}/records/search`,
      {
        method: 'POST',
        body: {},
      },
    );
    return response.data?.items ?? [];
  }

  async listFields(tableName) {
    const table = this.getTable(tableName);
    const response = await this.request(
      `/bitable/v1/apps/${this.config.baseAppToken}/tables/${table.tableId}/fields`,
      {
        method: 'GET',
      },
    );
    return response.data?.items ?? [];
  }

  async listTables() {
    const response = await this.request(
      `/bitable/v1/apps/${this.config.baseAppToken}/tables`,
      {
        method: 'GET',
      },
    );
    return response.data?.items ?? [];
  }

  async createTable(schema) {
    const response = await this.request(
      `/bitable/v1/apps/${this.config.baseAppToken}/tables`,
      {
        method: 'POST',
        body: {
          table: {
            name: schema.tableName,
            default_view_name: schema.defaultViewName,
            fields: Object.values(schema.fields),
          },
        },
      },
    );
    return response.data?.table;
  }

  async createRecords(tableName, records) {
    if (records.length === 0) {
      return [];
    }
    const table = this.getTable(tableName);
    const response = await this.request(
      `/bitable/v1/apps/${this.config.baseAppToken}/tables/${table.tableId}/records/batch_create`,
      {
        method: 'POST',
        body: {
          records: records.map((fields) => ({ fields })),
        },
      },
    );
    return response.data?.records ?? [];
  }

  async updateRecord(tableName, recordId, fields) {
    const table = this.getTable(tableName);
    const response = await this.request(
      `/bitable/v1/apps/${this.config.baseAppToken}/tables/${table.tableId}/records/${recordId}`,
      {
        method: 'PUT',
        body: { fields },
      },
    );
    return response.data?.record;
  }

  getTable(tableName) {
    const table = this.config.tables?.[tableName];
    if (!table?.tableId) {
      throw new Error(`Missing Feishu table config: ${tableName}`);
    }
    return table;
  }

  async request(path, { method = 'GET', body, auth = true } = {}) {
    const headers = {
      'content-type': 'application/json; charset=utf-8',
    };
    if (auth) {
      headers.authorization = `Bearer ${await this.getTenantAccessToken()}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || (json.code && json.code !== 0)) {
      throw new Error(`Feishu API failed: ${response.status} ${json.msg ?? response.statusText}`);
    }
    return json;
  }
}

export function mapFeishuCreatorRecord(record, fieldMap) {
  const fields = record.fields ?? {};
  const value = (key) => fields[fieldMap[key]];
  return {
    recordId: record.record_id,
    id: record.record_id,
    name: value('name'),
    platform: normalizeSingleSelect(value('platform')),
    externalId: value('externalId'),
    homepageUrl: value('homepageUrl')?.link ?? value('homepageUrl'),
    enabledStatus: normalizeSingleSelect(value('enabledStatus')),
    checkFrequency: normalizeSingleSelect(value('checkFrequency')),
    source: buildSource({
      kind: normalizeSingleSelect(value('sourceKind')),
      pathOrUrl: value('sourcePath'),
    }),
  };
}

export function summarizeFeishuField(field) {
  return {
    fieldId: field.field_id,
    fieldName: field.field_name,
    type: field.type,
    isPrimary: Boolean(field.is_primary),
  };
}

export function mapContentToFeishuFields(content, fieldMap) {
  const metrics = content.metrics ?? {};
  return compactObject({
    [fieldMap.uniqueKey]: content.uniqueKey,
    [fieldMap.platform]: content.platform,
    [fieldMap.externalId]: content.contentExternalId,
    [fieldMap.url]: content.url ? { link: content.url, text: content.url } : undefined,
    [fieldMap.title]: content.title,
    [fieldMap.description]: content.description,
    [fieldMap.publishedAt]: content.publishedAt,
    [fieldMap.collectedAt]: new Date().toISOString(),
    [fieldMap.contentType]: content.contentType,
    [fieldMap.tags]: content.tags,
    [fieldMap.likeCount]: metrics.likeCount,
    [fieldMap.commentCount]: metrics.commentCount,
    [fieldMap.favoriteCount]: metrics.favoriteCount,
    [fieldMap.shareCount]: metrics.shareCount,
    [fieldMap.analysisStatus]: '待分析',
  });
}

export function mapCommentToFeishuFields(comment, fieldMap) {
  return compactObject({
    [fieldMap.commentKey]: comment.commentUniqueKey,
    [fieldMap.contentKey]: comment.contentUniqueKey,
    [fieldMap.commentText]: comment.commentText,
    [fieldMap.commentedAt]: comment.commentedAt,
    [fieldMap.likeCount]: comment.likeCount,
    [fieldMap.userHandle]: comment.userHandle,
    [fieldMap.demandType]: comment.demandType,
    [fieldMap.sentiment]: comment.sentiment,
    [fieldMap.insightStatus]: comment.insightStatus,
  });
}

export function mapTopicCandidateToFeishuFields(candidate, fieldMap) {
  return compactObject({
    [fieldMap.title]: candidate.topicTitle,
    [fieldMap.sourceContentKeys]: candidate.source?.contentUniqueKey,
    [fieldMap.sourceCommentKeys]: '',
    [fieldMap.insightType]: '选题',
    [fieldMap.targetAccounts]: targetAccountsForServiceDirection(candidate.serviceDirection),
    [fieldMap.evidenceSummary]: candidate.evidenceSummary,
    [fieldMap.nextAction]: [
      candidate.nextAction,
      candidate.userProblem ? `用户问题：${candidate.userProblem}` : '',
      candidate.cta ? `CTA：${candidate.cta}` : '',
    ].filter(Boolean).join('\n'),
    [fieldMap.status]: '待处理',
  });
}

export function mapFeishuCommentRecord(record, fieldMap) {
  const fields = record.fields ?? {};
  const value = (key) => fields[fieldMap[key]];
  return {
    recordId: record.record_id,
    commentUniqueKey: extractTextValue(value('commentKey')),
    contentUniqueKey: extractTextValue(value('contentKey')),
    commentText: extractTextValue(value('commentText')),
    commentedAt: extractTextValue(value('commentedAt')),
    likeCount: numberOrNull(value('likeCount')),
    userHandle: extractTextValue(value('userHandle')),
    demandType: normalizeMultiSelect(value('demandType')),
    sentiment: normalizeSingleSelect(value('sentiment')),
    insightStatus: normalizeSingleSelect(value('insightStatus')),
  };
}

export function mapFeishuInsightRecord(record, fieldMap) {
  const fields = record.fields ?? {};
  const value = (key) => fields[fieldMap[key]];
  return {
    recordId: record.record_id,
    title: extractTextValue(value('title')),
    sourceContentKeys: extractTextValue(value('sourceContentKeys')),
    sourceCommentKeys: extractTextValue(value('sourceCommentKeys')),
    insightType: normalizeSingleSelect(value('insightType')),
    targetAccounts: normalizeMultiSelect(value('targetAccounts')),
    evidenceSummary: extractTextValue(value('evidenceSummary')),
    nextAction: extractTextValue(value('nextAction')),
    status: normalizeSingleSelect(value('status')),
  };
}

export function extractFeishuTextField(record, fieldName) {
  const value = record.fields?.[fieldName];
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => extractTextValue(item)).filter(Boolean).join(',');
  }
  return extractTextValue(value);
}

export function buildInsightDedupeKey(insight) {
  return [
    insight.sourceContentKeys,
    insight.insightType || '选题',
  ].filter(Boolean).join('::');
}

function normalizeSingleSelect(value) {
  if (typeof value === 'string') {
    return value;
  }
  return value?.text ?? value?.name ?? value?.[0]?.text ?? value?.[0]?.name ?? '';
}

function normalizeMultiSelect(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((item) => extractTextValue(item)).filter(Boolean);
  }
  return [extractTextValue(value)].filter(Boolean);
}

function targetAccountsForServiceDirection(serviceDirection) {
  if ([
    'AI 工作流诊断',
    'AI 文档 / 知识库整理',
    '企业 AI 落地 / FDE',
    '内容生产系统',
  ].includes(serviceDirection)) {
    return ['知行AI服务'];
  }
  return ['墨予镜'];
}

function extractTextValue(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return value.text ?? value.name ?? value.link ?? '';
}

function numberOrNull(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function buildSource({ kind, pathOrUrl }) {
  if (!kind || !pathOrUrl) {
    return undefined;
  }
  if (kind === 'rss-file') {
    return { kind, path: pathOrUrl };
  }
  if (kind === 'rss') {
    return { kind, url: pathOrUrl };
  }
  return undefined;
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''),
  );
}
