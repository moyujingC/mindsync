#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const scriptPath = path.resolve("shared/tools/ci/paperclip-multi-project-heartbeat.mjs");

async function runHeartbeat(env = {}) {
  return new Promise((resolve) => {
    const proc = spawn(process.execPath, [scriptPath, "--doctor", "1", "--print-json", "1"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ...env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function withStubScripts(run) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-multi-heartbeat-smoke-"));
  const runnerPath = path.join(tempDir, "check-runner-heartbeat.mjs");
  const healthPath = path.join(tempDir, "check-paperclip-execution-health.mjs");

  await fs.writeFile(
    runnerPath,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
const projectName = args[args.indexOf("--project-name") + 1];
const workflowFile = args[args.indexOf("--workflow-file") + 1];
if (workflowFile === "broken.yml") {
  console.error("broken workflow");
  process.exit(2);
}
console.log(JSON.stringify({ kind: "runner", projectName, workflowFile }));
`,
    "utf8",
  );
  await fs.writeFile(
    healthPath,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
const projectName = args[args.indexOf("--project-name") + 1];
if (projectName === "BrokenProject") {
  console.error("broken project");
  process.exit(3);
}
console.log(JSON.stringify({ kind: "execution", projectName }));
`,
    "utf8",
  );

  await run({
    runnerPath,
    healthPath,
  });
}

async function main() {
  await withStubScripts(async ({ runnerPath, healthPath }) => {
    const successEnv = {
      GITHUB_REPOSITORY: "moyujingC/mindsync",
      GITHUB_TOKEN: "token",
      PAPERCLIP_COMPANY_ID: "company",
      PAPERCLIP_API_KEY: "key",
      PAPERCLIP_API_BASE: "http://127.0.0.1:3100",
      PAPERCLIP_ENGINEER_AGENT_ID: "engineer",
      PAPERCLIP_EXECUTION_HOST: "automation@150.158.9.95",
      PAPERCLIP_HEARTBEAT_TARGETS_JSON: JSON.stringify([
        { projectName: "一镜一梳", workflowFile: "aimandala-ci.yml", branch: "main", runnerLabels: "self-hosted,linux,mindsync-ci,aimandala" },
        { projectName: "RelayHub", workflowFile: "relayhub-ci-deploy.yml", branch: "relayhub/dev", runnerLabels: "self-hosted,linux,mindsync-ci,aimandala" },
      ]),
      CHECK_RUNNER_HEARTBEAT_PATH_OVERRIDE: runnerPath,
      CHECK_EXECUTION_HEALTH_PATH_OVERRIDE: healthPath,
    };

    const original = await fs.readFile(scriptPath, "utf8");
    assert(original.includes("DEFAULT_CHECK_RUNNER_HEARTBEAT_PATH"), "script should expose runner script constant");
    assert(original.includes("RelayHub"), "default targets should include RelayHub");

    const defaultTargets = await runHeartbeat({
      ...successEnv,
      PAPERCLIP_HEARTBEAT_TARGETS_JSON: "",
    });
    assert(defaultTargets.code === 0, `default targets should pass: ${defaultTargets.stderr || defaultTargets.stdout}`);
    assert(defaultTargets.stdout.includes("一镜一梳"), "default targets should include 一镜一梳");
    assert(defaultTargets.stdout.includes("RelayHub"), "default targets should include RelayHub");

    const success = await runHeartbeat(successEnv);
    assert(success.code === 0, `success case should pass: ${success.stderr || success.stdout}`);
    assert(success.stdout.includes("一镜一梳"), "success summary should include 一镜一梳");
    assert(success.stdout.includes("RelayHub"), "success summary should include RelayHub");

    const brokenWorkflow = await runHeartbeat({
      ...successEnv,
      PAPERCLIP_HEARTBEAT_TARGETS_JSON: JSON.stringify([
        { projectName: "一镜一梳", workflowFile: "broken.yml", branch: "main", runnerLabels: "self-hosted,linux,mindsync-ci,aimandala" },
        { projectName: "RelayHub", workflowFile: "relayhub-ci-deploy.yml", branch: "relayhub/dev", runnerLabels: "self-hosted,linux,mindsync-ci,aimandala" },
      ]),
    });
    assert(brokenWorkflow.code !== 0, "broken workflow case should fail");
    assert(brokenWorkflow.stdout.includes("一镜一梳"), "broken workflow summary should still include failing project");
    assert(brokenWorkflow.stdout.includes("RelayHub"), "broken workflow summary should still include second project");

    const brokenProject = await runHeartbeat({
      ...successEnv,
      PAPERCLIP_HEARTBEAT_TARGETS_JSON: JSON.stringify([
        { projectName: "BrokenProject", workflowFile: "aimandala-ci.yml", branch: "main", runnerLabels: "self-hosted,linux,mindsync-ci,aimandala" },
        { projectName: "RelayHub", workflowFile: "relayhub-ci-deploy.yml", branch: "relayhub/dev", runnerLabels: "self-hosted,linux,mindsync-ci,aimandala" },
      ]),
    });
    assert(brokenProject.code !== 0, "broken project execution health case should fail");
    assert(brokenProject.stdout.includes("BrokenProject"), "broken project summary should include failing project");
    assert(brokenProject.stdout.includes("RelayHub"), "broken project summary should still include second project");
  });

  console.log("paperclip-multi-project-heartbeat smoke passed");
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exit(1);
});
