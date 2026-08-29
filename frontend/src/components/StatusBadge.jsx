const STATUS_STYLES = {
  Pending: { bg: "rgba(100,116,139,0.15)", color: "#64748b" },
  Shortlisted: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  Interviewing: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  Rejected: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  return (
    <span className="badge" style={{ background: style.bg, color: style.color }}>
      {status}
    </span>
  );
}
