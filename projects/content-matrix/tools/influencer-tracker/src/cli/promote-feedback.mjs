#!/usr/bin/env node
import { resolve } from 'node:path';
import { parseArgs } from '../utils/args.mjs';
import { promoteFeedbackToAiServiceStudio } from '../jobs/promote-feedback.mjs';

const args = parseArgs(process.argv.slice(2));

try {
  const result = await promoteFeedbackToAiServiceStudio({
    feedbackPath: args.feedback ? resolve(process.cwd(), args.feedback) : null,
    targetPath: resolve(
      process.cwd(),
      args.target ?? '../../../ai-service-studio/records/样本沟通记录.md',
    ),
    serviceDirection: args.serviceDirection ?? '待判断',
    status: args.status ?? '已回复',
    nextAction: args.nextAction ?? '安排 20-30 分钟样本沟通',
  });

  console.log(JSON.stringify({
    ok: true,
    ...result,
  }, null, 2));
} catch (error) {
  console.error(`[fatal] ${error.message}`);
  process.exitCode = 1;
}
