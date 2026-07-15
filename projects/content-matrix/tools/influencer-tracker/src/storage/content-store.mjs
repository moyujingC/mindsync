import { readJsonFile, writeJsonFile } from '../utils/json-file.mjs';

export class ContentStore {
  constructor({ filePath }) {
    this.filePath = filePath;
    this.state = {
      contentKeys: [],
      runs: [],
    };
  }

  async load() {
    this.state = await readJsonFile(this.filePath, this.state);
    this.keySet = new Set(this.state.contentKeys ?? []);
  }

  hasContent(uniqueKey) {
    return this.keySet.has(uniqueKey);
  }

  addContent(uniqueKey) {
    if (this.keySet.has(uniqueKey)) {
      return false;
    }
    this.keySet.add(uniqueKey);
    return true;
  }

  addRun(run) {
    this.state.runs = [run, ...(this.state.runs ?? [])].slice(0, 50);
  }

  async save() {
    this.state.contentKeys = [...this.keySet].sort();
    await writeJsonFile(this.filePath, this.state);
  }
}
