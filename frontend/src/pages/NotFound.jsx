import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        gap: 16,
        padding: 16,
      }}
    >
      <Brain size={36} color="var(--brand)" />
      <h1 style={{ margin: 0, fontSize: 24 }}>404 — Page Not Found</h1>
      <p style={{ margin: 0, color: "var(--text-secondary)", textAlign: "center" }}>
        The page you're looking for doesn't exist or may have moved.
      </p>
      <button className="btn btn-primary" onClick={() => navigate("/")}>
        Return to Dashboard
      </button>
    </div>
  );
}
