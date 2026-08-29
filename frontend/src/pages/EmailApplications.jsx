import { useEffect, useState } from "react";
import { Mail, RefreshCw, Download, Search, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import api from "../api/axios";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState";

export default function EmailApplications() {
  const [connected, setConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [applications, setApplications] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState("");
  const [jobUsed, setJobUsed] = useState("");

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data } = await api.get("/email/status");
      setConnected(data.connected);
    } catch {
      toast.error("Could not check Gmail connection status.");
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) toast.success("Gmail connected successfully!");
    if (params.get("error")) toast.error("Gmail authorization failed. Please try again.");
    checkStatus();
  }, []);

  const handleConnect = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/email/auth`;
  };

  const handleFetch = async () => {
    setFetching(true);
    try {
      const { data } = await api.get("/email/fetch");
      setApplications(data.applications);
      setJobUsed(data.jobUsedForMatching);
      toast.success(`Retrieved ${data.applications.length} application(s).`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not fetch Gmail applications.");
    } finally {
      setFetching(false);
    }
  };

  const exportCsv = () => {
    const headers = ["From", "Subject", "Date", "Skills", "Experience", "Education", "Match Score"];
    const rows = filtered.map((a) => [
      a.from,
      a.subject,
      a.date || "",
      (a.skills || []).join("; "),
      a.experience || "",
      (a.education || []).join("; "),
      a.matchScore ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hiremind-email-applications.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = applications.filter(
    (a) =>
      !search ||
      a.from?.toLowerCase().includes(search.toLowerCase()) ||
      a.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Email Applications" subtitle="Automatically process recruitment applications from Gmail">
      {checkingStatus ? (
        <Skeleton height={80} />
      ) : !connected ? (
        <EmptyState
          icon={Mail}
          title="Connect your Gmail account"
          subtitle="HireMind will scan for recent application emails with resume attachments and run them through the parsing pipeline automatically."
          action={
            <button className="btn btn-primary" onClick={handleConnect}>
              <Mail size={16} /> Connect Gmail
            </button>
          }
        />
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--success)" }}>
              <CheckCircle2 size={16} /> Gmail connected{jobUsed && ` · Matching against "${jobUsed}"`}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary" onClick={exportCsv} disabled={!applications.length}>
                <Download size={15} /> Export CSV
              </button>
              <button className="btn btn-primary" onClick={handleFetch} disabled={fetching}>
                <RefreshCw size={15} className={fetching ? "spin" : ""} /> {fetching ? "Fetching…" : "Refresh"}
              </button>
            </div>
          </div>

          <div style={{ position: "relative", marginBottom: 14, maxWidth: 320 }}>
            <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input className="input" placeholder="Search sender or subject…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
          </div>

          {applications.length === 0 ? (
            <EmptyState icon={Mail} title="No applications retrieved yet" subtitle="Click Refresh to fetch recent application emails from Gmail." />
          ) : (
            <div className="card scroll-x" style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    {["From", "Subject", "Date", "Skills", "Experience", "Education", "Match Score"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.messageId} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.from}</td>
                      <td style={{ padding: "12px 16px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.subject}</td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{a.date ? new Date(a.date).toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "12px 16px", maxWidth: 220 }}>{(a.skills || []).slice(0, 4).join(", ") || "—"}</td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{a.experience || "—"}</td>
                      <td style={{ padding: "12px 16px", maxWidth: 180 }}>{(a.education || []).join(", ") || "—"}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>{a.matchScore !== null && a.matchScore !== undefined ? `${a.matchScore}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
