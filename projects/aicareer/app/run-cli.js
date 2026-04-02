import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  applyReviewFeedbackToCareerAssetInput,
  createCareerAssetInputFromWorkflowSnapshot,
  createCareerAssetMarkdown
} from "../domain/career-asset.js";

function parseArgs(argv) {
  const options = {
    autoArchive: false,
    listArchives: false,
    outputPath: null,
    reviewPath: null,
    interactiveReview: false,
    saveWorkflowPath: null,
    fromWorkflowPath: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--output") {
      options.outputPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--auto-archive") {
      options.autoArchive = true;
      continue;
    }

    if (arg === "--list-archives") {
      options.listArchives = true;
      continue;
    }

    if (arg === "--review") {
      options.reviewPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--interactive-review") {
      options.interactiveReview = true;
      continue;
    }

    if (arg === "--save-workflow") {
      options.saveWorkflowPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg === "--from-workflow") {
      options.fromWorkflowPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (argv.includes("--output") && !options.outputPath) {
    throw new Error("Missing path after --output");
  }

  if (argv.includes("--review") && !options.reviewPath) {
    throw new Error("Missing path after --review");
  }

  if (argv.includes("--save-workflow") && !options.saveWorkflowPath) {
    throw new Error("Missing path after --save-workflow");
  }

  if (argv.includes("--from-workflow") && !options.fromWorkflowPath) {
    throw new Error("Missing path after --from-workflow");
  }

  return options;
}

function createTimestamp() {
  return new Date().toISOString().replace(/[:]/g, "-").replace(/\.\d+Z$/, "Z");
}

function createArchivePaths(timestamp) {
  return {
    workflowPath: `output/archive/${timestamp}-workflow.json`,
    outputPath: `output/archive/${timestamp}-career-asset.md`
  };
}

function createArchiveIndexPath() {
  return "output/archive/index.json";
}

async function readJsonIfExists(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function buildArchiveEntriesFromFiles(cwd) {
  const archiveDir = path.resolve(cwd, "output/archive");

  try {
    const names = await fs.readdir(archiveDir);
    const workflows = names
      .filter((name) => name.endsWith("-workflow.json"))
      .sort()
      .reverse();

    return workflows.map((workflowName) => {
      const timestamp = workflowName.replace("-workflow.json", "");
      return {
        timestamp,
        workflowPath: `output/archive/${workflowName}`,
        outputPath: `output/archive/${timestamp}-career-asset.md`
      };
    });
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function updateArchiveIndex(cwd, entry) {
  const indexPath = path.resolve(cwd, createArchiveIndexPath());
  const current = await readJsonIfExists(indexPath, []);
  const next = [entry, ...current].slice(0, 50);
  await fs.mkdir(path.dirname(indexPath), { recursive: true });
  await fs.writeFile(indexPath, JSON.stringify(next, null, 2), "utf8");
}

async function printArchiveList(cwd) {
  const indexPath = path.resolve(cwd, createArchiveIndexPath());
  let entries = await readJsonIfExists(indexPath, null);
  if (entries === null) {
    entries = await buildArchiveEntriesFromFiles(cwd);
  }

  output.write("最近归档\n\n");

  if (entries.length === 0) {
    output.write("暂无归档记录。\n");
    return;
  }

  entries.slice(0, 10).forEach((entry, index) => {
    output.write(
      `${index + 1}. ${entry.timestamp}\n   workflow: ${entry.workflowPath}\n   output: ${entry.outputPath}\n`
    );
  });
}

function createWorkflowSnapshotFromInteractiveAnswers(answers) {
  return {
    profile: {
      currentGoal: answers.currentGoal,
      targetDirection: answers.targetDirection,
      constraints: answers.constraints
    },
    explorationSession: {
      rawSignals: [
        `当前目标：${answers.currentGoal}`,
        `目标方向：${answers.targetDirection}`,
        `主要约束：${answers.constraints.join("；")}`
      ],
      experienceItems: answers.timeline.map((stage) => ({
        stageLabel: stage.label,
        role: stage.roles.join(" / "),
        keyWork: stage.keyWork,
        highlights: stage.highlights,
        transitions: stage.transitions
      }))
    },
    structuringResult: {
      timeline: answers.timeline,
      narrative: {
        summary: answers.summary,
        reframing: answers.reframing
      },
      nextSteps: {
        followUpQuestions: answers.followUpQuestions,
        recommendations: answers.recommendations
      }
    }
  };
}

async function askNonEmpty(rl, prompt) {
  const value = (await rl.question(prompt)).trim();
  if (!value) {
    throw new Error(`Missing required input: ${prompt.trim()}`);
  }
  return value;
}

function splitList(value) {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function askList(rl, prompt) {
  const value = await askNonEmpty(rl, prompt);
  const list = splitList(value);

  if (list.length === 0) {
    throw new Error(`Expected at least one item for: ${prompt.trim()}`);
  }

  return list;
}

async function askOptionalText(rl, prompt) {
  return (await rl.question(prompt)).trim();
}

async function askOptionalList(rl, prompt) {
  const value = (await rl.question(prompt)).trim();
  if (!value) {
    return [];
  }
  return splitList(value);
}

async function askStage(rl, label) {
  const roles = await askList(rl, `${label} 主要角色（用逗号分隔）：`);
  const keyWork = await askList(rl, `${label} 关键工作（用逗号分隔）：`);
  const highlights = await askList(rl, `${label} 代表成果（用逗号分隔）：`);
  const transitions = await askList(rl, `${label} 关键转折（用逗号分隔）：`);

  return {
    label,
    roles,
    keyWork,
    highlights,
    transitions
  };
}

async function askInteractiveReview(rl) {
  const summary = await askNonEmpty(rl, "Review 摘要：");
  const narrativeSummary = await askOptionalText(rl, "可选：新的叙事摘要（直接回车跳过）：");
  const narrativeReframing = await askOptionalText(rl, "可选：新的重构表达（直接回车跳过）：");
  const extraFollowUpQuestions = await askOptionalList(
    rl,
    "可选：追加待补信息（用逗号分隔，直接回车跳过）："
  );
  const extraRecommendations = await askOptionalList(
    rl,
    "可选：追加下一步建议（用逗号分隔，直接回车跳过）："
  );

  return {
    summary,
    narrativeEdits: {
      ...(narrativeSummary ? { summary: narrativeSummary } : {}),
      ...(narrativeReframing ? { reframing: narrativeReframing } : {})
    },
    ...(extraFollowUpQuestions.length > 0 ? { extraFollowUpQuestions } : {}),
    ...(extraRecommendations.length > 0 ? { extraRecommendations } : {})
  };
}

async function main() {
  const {
    autoArchive,
    listArchives,
    outputPath,
    reviewPath,
    interactiveReview,
    saveWorkflowPath,
    fromWorkflowPath
  } = parseArgs(process.argv.slice(2));

  if (listArchives) {
    await printArchiveList(process.cwd());
    return;
  }

  const rl = readline.createInterface({ input, output });

  try {
    output.write("AICareer CLI\n");
    output.write("按提示输入，列表字段请用逗号分隔。\n\n");

    let workflowSnapshot;
    let careerAssetInput;
    const archivePaths = autoArchive ? createArchivePaths(createTimestamp()) : null;

    if (fromWorkflowPath) {
      const absoluteWorkflowPath = path.resolve(process.cwd(), fromWorkflowPath);
      const workflowRaw = await fs.readFile(absoluteWorkflowPath, "utf8");
      workflowSnapshot = JSON.parse(workflowRaw);
      careerAssetInput = createCareerAssetInputFromWorkflowSnapshot(workflowSnapshot);
    } else {
      const currentGoal = await askNonEmpty(rl, "当前目标：");
      const targetDirection = await askNonEmpty(rl, "目标方向：");
      const constraints = await askList(rl, "当前约束（用逗号分隔）：");

      const stageCountRaw = await askNonEmpty(rl, "阶段数量（建议 3）：");
      const stageCount = Number(stageCountRaw);
      if (!Number.isInteger(stageCount) || stageCount <= 0) {
        throw new Error("阶段数量必须是正整数");
      }

      const timeline = [];
      for (let index = 0; index < stageCount; index += 1) {
        const label = `阶段${index + 1}`;
        output.write(`\n填写${label}\n`);
        timeline.push(await askStage(rl, label));
      }

      output.write("\n填写叙事主线\n");
      const summary = await askNonEmpty(rl, "叙事主线摘要：");
      const reframing = await askNonEmpty(rl, "重构表达：");
      const followUpQuestions = await askList(rl, "待补信息（用逗号分隔）：");
      const recommendations = await askList(rl, "下一步建议（用逗号分隔）：");

      workflowSnapshot = createWorkflowSnapshotFromInteractiveAnswers({
        currentGoal,
        targetDirection,
        constraints,
        timeline,
        summary,
        reframing,
        followUpQuestions,
        recommendations
      });
      careerAssetInput = createCareerAssetInputFromWorkflowSnapshot(workflowSnapshot);
    }

    if (reviewPath) {
      const absoluteReviewPath = path.resolve(process.cwd(), reviewPath);
      const reviewRaw = await fs.readFile(absoluteReviewPath, "utf8");
      const reviewFeedback = JSON.parse(reviewRaw);
      careerAssetInput = applyReviewFeedbackToCareerAssetInput(careerAssetInput, reviewFeedback);
    } else if (interactiveReview) {
      output.write("\n填写 Review 反馈\n");
      const reviewFeedback = await askInteractiveReview(rl);
      careerAssetInput = applyReviewFeedbackToCareerAssetInput(careerAssetInput, reviewFeedback);
    }

    const markdown = createCareerAssetMarkdown(careerAssetInput);

    output.write("\n===== Career Asset =====\n\n");
    output.write(markdown);

    const finalWorkflowPath = saveWorkflowPath ?? archivePaths?.workflowPath ?? null;
    if (finalWorkflowPath && workflowSnapshot) {
      const absoluteWorkflowPath = path.resolve(process.cwd(), finalWorkflowPath);
      await fs.mkdir(path.dirname(absoluteWorkflowPath), { recursive: true });
      await fs.writeFile(absoluteWorkflowPath, JSON.stringify(workflowSnapshot, null, 2), "utf8");
      output.write(`\n\n已保存 workflow：${absoluteWorkflowPath}\n`);
    }

    const finalOutputPath = outputPath ?? archivePaths?.outputPath ?? null;
    if (finalOutputPath) {
      const absoluteOutputPath = path.resolve(process.cwd(), finalOutputPath);
      await fs.mkdir(path.dirname(absoluteOutputPath), { recursive: true });
      await fs.writeFile(absoluteOutputPath, markdown, "utf8");
      output.write(`\n\n已写入：${absoluteOutputPath}\n`);
    }

    if (archivePaths) {
      await updateArchiveIndex(process.cwd(), {
        timestamp: archivePaths.workflowPath
          .replace("output/archive/", "")
          .replace("-workflow.json", ""),
        workflowPath: archivePaths.workflowPath,
        outputPath: archivePaths.outputPath
      });
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
