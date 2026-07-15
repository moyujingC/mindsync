import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function readJsonFile(filePath, fallback = undefined) {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (fallback !== undefined && error.code === 'ENOENT') {
      return fallback;
    }
    error.message = `Failed to read JSON file ${filePath}: ${error.message}`;
    throw error;
  }
}

export async function writeJsonFile(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
