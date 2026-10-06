import { useEffect, useState } from "react";
import {
  Mail,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  LogOut,
  FileText,
  UserCheck,
  Cpu,
  CopyCheck,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import api from "../api/axios";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import KPICard from "../components/KPICard";

function formatRelativeTime(dateString) {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Never";

  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function EmailApplications() {
  const [connection, setConnection] = useState({ connected: false });
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const [syncStats, setSyncStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [jobUsed, setJobUsed] = useState("");

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data } = await api.get("/email/status");
      setConnection(data);
      if (data.connected) {
        try {
          const res = await api.get("/resume");
          if (res.data && res.data.candidates) {
            setApplications(res.data.candidates);
          }
        } catch (e) {
          console.warn("Could not load candidates on status check:", e);
        }
      }
    } catch {
      toast.error("Could not check email connection status.");
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) {
      toast.success("Email account connected successfully!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get("error")) {
      toast.error("Unable to connect your email. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    checkStatus();
  }, []);

  const handleConnect = () => {
    setConnecting(true);
    toast.loading("Opening secure email authorization…", { id: "nylas-auth" });
    const apiBase = api.defaults.baseURL.replace(/\/+$/, "");
    window.location.href = `${apiBase}/email/auth`;
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post("/email/sync");
      setSyncStats({
        emailsScanned: data.emailsScanned ?? 0,
        applicationsFound: data.applicationsFound ?? 0,
        resumesProcessed: data.resumesProcessed ?? 0,
        newCandidates: data.newCandidates ?? 0,
        duplicatesSkipped: data.duplicatesSkipped ?? 0,
        errors: data.errors ?? 0,
      });
      setApplications(data.applications || []);
      setJobUsed(data.jobUsedForMatching || "");
      checkStatus();
      toast.success(`Sync completed! Added ${data.newCandidates ?? 0} new candidate(s).`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to sync applications right now.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.post("/email/disconnect");
      toast.success("Email account disconnected successfully.");
      setConnection({ connected: false });
      setSyncStats(null);
      setApplications([]);
      setShowDisconnectModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not disconnect email account.");
    } finally {
      setDisconnecting(false);
    }
  };

  const exportCsv = () => {
    const headers = ["Candidate", "From / Email", "Job Title", "Skills", "Experience", "Match Score", "Source"];
    const rows = filtered.map((a) => [
      a.candidateName || a.from || "",
      a.email || a.from || "",
      a.jobTitle || jobUsed || "",
      (a.skills || []).join("; "),
      a.experience || "",
      a.matchScore ?? "",
      a.source || "Nylas Email",
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
      (a.candidateName && a.candidateName.toLowerCase().includes(search.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
      (a.from && a.from.toLowerCase().includes(search.toLowerCase())) ||
      (a.subject && a.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout
      title="Email Applications"
      subtitle={
        connection.connected
          ? "Your email account is connected."
          : "Automatically process recruitment applications from your connected email."
      }
    >
      {checkingStatus ? (
        <Skeleton height={120} />
      ) : !connection.connected ? (
        <EmptyState
          icon={Mail}
          title="Connect your email account"
          subtitle="HireMind will scan application emails and process resume attachments automatically."
          action={
            <button className="btn btn-primary" onClick={handleConnect} disabled={connecting}>
              <Mail size={16} /> {connecting ? "Connecting your email…" : "Connect Email"}
            </button>
          }
        />
      ) : (
        <>
          {/* Connection Status Card */}
          <div className="card" style={{ marginBottom: 20, padding: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      fontSize: 12.5,
                      fontWeight: 700,
                      padding: "4px 10px",
                      borderRadius: 20,
                    }}
                  >
                    <CheckCircle2 size={14} /> Connected
                  </span>
                  {connection.isShared && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        background: "rgba(59, 130, 246, 0.15)",
                        color: "#3b82f6",
                        fontSize: 12.5,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 20,
                      }}
                    >
                      <ShieldCheck size={14} /> Shared System Inbox
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Nylas Multi-Provider Integration
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {connection.email || "Connected Account"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Provider: <strong style={{ textTransform: "capitalize", color: "var(--text-primary)" }}>{connection.provider || "Email"}</strong>
                  {"  ·  "}
                  Last synced: <strong style={{ color: "var(--text-primary)" }}>{formatRelativeTime(connection.lastSyncedAt)}</strong>
                  {jobUsed && `  ·  Matching for "${jobUsed}"`}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>
                  <RefreshCw size={15} className={syncing ? "spin" : ""} />
                  {syncing ? "Syncing applications…" : "Sync Applications"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDisconnectModal(true)}
                  disabled={syncing || disconnecting}
                  style={{ color: "var(--danger)" }}
                >
                  <LogOut size={15} /> Disconnect
                </button>
              </div>
            </div>
          </div>

          {/* Synchronization Statistics Section */}
          {syncStats && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={18} color="var(--brand)" /> Recent Synchronization
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                <KPICard icon={Mail} label="Emails Scanned" value={syncStats.emailsScanned} />
                <KPICard icon={FileText} label="Applications Found" value={syncStats.applicationsFound} accent="#3b82f6" />
                <KPICard icon={Cpu} label="Resumes Processed" value={syncStats.resumesProcessed} accent="#8b5cf6" />
                <KPICard icon={UserCheck} label="New Candidates" value={syncStats.newCandidates} accent="#10b981" />
                <KPICard icon={CopyCheck} label="Duplicates Skipped" value={syncStats.duplicatesSkipped} accent="#f59e0b" />
              </div>
            </div>
          )}

          {/* Table Header & Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ position: "relative", maxWidth: 320, width: "100%" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                className="input"
                placeholder="Search candidate name, email or skills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>
            <button className="btn btn-secondary" onClick={exportCsv} disabled={!applications.length}>
              <Download size={15} /> Export CSV
            </button>
          </div>

          {/* Candidates Table */}
          {applications.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="No applications retrieved yet"
              subtitle="Click Sync Applications to retrieve and process recruitment emails."
            />
          ) : (
            <div className="card scroll-x" style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    {["Candidate Name", "Email", "Job Title", "Skills", "Experience", "Match Score", "Source"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", color: "var(--text-secondary)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a._id || a.messageId} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {a.candidateName || "Applicant"}
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{a.email || a.from || "—"}</td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{a.jobTitle || jobUsed || "—"}</td>
                      <td style={{ padding: "12px 16px", maxWidth: 220 }}>{(a.skills || []).slice(0, 4).join(", ") || "—"}</td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>{a.experience || "—"}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: a.matchScore >= 70 ? "var(--success)" : "inherit" }}>
                        {a.matchScore !== null && a.matchScore !== undefined ? `${a.matchScore}%` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                        {a.source || "Nylas Email"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Disconnect Confirmation Modal */}
      <ConfirmDialog
        open={showDisconnectModal}
        title="Disconnect this email account?"
        message="Email synchronization will stop, but previously imported candidates will remain in HireMind."
        confirmLabel={disconnecting ? "Disconnecting…" : "Disconnect"}
        danger={true}
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnectModal(false)}
      />

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
