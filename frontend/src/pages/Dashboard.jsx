import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import Skeleton from "react-loading-skeleton";
import { Users, CheckCircle2, Target, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Layout from "../components/Layout";
import KPICard from "../components/KPICard";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data } = await api.get("/resume/dashboard/stats");
        setStats(data);
      } catch {
        setError(true);
        toast.error("Could not load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const gridColor = isDark ? "#30363d" : "#e2e8f0";
  const textColor = isDark ? "#8b949e" : "#64748b";

  const barData = stats && {
    labels: Object.keys(stats.matchScoreDistribution),
    datasets: [
      {
        label: "Number of Candidates",
        data: Object.values(stats.matchScoreDistribution),
        backgroundColor: "#151e5e",
        borderRadius: 6,
      },
    ],
  };

  const doughnutData = stats && {
    labels: Object.keys(stats.statusDistribution),
    datasets: [
      {
        data: Object.values(stats.statusDistribution),
        backgroundColor: ["#64748b", "#10b981", "#f59e0b", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <Layout title="Talent Intelligence Overview" subtitle="AI-driven recruitment metrics and workforce analytics">
      {loading ? (
        <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <Skeleton height={70} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "var(--text-secondary)" }}>
          Could not load dashboard metrics. Please check that the backend service is running.
        </div>
      ) : (
        <>
          <div className="kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            <KPICard icon={Users} label="Total Candidates Analyzed" value={stats.totalCandidates} accent="#151e5e" />
            <KPICard
              icon={CheckCircle2}
              label="Candidates Shortlisted"
              value={stats.shortlisted}
              subtext={`${stats.shortlistedPct}% of total candidates`}
              accent="#10b981"
            />
            <KPICard icon={Target} label="Average Match Score" value={stats.avgMatchScore} suffix="%" accent="#f59e0b" />
            <KPICard icon={Sparkles} label="Total Skills Extracted" value={stats.totalSkillsExtracted} accent="#58a6ff" />
          </div>

          <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 20 }}>
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Match Score Distribution</h3>
              <div style={{ height: 280 }}>
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { color: gridColor }, ticks: { color: textColor } },
                      y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor, precision: 0 },
                        title: { display: true, text: "Number of Candidates", color: textColor },
                      },
                    },
                  }}
                />
              </div>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15 }}>Candidate Status Distribution</h3>
              <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Doughnut
                  data={doughnutData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom", labels: { color: textColor } } },
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
