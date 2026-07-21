import { readJsonFile, writeJsonFile } from '../utils/json-file.mjs';

const INITIAL_STATE = {
  schema: 'content-matrix/research-request-ledger/v1',
  requests: [],
};

export class ResearchRequestStore {
  constructor({ filePath }) {
    this.filePath = filePath;
    this.state = structuredClone(INITIAL_STATE);
  }

  async load() {
    this.state = await readJsonFile(this.filePath, structuredClone(INITIAL_STATE));
    this.state.requests ??= [];
  }

  get(requestId) {
    return this.state.requests.find((request) => request.requestId === requestId) ?? null;
  }

  add(request) {
    if (this.get(request.requestId)) {
      throw new Error(`Research request already exists: ${request.requestId}`);
    }
    this.state.requests.unshift(request);
  }

  update(requestId, update) {
    const index = this.state.requests.findIndex((request) => request.requestId === requestId);
    if (index === -1) {
      throw new Error(`Research request not found: ${requestId}`);
    }
    this.state.requests[index] = update(this.state.requests[index]);
    return this.state.requests[index];
  }

  async save() {
    await writeJsonFile(this.filePath, this.state);
  }
}
