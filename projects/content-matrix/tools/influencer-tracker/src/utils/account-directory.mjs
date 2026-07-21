import { stat } from 'node:fs/promises';
import { relative, resolve } from 'node:path';

export async function requireExistingAccountDirectory({ accountsRoot, account }) {
  const root = resolve(accountsRoot);
  const accountDir = resolve(root, account);
  const pathFromRoot = relative(root, accountDir);

  if (!account || pathFromRoot === '' || pathFromRoot.startsWith('..') || pathFromRoot.includes('/..')) {
    throw new Error('Account must name an existing account directory under accountsRoot');
  }

  try {
    const metadata = await stat(accountDir);
    if (!metadata.isDirectory()) {
      throw new Error(`Account is not a directory: ${account}`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Unknown account: ${account}. Create and register the account before promoting a draft.`);
    }
    throw error;
  }

  return accountDir;
}
