# Data

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/toC/data/README.md


这里放 `一镜一梳` To C 主产品当前主线所需的样本数据、示例输出或结构化输入。

要求：

- 优先放可复用示例
- 避免混入一次性调试垃圾
- 敏感数据进入前应先做脱敏或替换

它和后端运行时目录的区别是：

- `toC/data/`
  - 项目可复用的结构化示例或样本输入
- `toC/app/backend/data/interpretations/`
  - 本地联调时生成的运行时记录
- `toC/app/backend/data/uploads/`
  - 本地联调时保存的临时上传文件

也就是说，后两者属于运行时目录，不应反向冒充项目样本目录。

## Knowledge v2.1

当前 `知识库 v2.1` 的正式资产也放在这里：

- `toC/data/knowledge/packs/v2.1/`
  - 人维护的 `pack + YAML` 源资产
- `toC/data/knowledge/builds/current/index.json`
  - runtime 消费的编译产物

常用命令：

- 导出并重建知识包：
  - `python3 projects/aimandala/toC/app/backend/scripts/export_knowledge_pack_v21.py`
- 检查当前提交的知识包和编译产物是否漂移：
  - `python3 projects/aimandala/toC/app/backend/scripts/check_knowledge_pack_v21.py`
