# ToC

> 状态：current
> 版本：0.1.0
> owner：Engineer
> last_updated：2026-05-06
> source_of_truth：projects/aimandala/toC/README.md


这里承接 `一镜一梳` 当前纳入 Monorepo 的 To C 主产品实现主线。

当前只放：

- 面向 To C 主产品的前后端应用入口
- 领域模型和主流程
- 对应测试
- 必需的数据样本或示例

当前目录建议理解为：

- `app/backend/`
  - To C 后端入口
- `app/frontend/`
  - To C 前端入口
- `domain/`
  - 领域对象和核心流程
- `tests/`
  - 自动化测试和脚本化验证
- `data/`
  - 当前主线所需示例和结构化数据

当前不放：

- To B 产品实现
- Studio 相关实现
- `V3` 实验级 API
- 内部工具
