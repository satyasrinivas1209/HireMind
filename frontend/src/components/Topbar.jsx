import { Menu, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ title, subtitle, onMenuClick, theme, onToggleTheme }) {
  const { user } = useAuth();

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--card)",
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onMenuClick}
          className="topbar-menu-btn"
          style={{ background: "none", border: "none", cursor: "pointer", display: "none" }}
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h1>
          {subtitle && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>{subtitle}</p>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          style={{
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 8,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-primary)",
          }}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <div style={{ textAlign: "right", display: "none" }} className="topbar-user">
          <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{user?.role}</div>
        </div>
      </div>
    </header>
  );
}
