import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Filter,
  Download,
  Search,
  Users,
  CheckSquare,
  Square,
  AlertTriangle,
  FolderArchive,
  Play,
  RotateCcw,
  Trash2,
  Briefcase,
  Layers,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import toast from "react-hot-toast";
import JSZip from "jszip";
import api from "../api/axios";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";

const MAX_FILE_MB = 5;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const CONCURRENCY_LIMIT = 4;

function verdictColor(verdict) {
  if (verdict === "Strong Match") return "#10b981";
  if (verdict === "Moderate Match") return "#f59e0b";
  return "#ef4444";
}

export default function BulkResumeScreening() {
  const navigate = useNavigate();

  // Job selection state
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const selectedJob = jobs.find((j) => j._id === selectedJobId);

  // File queue & state
  const [fileQueue, setFileQueue] = useState([]); // [{ id, file, name, size, status: 'Queued'|'Parsing'|'Scored'|'Failed', result, error, category }]
  const [dragActive, setDragActive] = useState(false);
  const [scanningFiles, setScanningFiles] = useState(false);

  // Batch progress state
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Filter & tab controls
  const [activeTab, setActiveTab] = useState("results"); // 'results' | 'needs_review'
  const [matchScoreThreshold, setMatchScoreThreshold] = useState(70);
  const [minMatchFilter, setMinMatchFilter] = useState(0);
  const [minExpFilter, setMinExpFilter] = useState(0);
  const [skillFilter, setSkillFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("matchScore_desc");

  // Selection & Bulk actions
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  // Load active jobs
  useEffect(() => {
    api
      .get("/jobs")
      .then(({ data }) => {
        const activeJobs = (data.jobs || []).filter((j) => j.isActive);
        setJobs(activeJobs);
        if (activeJobs.length > 0) {
          setSelectedJobId(activeJobs[0]._id);
        }
      })
      .catch(() => toast.error("Could not load job postings."));
  }, []);

  // Process dropped files / zip archives / folders
  const extractPdfFiles = async (filesOrItems) => {
    setScanningFiles(true);
    const pdfItems = [];
    const failedItems = [];

    const processSingleFile = async (file) => {
      const name = file.name;
      const lowerName = name.toLowerCase();

      if (file.size > MAX_FILE_BYTES) {
        failedItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name,
          size: file.size,
          status: "Failed",
          error: `File size exceeds maximum ${MAX_FILE_MB} MB limit`,
          category: "File Size Limit",
        });
        return;
      }

      if (lowerName.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
        try {
          const zip = await JSZip.loadAsync(file);
          const entries = Object.entries(zip.files);
          for (const [relativePath, entry] of entries) {
            if (!entry.dir && relativePath.toLowerCase().endsWith(".pdf") && !relativePath.includes("__MACOSX")) {
              const blob = await entry.async("blob");
              const fileName = relativePath.split("/").pop() || "resume.pdf";
              const unzippedFile = new File([blob], fileName, { type: "application/pdf" });

              if (unzippedFile.size > MAX_FILE_BYTES) {
                failedItems.push({
                  id: Math.random().toString(36).substring(2, 9),
                  file: unzippedFile,
                  name: fileName,
                  size: unzippedFile.size,
                  status: "Failed",
                  error: `File inside ZIP exceeds ${MAX_FILE_MB} MB limit`,
                  category: "File Size Limit",
                });
              } else {
                pdfItems.push({
                  id: Math.random().toString(36).substring(2, 9),
                  file: unzippedFile,
                  name: fileName,
                  size: unzippedFile.size,
                  status: "Queued",
                  result: null,
                  error: "",
                  category: "",
                });
              }
            }
          }
        } catch (err) {
          failedItems.push({
            id: Math.random().toString(36).substring(2, 9),
            file,
            name,
            size: file.size,
            status: "Failed",
            error: "Corrupt or unreadable ZIP archive",
            category: "Corrupt Archive",
          });
        }
      } else if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
        pdfItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name,
          size: file.size,
          status: "Queued",
          result: null,
          error: "",
          category: "",
        });
      } else {
        failedItems.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name,
          size: file.size,
          status: "Failed",
          error: "Unsupported file format. Only PDF files and ZIP archives are accepted.",
          category: "Unsupported Format",
        });
      }
    };

    let rawFiles = [];
    if (filesOrItems instanceof FileList || Array.isArray(filesOrItems)) {
      rawFiles = Array.from(filesOrItems);
    } else if (filesOrItems && filesOrItems[0] && filesOrItems[0].webkitGetAsEntry) {
      const entryPromises = [];
      const traverseEntry = (entry) => {
        return new Promise((resolve) => {
          if (entry.isFile) {
            entry.file((file) => {
              rawFiles.push(file);
              resolve();
            });
          } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            dirReader.readEntries(async (entries) => {
              for (const child of entries) {
                await traverseEntry(child);
              }
              resolve();
            });
          } else {
            resolve();
          }
        });
      };

      for (let i = 0; i < filesOrItems.length; i++) {
        const entry = filesOrItems[i].webkitGetAsEntry();
        if (entry) entryPromises.push(traverseEntry(entry));
      }
      await Promise.all(entryPromises);
    }

    for (const f of rawFiles) {
      await processSingleFile(f);
    }

    setScanningFiles(false);

    if (pdfItems.length === 0 && failedItems.length === 0) {
      toast.error("No PDF resumes found in selected files or folders.");
      return;
    }

    setFileQueue((prev) => [...prev, ...pdfItems, ...failedItems]);
    toast.success(`Discovered ${pdfItems.length} PDF resumes (${failedItems.length} invalid/failed).`);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    if (!selectedJobId) {
      toast.error("Please select a Target Job first.");
      return;
    }
    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      await extractPdfFiles(items);
    } else if (e.dataTransfer.files) {
      await extractPdfFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = async (e) => {
    if (!selectedJobId) {
      toast.error("Please select a Target Job first.");
      return;
    }
    if (e.target.files && e.target.files.length > 0) {
      await extractPdfFiles(e.target.files);
      e.target.value = "";
    }
  };

  // Async processing worker pool
  const startBulkScreening = async () => {
    if (!selectedJobId) {
      toast.error("Please select a Target Job first.");
      return;
    }

    const queuedIndices = [];
    fileQueue.forEach((item, index) => {
      if (item.status === "Queued") queuedIndices.push(index);
    });

    if (queuedIndices.length === 0) {
      toast.error("No queued files ready for screening.");
      return;
    }

    setIsProcessing(true);
    let doneCounter = 0;

    const processQueueItem = async (index) => {
      const item = fileQueue[index];
      if (!item || item.status !== "Queued") return;

      setFileQueue((prev) =>
        prev.map((q, i) => (i === index ? { ...q, status: "Parsing" } : q))
      );

      const formData = new FormData();
      formData.append("resume", item.file);
      formData.append("jobId", selectedJobId);

      try {
        const { data } = await api.post("/resume/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setFileQueue((prev) =>
          prev.map((q, i) =>
            i === index
              ? {
                  ...q,
                  status: "Scored",
                  result: data.candidate,
                }
              : q
          )
        );
      } catch (err) {
        const errorMsg =
          err?.response?.data?.message || "Failed to extract text or calculate score.";
        const category = errorMsg.toLowerCase().includes("text")
          ? "Scanned / Non-Text PDF"
          : errorMsg.toLowerCase().includes("corrupt")
          ? "Corrupt File"
          : "Parsing Error";

        setFileQueue((prev) =>
          prev.map((q, i) =>
            i === index
              ? {
                  ...q,
                  status: "Failed",
                  error: errorMsg,
                  category,
                }
              : q
          )
        );
      } finally {
        doneCounter++;
        setCompletedCount(doneCounter);
      }
    };

    const queueCopy = [...queuedIndices];
    const workers = Array(Math.min(CONCURRENCY_LIMIT, queueCopy.length))
      .fill(null)
      .map(async () => {
        while (queueCopy.length > 0) {
          const nextIndex = queueCopy.shift();
          if (nextIndex !== undefined) {
            await processQueueItem(nextIndex);
          }
        }
      });

    await Promise.all(workers);
    setIsProcessing(false);
    toast.success("Bulk resume screening batch completed!");
  };

  const clearQueue = () => {
    setFileQueue([]);
    setCompletedCount(0);
    setSelectedCandidateIds([]);
  };

  // Metrics computation
  const scoredItems = fileQueue.filter((item) => item.status === "Scored" && item.result);
  const failedItems = fileQueue.filter((item) => item.status === "Failed");
  const queuedItems = fileQueue.filter((item) => item.status === "Queued");

  const totalProcessed = scoredItems.length + failedItems.length;
  const aboveThresholdCount = scoredItems.filter(
    (item) => (item.result.matchScore || 0) >= matchScoreThreshold
  ).length;
  const avgMatchScore = scoredItems.length
    ? Math.round(
        scoredItems.reduce((acc, item) => acc + (item.result.matchScore || 0), 0) /
          scoredItems.length
      )
    : 0;

  // Filter & sort scored candidates
  const filteredCandidates = scoredItems
    .map((item) => item.result)
    .filter((cand) => {
      if (!cand) return false;
      const score = cand.matchScore || 0;
      if (score < minMatchFilter) return false;

      const expNum = parseFloat(cand.experience) || 0;
      if (minExpFilter > 0 && expNum < minExpFilter) return false;

      if (skillFilter) {
        const hasSkill = (cand.skills || []).some(
          (s) => s.toLowerCase() === skillFilter.toLowerCase()
        );
        if (!hasSkill) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = cand.candidateName?.toLowerCase().includes(q);
        const matchEmail = cand.email?.toLowerCase().includes(q);
        const matchSkills = (cand.skills || []).some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchEmail && !matchSkills) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortField === "matchScore_desc") return b.matchScore - a.matchScore;
      if (sortField === "matchScore_asc") return a.matchScore - b.matchScore;
      if (sortField === "exp_desc") return (parseFloat(b.experience) || 0) - (parseFloat(a.experience) || 0);
      if (sortField === "name_asc") return a.candidateName.localeCompare(b.candidateName);
      return 0;
    });

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedCandidateIds.length === filteredCandidates.length) {
      setSelectedCandidateIds([]);
    } else {
      setSelectedCandidateIds(filteredCandidates.map((c) => c._id));
    }
  };

  const handleToggleCandidate = (id) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedCandidateIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      await api.patch("/resume/bulk-status", {
        candidateIds: selectedCandidateIds,
        status,
      });

      setFileQueue((prev) =>
        prev.map((item) => {
          if (item.result && selectedCandidateIds.includes(item.result._id)) {
            return {
              ...item,
              result: { ...item.result, status },
            };
          }
          return item;
        })
      );

      toast.success(`Marked ${selectedCandidateIds.length} candidate(s) as ${status}.`);
      setSelectedCandidateIds([]);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update candidates.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const candidatesToExport =
      selectedCandidateIds.length > 0
        ? filteredCandidates.filter((c) => selectedCandidateIds.includes(c._id))
        : filteredCandidates;

    if (candidatesToExport.length === 0) {
      toast.error("No candidates to export.");
      return;
    }

    const headers = [
      "Candidate Name",
      "Match Score %",
      "Verdict",
      "Email",
      "Phone",
      "Experience",
      "Education",
      "Skills",
      "Matching Skills",
      "Missing Skills",
      "Status",
    ];

    const rows = candidatesToExport.map((c) => [
      `"${c.candidateName || ""}"`,
      c.matchScore || 0,
      `"${c.verdict || ""}"`,
      `"${c.email || ""}"`,
      `"${c.phone || ""}"`,
      `"${c.experience || ""}"`,
      `"${(c.education || []).join("; ")}"`,
      `"${(c.skills || []).join("; ")}"`,
      `"${(c.matchingSkills || []).join("; ")}"`,
      `"${(c.missingSkills || []).join("; ")}"`,
      `"${c.status || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `HireMind_Screening_${selectedJob?.title.replace(/[^a-zA-Z0-9]/g, "_") || "Job"}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${candidatesToExport.length} candidate(s) to CSV.`);
  };

  const handleSendToTalentPool = () => {
    if (selectedJobId) {
      navigate(`/candidates?jobId=${selectedJobId}`);
    } else {
      navigate("/candidates");
    }
  };

  return (
    <Layout
      title="Bulk Resume Screening"
      subtitle="Screen thousands of candidate resumes against a single job with AI skill matching"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* TOP TOOLBAR: JOB FIRST SELECTION */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <Briefcase size={16} color="var(--brand)" /> Select Target Job
              </label>
              <select
                className="input"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                disabled={isProcessing}
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                <option value="">Choose a job posting…</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedJob && (
              <div style={{ flex: 2, minWidth: 320, background: "var(--bg)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
                  Required Job Skills ({selectedJob.requiredSkills?.length || 0})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selectedJob.requiredSkills?.map((skill) => (
                    <span key={skill} className="badge" style={{ background: "rgba(21,30,94,0.08)", color: "var(--brand)", fontWeight: 600 }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BULK DROPZONE & FILE COUNTER */}
        <div className="card" style={{ padding: 24 }}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? "var(--brand)" : "var(--border)"}`,
              borderRadius: 12,
              padding: 32,
              textAlign: "center",
              cursor: "pointer",
              background: dragActive ? "rgba(21,30,94,0.04)" : "var(--bg)",
              transition: "all 0.2s ease",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.zip,application/pdf,application/zip"
              multiple
              hidden
              onChange={handleFileInput}
            />
            <input
              ref={folderInputRef}
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              hidden
              onChange={handleFileInput}
            />

            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(21,30,94,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UploadCloud size={24} color="var(--brand)" />
              </div>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FolderArchive size={24} color="#10b981" />
              </div>
            </div>

            <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>
              {scanningFiles ? "Scanning files & unpacking ZIPs…" : "Drag & Drop Resume Folders, ZIP Archives, or Multiple PDFs"}
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-secondary)" }}>
              Accepts thousands of PDF files, ZIP packages, or full folders up to 5 MB per file.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || scanningFiles}
              >
                <FileText size={16} /> Choose PDF / ZIP Files
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => folderInputRef.current?.click()}
                disabled={isProcessing || scanningFiles}
              >
                <FolderArchive size={16} /> Select Folder
              </button>
            </div>
          </div>

          {/* QUEUE STATUS & ACTION BAR */}
          {fileQueue.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="badge" style={{ background: "var(--brand)", color: "#fff", padding: "6px 12px", fontSize: 13, fontWeight: 700 }}>
                  {fileQueue.length} File{fileQueue.length > 1 ? "s" : ""} Loaded
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  ({queuedItems.length} queued · {scoredItems.length} scored · {failedItems.length} failed)
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {fileQueue.length > 0 && !isProcessing && (
                  <button className="btn btn-secondary" style={{ color: "var(--danger)" }} onClick={clearQueue}>
                    <Trash2 size={15} /> Clear Batch
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={startBulkScreening}
                  disabled={isProcessing || queuedItems.length === 0}
                  style={{ padding: "8px 20px" }}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="spin" /> Screening ({completedCount}/{fileQueue.length})
                    </>
                  ) : (
                    <>
                      <Play size={16} /> Start Bulk Screening ({queuedItems.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ASYNC PROGRESS BAR */}
          {isProcessing && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                <span>Async Screening Queue Progress</span>
                <span>
                  {completedCount} / {fileQueue.length} processed ({Math.round((completedCount / fileQueue.length) * 100)}%)
                </span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: "var(--border)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(completedCount / fileQueue.length) * 100}%`,
                    background: "var(--brand)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* SUMMARY KPI PANEL */}
        {fileQueue.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Total Processed</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{totalProcessed}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>out of {fileQueue.length} files</div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--success)" }}>Above Threshold</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>≥</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={matchScoreThreshold}
                    onChange={(e) => setMatchScoreThreshold(Number(e.target.value))}
                    style={{ width: 45, padding: "2px 4px", fontSize: 12, textAlign: "center", borderRadius: 4, border: "1px solid var(--border)" }}
                  />
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>%</span>
                </div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--success)" }}>{aboveThresholdCount}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                {scoredItems.length ? Math.round((aboveThresholdCount / scoredItems.length) * 100) : 0}% of scored
              </div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--danger)", marginBottom: 4 }}>Needs Review / Failed</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--danger)" }}>{failedItems.length}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>unparseable / errors</div>
            </div>

            <div className="card" style={{ padding: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Average Match Score</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "var(--brand)" }}>{avgMatchScore}%</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>across scored resumes</div>
            </div>
          </div>
        )}

        {/* RESULTS & NEEDS REVIEW TABS */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="badge"
                onClick={() => setActiveTab("results")}
                style={{
                  cursor: "pointer",
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "1px solid var(--border)",
                  background: activeTab === "results" ? "var(--brand)" : "transparent",
                  color: activeTab === "results" ? "#fff" : "var(--text-secondary)",
                }}
              >
                Scored Candidates ({scoredItems.length})
              </button>
              <button
                className="badge"
                onClick={() => setActiveTab("needs_review")}
                style={{
                  cursor: "pointer",
                  padding: "8px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  border: "1px solid var(--border)",
                  background: activeTab === "needs_review" ? "var(--danger)" : "transparent",
                  color: activeTab === "needs_review" ? "#fff" : "var(--text-secondary)",
                }}
              >
                Needs Review / Failures ({failedItems.length})
              </button>
            </div>

            {/* TAB 1 FILTERS & TOOLBAR */}
            {activeTab === "results" && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                  <input
                    className="input"
                    placeholder="Search candidate or skill…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: 30, width: 200, fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                  <span>Min Score:</span>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="10"
                    value={minMatchFilter}
                    onChange={(e) => setMinMatchFilter(Number(e.target.value))}
                    style={{ width: 80 }}
                  />
                  <span>{minMatchFilter}%</span>
                </div>

                <select
                  className="input"
                  value={minExpFilter}
                  onChange={(e) => setMinExpFilter(Number(e.target.value))}
                  style={{ fontSize: 13, width: 130 }}
                >
                  <option value={0}>Any Experience</option>
                  <option value={1}>≥ 1 Year</option>
                  <option value={3}>≥ 3 Years</option>
                  <option value={5}>≥ 5 Years</option>
                  <option value={8}>≥ 8 Years</option>
                </select>

                <select
                  className="input"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  style={{ fontSize: 13, width: 160 }}
                >
                  <option value="matchScore_desc">Sort: Match % High→Low</option>
                  <option value="matchScore_asc">Sort: Match % Low→High</option>
                  <option value="exp_desc">Sort: Experience High→Low</option>
                  <option value="name_asc">Sort: Candidate Name A–Z</option>
                </select>
              </div>
            )}
          </div>

          {/* BULK ACTIONS TOOLBAR */}
          {activeTab === "results" && scoredItems.length > 0 && (
            <div style={{ background: "var(--bg)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button type="button" onClick={handleSelectAll} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13 }}>
                  {selectedCandidateIds.length > 0 && selectedCandidateIds.length === filteredCandidates.length ? (
                    <CheckSquare size={17} color="var(--brand)" />
                  ) : (
                    <Square size={17} color="var(--text-secondary)" />
                  )}
                  Select All ({selectedCandidateIds.length}/{filteredCandidates.length})
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="btn btn-secondary"
                  disabled={selectedCandidateIds.length === 0 || bulkActionLoading}
                  onClick={() => handleBulkStatusChange("Shortlisted")}
                >
                  <CheckCircle2 size={15} color="#10b981" /> Shortlist Selected
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={selectedCandidateIds.length === 0 || bulkActionLoading}
                  onClick={() => handleBulkStatusChange("Rejected")}
                  style={{ color: "var(--danger)" }}
                >
                  <XCircle size={15} /> Reject Selected
                </button>
                <button className="btn btn-secondary" onClick={handleExportCSV}>
                  <Download size={15} /> Export CSV
                </button>
                <button className="btn btn-primary" onClick={handleSendToTalentPool}>
                  <Users size={15} /> Send to Talent Ranking
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: RESULTS TABLE */}
          {activeTab === "results" && (
            <div>
              {filteredCandidates.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No scored candidates match criteria"
                  subtitle="Upload resumes above or clear search/score filters."
                />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "10px 8px", width: 40 }}></th>
                        <th style={{ padding: "10px 12px" }}>Candidate Name</th>
                        <th style={{ padding: "10px 12px" }}>Match %</th>
                        <th style={{ padding: "10px 12px" }}>Top Skills</th>
                        <th style={{ padding: "10px 12px" }}>Experience</th>
                        <th style={{ padding: "10px 12px" }}>Education</th>
                        <th style={{ padding: "10px 12px" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((cand) => {
                        const isSelected = selectedCandidateIds.includes(cand._id);
                        return (
                          <tr
                            key={cand._id}
                            style={{
                              borderBottom: "1px solid var(--border)",
                              background: isSelected ? "rgba(21,30,94,0.04)" : "transparent",
                            }}
                          >
                            <td style={{ padding: "12px 8px" }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleCandidate(cand._id)}
                                style={{ width: 16, height: 16, cursor: "pointer" }}
                              />
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ fontWeight: 700, fontSize: 14 }}>{cand.candidateName}</div>
                              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{cand.email}</div>
                            </td>
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: verdictColor(cand.verdict) }}>
                                  {cand.matchScore}%
                                </div>
                                <span className="badge" style={{ background: "var(--bg)", border: `1px solid ${verdictColor(cand.verdict)}`, color: verdictColor(cand.verdict), fontSize: 11 }}>
                                  {cand.verdict}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "12px", maxWidth: 240 }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {(cand.matchingSkills || []).slice(0, 4).map((s) => (
                                  <span key={s} className="badge" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", fontSize: 11 }}>
                                    {s}
                                  </span>
                                ))}
                                {(cand.skills || []).length > 4 && (
                                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                                    +{(cand.skills.length - 4)} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: "12px" }}>{cand.experience}</td>
                            <td style={{ padding: "12px", maxWidth: 200 }}>
                              {(cand.education || []).join(", ") || "Not specified"}
                            </td>
                            <td style={{ padding: "12px" }}>
                              <StatusBadge status={cand.status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NEEDS REVIEW / FAILURES TABLE */}
          {activeTab === "needs_review" && (
            <div>
              {failedItems.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="No parsing failures detected"
                  subtitle="All processed PDF resumes were parsed successfully."
                />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--text-secondary)" }}>
                        <th style={{ padding: "10px 12px" }}>File Name</th>
                        <th style={{ padding: "10px 12px" }}>Failure Category</th>
                        <th style={{ padding: "10px 12px" }}>Error Reason</th>
                        <th style={{ padding: "10px 12px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                              <FileText size={16} color="var(--danger)" />
                              {item.name}
                            </div>
                            <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                              {(item.size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span className="badge" style={{ background: "rgba(239,68,68,0.12)", color: "var(--danger)", fontWeight: 600 }}>
                              {item.category || "Parsing Failure"}
                            </span>
                          </td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{item.error}</td>
                          <td style={{ padding: "12px" }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: "4px 10px", fontSize: 12 }}
                              onClick={() => {
                                setFileQueue((prev) => prev.filter((i) => i.id !== item.id));
                                toast.success(`Removed ${item.name}`);
                              }}
                            >
                              <Trash2 size={13} /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
