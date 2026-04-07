# Uploads Runtime Data

这里是 `aimandala` 后端运行时保存浏览器上传文件的本地临时目录。

当前用途：

- 为迁移期 `upload-image -> image_path` 主链提供本地落盘
- 在切换远程对象存储前，保留当前后端可消费的本地路径语义

默认要求：

- 这里的文件都是运行时临时文件，不应提交到仓库
- 长期样本不要放在这里
- 需要保留样本时，应迁到 `fixtures/` 或 `toC/data/`
