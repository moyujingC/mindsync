import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class LarkCliBitableClient {
  constructor(config) {
    this.config = config;
    this.as = config.as ?? 'user';
    this.bin = config.bin ?? 'npx';
    this.baseArgs = config.bin
      ? []
      : ['-y', '@larksuite/cli@latest'];
  }

  async listRecords(tableName) {
    const table = this.getTable(tableName);
    const json = await this.run([
      ...this.baseArgs,
      'base',
      '+record-list',
      '--as',
      this.as,
      '--base-token',
      this.config.baseAppToken,
      '--table-id',
      table.tableId,
      '--format',
      'json',
    ]);
    return normalizeRecordList(json);
  }

  async createRecords(tableName, records) {
    if (records.length === 0) {
      return [];
    }
    const table = this.getTable(tableName);
    const fieldNames = orderedFieldsForTable(tableName, table.fields);
    const rows = records.map((record) => fieldNames.map((fieldName) => normalizeValueForCli(record[fieldName])));
    const json = await this.run([
      ...this.baseArgs,
      'base',
      '+record-batch-create',
      '--as',
      this.as,
      '--base-token',
      this.config.baseAppToken,
      '--table-id',
      table.tableId,
      '--json',
      JSON.stringify({
        fields: fieldNames,
        rows,
      }),
      '--format',
      'json',
    ]);
    return json.data?.record_id_list ?? [];
  }

  async updateRecord(tableName, recordId, fields) {
    const table = this.getTable(tableName);
    const json = await this.run([
      ...this.baseArgs,
      'base',
      '+record-batch-update',
      '--as',
      this.as,
      '--base-token',
      this.config.baseAppToken,
      '--table-id',
      table.tableId,
      '--json',
      JSON.stringify({
        record_id_list: [recordId],
        patch: normalizeFieldsForCli(fields),
      }),
      '--format',
      'json',
    ]);
    return json.data;
  }

  getTable(tableName) {
    const table = this.config.tables?.[tableName];
    if (!table?.tableId) {
      throw new Error(`Missing Feishu table config: ${tableName}`);
    }
    return table;
  }

  async run(args) {
    const { stdout } = await execFileAsync(this.bin, args, {
      maxBuffer: 10 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  }
}

function normalizeRecordList(json) {
  if (Array.isArray(json.data?.fields) && Array.isArray(json.data?.data)) {
    const fieldNames = json.data.fields;
    return json.data.data.map((row, index) => ({
      record_id: json.data.record_id_list?.[index],
      fields: Object.fromEntries(fieldNames.map((fieldName, fieldIndex) => [
        fieldName,
        normalizeCellValue(row[fieldIndex]),
      ])),
    }));
  }

  const records = json.data?.items ?? json.data?.records ?? json.data?.record_list ?? [];
  return records.map((record) => ({
    record_id: record.record_id ?? record.id,
    fields: record.fields ?? record.record?.fields ?? {},
  }));
}

function normalizeCellValue(value) {
  if (Array.isArray(value) && value.length === 1) {
    return value[0];
  }
  return value;
}

function normalizeFieldsForCli(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([fieldName, value]) => [fieldName, normalizeValueForCli(value)]),
  );
}

function normalizeValueForCli(value) {
  if (value && typeof value === 'object' && 'link' in value) {
    return value.link;
  }
  return value ?? null;
}

function orderedFieldsForTable(tableName, fields) {
  if (tableName === 'contents') {
    return [
      fields.uniqueKey,
      fields.platform,
      fields.creator,
      fields.externalId,
      fields.url,
      fields.title,
      fields.description,
      fields.publishedAt,
      fields.collectedAt,
      fields.contentType,
      fields.tags,
      fields.likeCount,
      fields.commentCount,
      fields.favoriteCount,
      fields.shareCount,
      fields.analysisStatus,
    ].filter(Boolean);
  }
  return Object.values(fields);
}
