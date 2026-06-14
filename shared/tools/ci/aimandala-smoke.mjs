#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  fetchJson,
  fetchText,
  getOption,
  logError,
  logInfo,
  parseArgs,
  sleep,
  writeJsonFile,
} from "./common.mjs";

const DEFAULTS = {
  dev: {
    apiBase: "https://dev-web-api.jingshu.cc",
    homepageUrl: "https://dev-web.jingshu.cc",
    healthUrl: "https://dev-web-api.jingshu.cc/health",
  },
  prod: {
    apiBase: "https://web-api.jingshu.cc",
    homepageUrl: "https://web.jingshu.cc",
    healthUrl: "https://web-api.jingshu.cc/health",
  },
};

async function assertHealth(url) {
  const result = await fetchText(url, { timeoutMs: 20_000 });
  let payload = null;
  try {
    payload = result.text ? JSON.parse(result.text) : null;
  } catch {
    payload = null;
  }

  if (payload?.status === "healthy") {
    return payload;
  }
  if (result.response.status >= 200 && result.response.status < 400 && /healthy/i.test(result.text)) {
    return {
      status: "healthy",
      raw: result.text,
    };
  }
  throw new Error(`Health check did not return healthy: ${result.text.slice(0, 400)}`);
}

async function assertHomepage(url) {
  const result = await fetchText(url, {
    timeoutMs: 20_000,
    method: "GET",
    redirect: "manual",
  });
  if (result.response.status < 200 || result.response.status >= 400) {
    throw new Error(`Homepage returned ${result.response.status}`);
  }
  return {
    status: result.response.status,
    location: result.response.headers.get("location"),
  };
}

async function runDeepSmoke({ apiBase, fixturePath, theme, withUpgrade }) {
  const buffer = await fs.readFile(fixturePath);
  const fileName = path.basename(fixturePath);
  const form = new FormData();
  form.append("file", new Blob([buffer], { type: "image/jpeg" }), fileName);

  const upload = await fetchJson(`${apiBase}/api/v2/upload-image`, {
    method: "POST",
    body: form,
    timeoutMs: 60_000,
  });

  const userId = `nightly-smoke-${Date.now()}`;
  const createPayload = {
    user_id: userId,
    image_path: upload.image_path,
    image_url: upload.image_url,
    storage_backend: upload.storage_backend,
    storage_key: upload.storage_key,
    image_local_expires_at: upload.image_local_expires_at,
    theme,
  };

  const created = await fetchJson(`${apiBase}/api/v2/interpretations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createPayload),
    timeoutMs: 60_000,
  });

  let status = null;
  for (let attempt = 0; attempt < 18; attempt += 1) {
    status = await fetchJson(`${apiBase}/api/v2/interpretations/${created.interpretation_id}/status`, {
      timeoutMs: 20_000,
    });
    if (status?.status === "completed" && status?.report_ready) {
      break;
    }
    await sleep(5_000);
  }

  if (!status || status.status !== "completed") {
    throw new Error(`Deep smoke interpretation did not complete: ${JSON.stringify(status)}`);
  }

  const liteReport = await fetchJson(
    `${apiBase}/api/v2/interpretations/${created.interpretation_id}/report?version=lite`,
    { timeoutMs: 30_000 },
  );
  if (!liteReport?.structured) {
    throw new Error("Lite report missing structured payload");
  }

  let proReport = null;
  if (withUpgrade) {
    await fetchJson(`${apiBase}/api/v2/interpretations/${created.interpretation_id}/upgrade`, {
      method: "POST",
      timeoutMs: 30_000,
    });

    for (let attempt = 0; attempt < 18; attempt += 1) {
      status = await fetchJson(`${apiBase}/api/v2/interpretations/${created.interpretation_id}/status`, {
        timeoutMs: 20_000,
      });
      if (status?.status === "completed" && (status.version_purchased ?? []).includes("pro")) {
        break;
      }
      await sleep(5_000);
    }

    proReport = await fetchJson(
      `${apiBase}/api/v2/interpretations/${created.interpretation_id}/report?version=pro`,
      { timeoutMs: 30_000 },
    );
    if (!proReport?.structured) {
      throw new Error("Pro report missing structured payload");
    }
  }

  const history = await fetchJson(
    `${apiBase}/api/v2/users/${encodeURIComponent(userId)}/interpretations?filter=all&limit=5&theme=${encodeURIComponent(theme)}`,
    { timeoutMs: 20_000 },
  );
  if (!Array.isArray(history) || history.length === 0) {
    throw new Error("History response did not return nightly smoke interpretation");
  }

  return {
    userId,
    upload,
    created,
    status,
    liteReport: {
      interpretation_id: liteReport.interpretation_id,
      version: liteReport.version,
      title: liteReport.title,
    },
    ...(proReport
      ? {
          proReport: {
            interpretation_id: proReport.interpretation_id,
            version: proReport.version,
            title: proReport.title,
          },
        }
      : {}),
    historyCount: history.length,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(`Usage:
  node shared/tools/ci/aimandala-smoke.mjs --env <dev|prod> [--mode basic|deep] [--output <path>]
`);
    return;
  }
  const envName = getOption(options, "env", "prod");
  const defaults = DEFAULTS[envName];
  if (!defaults) {
    throw new Error(`Unsupported environment: ${envName}`);
  }

  const mode = getOption(options, "mode", "basic");
  const apiBase = getOption(options, "api-base", process.env.AIMANDALA_API_BASE_URL ?? defaults.apiBase);
  const homepageUrl = getOption(options, "homepage-url", process.env.AIMANDALA_HOMEPAGE_URL ?? defaults.homepageUrl);
  const healthUrl = getOption(options, "health-url", process.env.AIMANDALA_HEALTH_URL ?? defaults.healthUrl);
  const fixturePath = getOption(
    options,
    "fixture-path",
    "/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/toc-mvp/assets/mandala-test-01.JPG",
  );
  const outputPath = getOption(options, "output", null);
  const withUpgrade = ["true", true, "1", 1].includes(getOption(options, "with-upgrade", false));

  const report = {
    env: envName,
    mode,
    apiBase,
    homepageUrl,
    healthUrl,
    startedAt: new Date().toISOString(),
    checks: [],
  };

  logInfo(`Running ${envName} smoke in ${mode} mode`);
  report.checks.push({
    name: "health",
    result: await assertHealth(healthUrl),
  });
  report.checks.push({
    name: "homepage",
    result: await assertHomepage(homepageUrl),
  });

  if (mode === "deep") {
    report.checks.push({
      name: "deep-regression",
      result: await runDeepSmoke({
        apiBase,
        fixturePath,
        theme: getOption(options, "theme", "general"),
        withUpgrade,
      }),
    });
  }

  report.finishedAt = new Date().toISOString();
  if (outputPath) {
    await writeJsonFile(outputPath, report);
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  logError(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exit(1);
});
