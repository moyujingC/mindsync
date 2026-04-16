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
          <h1>模型接入与评测中心</h1>
          <p>
            面向内部运营的静态壳。先把环境、评测和风险边界表达清楚，再接真实 API。
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
            <li>仅本地 fixtures</li>
            <li>不接后端 / 鉴权 / 数据库</li>
          </ul>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">内部运营台</p>
            <h2>环境优先、开发版与生产版显式分离、Eval 为一级模块</h2>
          </div>
          <div className="topbar-badges">
            <span className="pill pill-risk">只读静态壳</span>
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
