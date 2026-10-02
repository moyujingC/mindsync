import { join } from "node:path";
import { readdirSync } from "node:fs";
const HERE = import.meta.dirname;
const { chromium } = await import("/Users/xinran/Downloads/dev/mindsync/skills/healing-card/node_modules/playwright/index.mjs");
const browser = await chromium.launch();
const themes = readdirSync(HERE, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
for (const theme of themes) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  await page.goto("file://" + join(HERE, theme, "index.html"));
  await page.waitForTimeout(2000);
  await page.evaluate(() => document.fonts.ready);
  // 参考图是平涂干净的底：隐藏墨流画布和纸洗渐变，只留极轻颗粒
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = `
      canvas.mag-bg { display: none !important; }
      .paper-wash { display: none !important; }
      .grain { opacity: .16 !important; }
    `;
    document.head.appendChild(style);
  });
  const posters = await page.$$(".poster.xhs");
  for (let i = 0; i < posters.length; i++) {
    const out = join(HERE, theme, "output", `${String(i + 1).padStart(2, "0")}.png`);
    await posters[i].screenshot({ path: out });
    console.log(out);
  }
  await page.close();
}
await browser.close();
