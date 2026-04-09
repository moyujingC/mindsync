# Fixtures

这里放 `一镜一梳` 迁移与验证阶段使用的模拟样本、测试输入和验收样例。

它和 `toC/data/` 的区别是：

- `fixtures/` 偏向验证与测试样例
- `toC/data/` 偏向运行时所需示例或结构化数据

默认要求：

- 这里放“需要被重复验证”的固定样本
- 不直接存放后端运行时生成的解读记录
- 不把浏览器临时上传文件放到这里

如果样本来自一次联调或人工验收，应先脱敏，再整理成可复用 fixture 再进入本目录。

当前已沉淀：

- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/manifest.yaml`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/toc-mvp/README.md`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/toc-mvp/sample-a-lite-general.yaml`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/toc-mvp/sample-b-lite-to-pro-career.yaml`
- `/Users/xinran/Downloads/dev/mindsync/projects/aimandala/fixtures/toc-mvp/sample-c-existing-reuse.yaml`

最小校验命令：

- `python3 /Users/xinran/Downloads/dev/mindsync/projects/aimandala/scripts/validate_fixtures.py`
