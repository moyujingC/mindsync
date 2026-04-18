import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { DashboardPage } from "../pages/DashboardPage";
import { EnvironmentsPage } from "../pages/EnvironmentsPage";
import { EvalPage } from "../pages/EvalPage";
import { ModelLibraryPage } from "../pages/ModelLibraryPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { ProvidersPage } from "../pages/ProvidersPage";
import { RunsPage } from "../pages/RunsPage";
import { TasksPage } from "../pages/TasksPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/models" replace />} />
        <Route path="/models" element={<ModelLibraryPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/environments" element={<EnvironmentsPage />} />
        <Route path="/environments/:environmentId" element={<Navigate to="overview" replace />} />
        <Route path="/environments/:environmentId/:tab" element={<EnvironmentsPage />} />
        <Route path="/providers" element={<ProvidersPage />} />
        <Route path="/providers/:providerId" element={<ProvidersPage />} />
        <Route path="/eval" element={<Navigate to="/eval/scoreboard" replace />} />
        <Route path="/eval/:tab" element={<EvalPage />} />
        <Route
          path="/routes"
          element={
            <PlaceholderPage
              title="Routes"
              eyebrow="只读占位页"
              description="这里未来承接模型路由视图与任务路由视图，帮助内部运营查看“什么任务会走到哪里”。"
              purpose="把开发版的 Claude Code / Codex 路线与生产版的任务分流骨架放在同一张读图里。"
              futureSections={[
                "模型名 -> provider 的只读映射",
                "任务类型 -> 模型 / provider 的路由摘要",
                "仅国产模型与越界风险提示",
              ]}
              notIncluded={[
                "不提供保存策略",
                "不提供立即切流",
                "不提供发布到生产",
              ]}
            />
          }
        />
        <Route
          path="/usage"
          element={
            <PlaceholderPage
              title="Usage"
              eyebrow="只读占位页"
              description="这里未来承接请求量、token、TTFT、延迟、错误率和估算成本的按环境 / provider / 任务类型视角。"
              purpose="先把观测面与决策面分开，避免把 Usage 误读成真实控制台。"
              futureSections={[
                "按环境的 usage 汇总",
                "按 provider 的透明度与成本拆解",
                "按任务类型的降本观察",
              ]}
              notIncluded={[
                "不提供实时账单拉取",
                "不提供图表编辑",
                "不提供自动优化执行",
              ]}
            />
          }
        />
        <Route
          path="/policies"
          element={
            <PlaceholderPage
              title="Policies"
              eyebrow="边界说明页"
              description="这里未来承接环境边界、provider 白名单、日志策略与敏感数据约束，但 v1 只表达规则，不表达真实编辑能力。"
              purpose="显式固定生产边界，避免把开发版观察策略错带进生产版。"
              futureSections={[
                "心理疗愈生产版只允许国产模型",
                "生产版不默认记录敏感正文",
                "开发版观测策略不能直接复用于生产",
              ]}
              notIncluded={[
                "不提供编辑生产白名单",
                "不提供启用自动路由",
                "不提供立即应用配置",
              ]}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Settings"
              eyebrow="只读占位页"
              description="这里未来承接环境级系统信息、版本信息和只读配置入口，当前只保留心智位置。"
              purpose="让后续真实控制台后端接入时有稳定容器，但不把 v1 静态壳误导成配置编辑器。"
              futureSections={[
                "版本与环境元数据",
                "只读系统配置摘要",
                "后续 API / sidecar 接入占位",
              ]}
              notIncluded={[
                "不提供鉴权设置",
                "不提供密钥管理",
                "不提供任何可写入操作",
              ]}
            />
          }
        />
      </Route>
    </Routes>
  );
}
