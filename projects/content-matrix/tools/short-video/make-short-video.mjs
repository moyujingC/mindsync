#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../..");

const DEFAULT_AVATAR = path.join(
  repoRoot,
  "projects/content-matrix/accounts/墨予镜/assets/logo/moyujing-logo-current.png",
);

const DEFAULT_OUTPUT = path.join(
  repoRoot,
  "projects/content-matrix/accounts/墨予镜/short-videos/_rendered",
);

function parseArgs(argv) {
  const args = {
    script: "",
    out: DEFAULT_OUTPUT,
    dryRun: false,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--script") {
      args.script = argv[index + 1] ?? "";
      index += 1;
    } else if (value === "--out") {
      args.out = argv[index + 1] ?? "";
      index += 1;
    } else if (value === "--dry-run") {
      args.dryRun = true;
    } else if (value === "--help" || value === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }

  if (!args.script) {
    throw new Error("Missing required --script <json-file> argument.");
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node projects/content-matrix/tools/short-video/make-short-video.mjs \\
    --script projects/content-matrix/accounts/墨予镜/short-videos/<name>/script.json \\
    --out projects/content-matrix/accounts/墨予镜/short-videos/<name>/render

The script JSON defines a vertical short video for Douyin/Xiaohongshu:
{
  "title": "短视频标题",
  "subtitle": "账号或系列名",
  "avatarImage": "projects/content-matrix/accounts/墨予镜/assets/logo/moyujing-logo-current.png",
  "scenes": [
    { "text": "第一幕字幕", "duration": 4 }
  ],
  "cta": "结尾提示"
}`);
}

function resolveFromRepo(inputPath) {
  if (!inputPath) {
    return "";
  }
  return path.isAbsolute(inputPath) ? inputPath : path.join(repoRoot, inputPath);
}

function readJson(jsonPath) {
  const absolutePath = resolveFromRepo(jsonPath);
  const raw = readFileSync(absolutePath, "utf8");
  return JSON.parse(raw);
}

function validateConfig(config) {
  if (!config.title) {
    throw new Error("script.json requires a title.");
  }
  if (!Array.isArray(config.scenes) || config.scenes.length === 0) {
    throw new Error("script.json requires a non-empty scenes array.");
  }
  for (const [index, scene] of config.scenes.entries()) {
    if (!scene.text) {
      throw new Error(`Scene ${index + 1} is missing text.`);
    }
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.stdio ?? "inherit",
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status}`);
  }

  return result;
}

function durationSeconds(config) {
  return config.scenes.reduce((sum, scene) => sum + (scene.duration ?? 4), 0);
}

function main() {
  const args = parseArgs(process.argv);
  const config = readJson(args.script);
  validateConfig(config);

  const outDir = resolveFromRepo(args.out);
  mkdirSync(outDir, { recursive: true });

  const avatarImage = resolveFromRepo(config.avatarImage) || DEFAULT_AVATAR;
  if (!existsSync(avatarImage)) {
    throw new Error(`Avatar image not found: ${avatarImage}`);
  }

  const frameRenderer = path.join(__dirname, "render_frames.py");
  run("python3", [
    frameRenderer,
    "--script",
    path.relative(repoRoot, resolveFromRepo(args.script)),
    "--out",
    path.relative(repoRoot, outDir),
    "--repo-root",
    repoRoot,
  ]);

  const concatPath = path.join(outDir, "concat.txt");
  const outputPath = path.join(outDir, config.outputName ?? "short-video.mp4");
  const manifestPath = path.join(outDir, "render-manifest.json");
  const fps = String(config.fps ?? 30);
  const duration = durationSeconds(config);

  const ffmpegArgs = [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatPath,
    "-f",
    "lavfi",
    "-i",
    "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-map",
    "0:v",
    "-map",
    "1:a",
    "-t",
    String(duration),
    "-r",
    fps,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "veryfast",
    "-crf",
    String(config.crf ?? 22),
    "-c:a",
    "aac",
    "-shortest",
    outputPath,
  ];

  const manifest = {
    generatedAt: new Date().toISOString(),
    script: path.relative(repoRoot, resolveFromRepo(args.script)),
    output: path.relative(repoRoot, outputPath),
    frameManifest: path.relative(repoRoot, path.join(outDir, "frame-manifest.json")),
    concat: path.relative(repoRoot, concatPath),
    durationSeconds: duration,
    size: `${config.width ?? 1080}x${config.height ?? 1920}`,
    fps: Number(fps),
    avatarImage: path.relative(repoRoot, avatarImage),
    ffmpeg: ["ffmpeg", ...ffmpegArgs],
    note: "Frames are rendered with Pillow because this ffmpeg build lacks subtitles/drawtext filters.",
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  if (args.dryRun) {
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  run("ffmpeg", ffmpegArgs);
  console.log(`Rendered ${outputPath}`);
}

main();
