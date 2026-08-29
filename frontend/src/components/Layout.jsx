import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import HRChatbot from "./HRChatbot";

export default function Layout({ title, subtitle, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("hiremind-theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hiremind-theme", theme);
  }, [theme]);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileOpen(true)}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        />
        <main style={{ flex: 1, padding: 24 }}>{children}</main>
      </div>
      <HRChatbot />
    </div>
  );
}
