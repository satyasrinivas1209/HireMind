export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div
      className="card"
      style={{
        padding: "48px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 6,
      }}
    >
      {Icon && (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 6,
          }}
        >
          <Icon size={22} color="var(--text-secondary)" />
        </div>
      )}
      <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
      {subtitle && <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)", maxWidth: 360 }}>{subtitle}</p>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
