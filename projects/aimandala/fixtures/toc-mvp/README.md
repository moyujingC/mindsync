# To C MVP Fixtures

这里放 `一镜一梳 To C MVP` 的固定样本描述、脱敏图片资产和验证入口。

当前状态分两层：

- `assets/`
  - 已包含正式入库的脱敏画作资产池。
  - 当前 9 张 `IMG_*.jpeg` 都属于正式纳管资产。
- descriptor / manifest
  - 当前正式体系已经切到 `toc-mvp-fixture-001~004`。
  - 旧 `sample-*` 不再作为默认正式入口。

当前资产池中的正式脱敏图片：

- 默认正式候选：
  - `assets/IMG_5057.jpeg`
  - `assets/IMG_5060.jpeg`
  - `assets/IMG_5062.jpeg`
  - `assets/IMG_5063.jpeg`
- 顺延替换池：
  - `assets/IMG_5065.jpeg`
  - `assets/IMG_5067.jpeg`
  - `assets/IMG_5075.jpeg`
  - `assets/IMG_5079.jpeg`
  - `assets/IMG_5081.jpeg`

当前正式固定样本：

- `toc-mvp-fixture-001.yaml`
- `toc-mvp-fixture-002.yaml`
- `toc-mvp-fixture-003.yaml`
- `toc-mvp-fixture-004.yaml`

当前 golden 审阅资产：

- `golden/toc-mvp-fixture-001/lite.report.json`
- `golden/toc-mvp-fixture-001/lite.report.md`
- `golden/toc-mvp-fixture-001/lite.debug.json`
- `golden/toc-mvp-fixture-001/lite.review.md`
- `golden/toc-mvp-fixture-002/pro.report.json`
- `golden/toc-mvp-fixture-002/pro.report.md`
- `golden/toc-mvp-fixture-002/pro.debug.json`
- `golden/toc-mvp-fixture-002/pro.review.md`
- `golden/toc-mvp-fixture-002/lite.report.json`
- `golden/toc-mvp-fixture-002/lite.report.md`
- `golden/toc-mvp-fixture-002/lite.debug.json`
- `golden/toc-mvp-fixture-002/lite.review.md`

使用规则：

- 优先按样本 ID 在 QA、delivery、测试脚本中引用
- 真实脱敏图片统一放到 `assets/`
- 若后续补截图或人工验收证据，应放到 `evidence/`
- 若后续补完整报告快照、debug trace 或人工审阅记录，应放到 `golden/`
- descriptor 中的 `asset_ref` 应回填到具体文件或证据路径
- 不要把 `toC/app/backend/data/uploads/` 或 `interpretations/` 里的运行时文件回填到这里
- `mandala-test-01.JPG`、`mandala-test-02.jpeg`、`previews/` 和旧 `sample-*.md` 继续保留为历史或过渡资产，但不再宣称是默认正式样本来源

最小校验命令：

- `python3 $REPO_ROOT/projects/aimandala/scripts/validate_fixtures.py`

Golden 导出命令：

- `python3 $REPO_ROOT/projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-001 --version lite`
- `python3 $REPO_ROOT/projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version pro`
- `python3 $REPO_ROOT/projects/aimandala/scripts/export_fixture_golden.py --fixture-id toc-mvp-fixture-002 --version lite`

推荐先读：

- [`VALIDATION.md`](./VALIDATION.md)
