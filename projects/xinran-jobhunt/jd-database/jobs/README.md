> 状态：current
> 版本：0.1.0
> source_of_truth：自动补齐

# Jobs

这个目录按“一岗一文件”维护。

每次从截图录入新岗位时：

1. 复制 `../templates/JD记录模板.md`
2. 按命名规则新建文件
3. 补全统一 frontmatter 字段和正文
4. 同步更新 `../index.yaml`
5. 默认写入 `status: "applied"` 和 `applied_at`
