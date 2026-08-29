import { useEffect, useState } from "react";
import { Search, Users, CheckCircle2, XCircle, CalendarClock } from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import api from "../api/axios";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";

const FILTERS = ["All", "Pending", "Shortlisted", "Interviewing", "Rejected"];
const SORTS = [
  { value: "highest", label: "Highest Score" },
  { value: "lowest", label: "Lowest Score" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
];

function verdictColor(verdict) {
  if (verdict === "Strong Match") return "#10b981";
  if (verdict === "Moderate Match") return "#f59e0b";
  return "#ef4444";
}

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("highest");
  const [selected, setSelected] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/resume", { params: { search, status, sort } });
      setCandidates(data.candidates);
      if (data.candidates.length && !selected) setSelected(data.candidates[0]);
    } catch {
      toast.error("Could not load candidates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, sort]);

  const updateStatus = async (candidate, newStatus) => {
    try {
      const { data } = await api.patch(`/resume/${candidate._id}/status`, { status: newStatus });
      setCandidates((cs) => cs.map((c) => (c._id === candidate._id ? data.candidate : c)));
      setSelected(data.candidate);
      toast.success(`Candidate marked as ${newStatus}.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update status.");
    }
  };

  const handleReject = async () => {
    await updateStatus(rejectTarget, "Rejected");
    setRejectTarget(null);
  };

  return (
    <Layout title="Talent Pool" subtitle="Identify and advance your strongest candidates">
      <div className="candidates-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 20, alignItems: "start" }}>
        {/* LEFT: List */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input
                className="input"
                placeholder="Search name or skills…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatus(f)}
                className="badge"
                style={{
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                  background: status === f ? "var(--brand)" : "transparent",
                  color: status === f ? "#fff" : "var(--text-secondary)",
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} style={{ marginBottom: 12 }}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                Sort: {s.label}
              </option>
            ))}
          </select>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} height={64} />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <EmptyState icon={Users} title="No candidates found" subtitle="Try adjusting your search or filters." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 560, overflowY: "auto" }}>
              {candidates.map((c) => (
                <div
                  key={c._id}
                  onClick={() => setSelected(c)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    cursor: "pointer",
                    border: `1px solid ${selected?._id === c._id ? "var(--brand)" : "var(--border)"}`,
                    background: selected?._id === c._id ? "rgba(21,30,94,0.05)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.candidateName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.email}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{c.matchScore}%</div>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Profile */}
        <div className="card" style={{ padding: 24 }}>
          {!selected ? (
            <EmptyState icon={Users} title="Select a candidate" subtitle="Choose a candidate from the list to view their full profile." />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: "0 0 4px", fontSize: 19 }}>{selected.candidateName}</h2>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selected.email}{selected.phone ? ` · ${selected.phone}` : ""}</div>
                  <div style={{ marginTop: 6 }}>
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-secondary" onClick={() => updateStatus(selected, "Shortlisted")}>
                    <CheckCircle2 size={15} /> Shortlist
                  </button>
                  <button className="btn btn-secondary" onClick={() => updateStatus(selected, "Interviewing")}>
                    <CalendarClock size={15} /> Interview
                  </button>
                  <button className="btn btn-secondary" style={{ color: "var(--danger)" }} onClick={() => setRejectTarget(selected)}>
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              </div>

              {/* AI Match Analysis */}
              <div className="card" style={{ padding: 18, marginBottom: 18, background: "var(--bg)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: "50%",
                      background: `conic-gradient(${verdictColor(selected.verdict)} ${selected.matchScore * 3.6}deg, var(--border) 0deg)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        background: "var(--card)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 17,
                      }}
                    >
                      {selected.matchScore}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: verdictColor(selected.verdict) }}>{selected.verdict}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
                      Based on explicit required-skill matching and text similarity against{" "}
                      <strong>{selected.job?.title || selected.jobTitle}</strong>.
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--success)", marginBottom: 6 }}>Matching Skills</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selected.matchingSkills.length ? (
                        selected.matchingSkills.map((s) => (
                          <span key={s} className="badge" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
                            {s}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>None detected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--danger)", marginBottom: 6 }}>Missing Skills</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {selected.missingSkills.length ? (
                        selected.missingSkills.map((s) => (
                          <span key={s} className="badge" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                            {s}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>None — all required skills matched</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Experience</div>
                  <div style={{ fontSize: 14 }}>{selected.experience}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Education</div>
                  <div style={{ fontSize: 14 }}>{selected.education.join(", ") || "Not specified"}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>All Extracted Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selected.skills.map((s) => (
                    <span key={s} className="badge" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        title="Reject this candidate?"
        message={`${rejectTarget?.candidateName} will be marked as Rejected.`}
        confirmLabel="Reject"
        danger
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />
    </Layout>
  );
}
