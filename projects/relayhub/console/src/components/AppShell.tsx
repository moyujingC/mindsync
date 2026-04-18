import { NavLink, Outlet } from "react-router-dom";

const navGroups = [
  {
    label: "核心模块",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/environments", label: "Environments" },
      { to: "/providers", label: "Providers" },
      { to: "/eval", label: "Eval" },
    ],
  },
  {
    label: "占位模块",
    items: [
      { to: "/routes", label: "Routes" },
      { to: "/usage", label: "Usage" },
      { to: "/policies", label: "Policies" },
      { to: "/runs", label: "Runs" },
      { to: "/settings", label: "Settings" },
    ],
  },
];

export function AppShell() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand-card">
          <span className="eyebrow">RelayHub Console v1</span>
          <h1>OpenAI-compatible 模型目录试用版</h1>
          <p>
            当前页面是只读试用版，数据来自同源 `/api/models`，当前重点是验证模型目录可见性与详情可读性。
          </p>
        </div>

        {navGroups.map((group) => (
          <section key={group.label} className="nav-group">
            <p className="nav-group-label">{group.label}</p>
            <nav className="nav-list" aria-label={group.label}>
              {group.items.map((item) => (
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
        ))}

        <div className="sidebar-note">
          <strong>v1 边界</strong>
          <ul>
            <li>只读静态页</li>
            <li>当前仅验证模型目录可见性与详情可读性</li>
            <li>不提供任何可写入操作</li>
          </ul>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">只读试用版</p>
            <h2>当前数据来自 OpenAI-compatible 模型目录，不代表完整 provider 治理后台</h2>
          </div>
          <div className="topbar-badges">
            <span className="pill pill-risk">只读试用版</span>
            <span className="pill pill-neutral">无真实控制能力</span>
          </div>
        </header>

        <main className="main-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
