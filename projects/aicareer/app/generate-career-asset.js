import fs from "node:fs/promises";
import path from "node:path";
import {
  applyReviewFeedbackToCareerAssetInput,
  createCareerAssetInputFromWorkflowSnapshot,
  createCareerAssetMarkdown
} from "../domain/career-asset.js";

async function main() {
  const inputPath = process.argv[2];
  const reviewPath = process.argv[3];

  if (!inputPath) {
    throw new Error("Usage: node app/generate-career-asset.js <input.json>");
  }

  const absoluteInputPath = path.resolve(process.cwd(), inputPath);
  const raw = await fs.readFile(absoluteInputPath, "utf8");
  const snapshot = JSON.parse(raw);
  let input = createCareerAssetInputFromWorkflowSnapshot(snapshot);

  if (reviewPath) {
    const absoluteReviewPath = path.resolve(process.cwd(), reviewPath);
    const reviewRaw = await fs.readFile(absoluteReviewPath, "utf8");
    const reviewFeedback = JSON.parse(reviewRaw);
    input = applyReviewFeedbackToCareerAssetInput(input, reviewFeedback);
  }

  const markdown = createCareerAssetMarkdown(input);

  process.stdout.write(markdown);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
