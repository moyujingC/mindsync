# To C MVP Fixtures

这里放 `一镜一梳 To C MVP` 第一轮固定样本描述。

当前先固化的是“样本描述文件”，不是原始图片资产本身。这样做的目的：

- 先统一样本 ID、输入口径和预期结果
- 避免把本地运行时图片或未脱敏截图直接塞进仓库
- 为后续补真实脱敏图片、截图和自动化验证提供稳定入口

当前样本：

- `sample-a-lite-general.yaml`
- `sample-b-lite-to-pro-career.yaml`
- `sample-c-existing-reuse.yaml`

使用规则：

- 优先按样本 ID 在 QA、delivery、测试脚本中引用
- 若后续补真实图片资产，应放在本目录下对应子路径，并更新 `asset_ref`
- 不要把 `toC/app/backend/data/uploads/` 或 `interpretations/` 里的运行时文件回填到这里

最小校验命令：

- `python3 /Users/xinran/Downloads/dev/mindsync/projects/aimandala/scripts/validate_fixtures.py`
