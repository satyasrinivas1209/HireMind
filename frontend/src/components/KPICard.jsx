import CountUp from "react-countup";

export default function KPICard({ icon: Icon, label, value, suffix = "", subtext, accent = "var(--brand)" }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{label}</span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: `${accent}1a`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={accent} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
        <CountUp end={value} duration={1} separator="," suffix={suffix} />
      </div>
      {subtext && <div style={{ fontSize: 12.5, color: "var(--text-secondary)", marginTop: 4 }}>{subtext}</div>}
    </div>
  );
}
