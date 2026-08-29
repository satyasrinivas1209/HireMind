import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UploadCloud,
  Mail,
  LogOut,
  Brain,
  X,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/jobs", label: "Job Postings", icon: Briefcase },
  { to: "/candidates", label: "Talent Ranking", icon: Users },
  { to: "/upload", label: "Bulk Screening", icon: UploadCloud },
  { to: "/email-applications", label: "Email Applications", icon: Mail },
];



export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 40,
          }}
          className="sidebar-overlay"
        />
      )}
      <aside
        className={`hiremind-sidebar ${mobileOpen ? "open" : ""}`}
        style={{
          width: 256,
          background: "var(--card)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        <div style={{ padding: "22px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "var(--brand)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Brain size={19} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>HireMind</span>
          </div>
          <button
            onClick={onClose}
            className="mobile-only-close"
            style={{ background: "none", border: "none", cursor: "pointer", display: "none" }}
          >
            <X size={20} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--brand)" : "var(--text-secondary)",
                background: isActive ? "rgba(21,30,94,0.08)" : "transparent",
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          {user?.role === "Admin" && (
            <NavLink
              to="/team-accounts"
              onClick={onClose}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--brand)" : "var(--text-secondary)",
                background: isActive ? "rgba(21,30,94,0.08)" : "transparent",
              })}
            >
              <UserPlus size={18} />
              Team Accounts
            </NavLink>
          )}
        </nav>

        <div style={{ padding: 16, borderTop: "1px solid var(--border)" }}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{user?.role}</div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: "100%" }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
