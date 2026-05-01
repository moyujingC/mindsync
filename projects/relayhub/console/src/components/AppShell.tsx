import { NavLink, Outlet } from "react-router-dom";

type TrialBootstrapGlobalScope = typeof globalThis & {
  __RELAYHUB_TRIAL_BOOTSTRAP_ERROR__?: string;
};

const navGroups = [
  {
    label: "核心模块",
    items: [
      { to: "/models", label: "模型库" },
      { to: "/tasks", label: "任务库" },
      { to: "/runs", label: "运行记录" },
    ],
  },
  {
    label: "支持模块",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/providers", label: "外部模型源" },
      { to: "/environments", label: "Environments" },
      { to: "/eval", label: "Eval" },
      { to: "/routes", label: "Routes" },
      { to: "/usage", label: "Usage" },
      { to: "/policies", label: "Policies" },
      { to: "/settings", label: "Settings" },
    ],
  },
];

export function AppShell() {
  const bootstrapError = (globalThis as TrialBootstrapGlobalScope)
    .__RELAYHUB_TRIAL_BOOTSTRAP_ERROR__;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-card">
          <span className="eyebrow">RelayHub Console v1</span>
          <h1>治理控制台下的模型库试用版</h1>
          <p>
            当前主路径是“添加模型并激活”，再进入任务绑定和运行记录。外部模型目录只读 trial 保留，但已经降级为支持能力。
          </p>
        </div>

        <section className="nav-group">
          <p className="nav-group-label">核心模块</p>
          <nav className="nav-list" aria-label="核心模块">
            {navGroups[0]!.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link${isActive ? " is-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </section>

        <details className="nav-group nav-group-support" open={false}>
          <summary className="nav-group-summary">
            <span className="nav-group-label">支持模块</span>
            <span className="nav-group-summary-note">按需展开</span>
          </summary>
          <nav className="nav-list nav-list-support" aria-label="支持模块">
            {navGroups[1]!.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link nav-link-support${isActive ? " is-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </details>

        <div className="sidebar-note">
          <strong>v1 边界</strong>
          <ul>
            <li>优先服务模型库、任务库和运行记录</li>
            <li>手动测试连接，不做自动续费和余额判断</li>
            <li>不直接接入外部程序自动回传</li>
          </ul>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">治理控制台试用版</p>
            <h2>先把模型资产和任务绑定收口，再开始积累可比较的运行数据</h2>
          </div>
          <div className="topbar-badges">
            <span className="pill pill-degraded">模型资产治理中</span>
            <span className="pill pill-neutral">默认主入口仍为 mock</span>
          </div>
        </header>

        {bootstrapError ? (
          <section className="bootstrap-warning">
            <strong>只读模型源启动失败</strong>
            <p>
              当前已降级继续渲染模型库 / 任务库主界面；支持模块里的外部模型源可能不可用。
              具体错误：{bootstrapError}
            </p>
          </section>
        ) : null}

        <main className="main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
