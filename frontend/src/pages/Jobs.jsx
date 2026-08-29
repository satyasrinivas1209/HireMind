import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Briefcase } from "lucide-react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import api from "../api/axios";
import Layout from "../components/Layout";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";

const emptyForm = { title: "", description: "", requiredSkills: "", isActive: true };

export default function Jobs() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/jobs");
      setJobs(data.jobs);
    } catch {
      toast.error("Could not load job postings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const openCreate = () => {
    setEditingJob(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (job) => {
    setEditingJob(job);
    setForm({
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills.join(", "),
      isActive: job.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Job title and description are required.");
      return;
    }

    setSaving(true);
    try {
      if (editingJob) {
        await api.put(`/jobs/${editingJob._id}`, form);
        toast.success("Job updated successfully.");
      } else {
        await api.post("/jobs", form);
        toast.success("Job created successfully.");
      }
      setModalOpen(false);
      loadJobs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save job.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/jobs/${deleteTarget._id}`);
      toast.success("Job deleted.");
      setDeleteTarget(null);
      loadJobs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not delete job.");
    }
  };

  return (
    <Layout title="Job Postings" subtitle="Manage active roles and candidate matching requirements">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Create Job
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <Skeleton height={90} />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job postings yet"
          subtitle={isAdmin ? "Create your first job posting to start matching candidates." : "Check back once an Admin has created job postings."}
          action={isAdmin && <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Create Job</button>}
        />
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {jobs.map((job) => (
            <div key={job._id} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{job.title}</h3>
                    <span
                      className="badge"
                      style={{
                        background: job.isActive ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
                        color: job.isActive ? "#10b981" : "#64748b",
                      }}
                    >
                      {job.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "var(--text-secondary)" }}>{job.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {job.requiredSkills.map((skill) => (
                      <span key={skill} className="badge" style={{ background: "var(--bg)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-secondary)" }}>
                    Created {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ display: "flex", gap: 8, height: "fit-content" }}>
                    <button className="btn btn-secondary" onClick={() => openEdit(job)}>
                      <Pencil size={15} />
                    </button>
                    <button className="btn btn-secondary" onClick={() => setDeleteTarget(job)} style={{ color: "var(--danger)" }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
          onClick={() => setModalOpen(false)}
        >
          <form
            className="card"
            style={{ padding: 24, maxWidth: 480, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSave}
          >
            <h3 style={{ margin: "0 0 18px" }}>{editingJob ? "Edit Job" : "Create Job"}</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Job Title</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Job Description</label>
                <textarea
                  className="input"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ resize: "vertical", fontFamily: "inherit" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Required Skills <span style={{ fontWeight: 400, color: "var(--text-secondary)" }}>(comma-separated)</span>
                </label>
                <input
                  className="input"
                  placeholder="Python, Pandas, NumPy, SQL, Machine Learning"
                  value={form.requiredSkills}
                  onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Active
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : editingJob ? "Save Changes" : "Create Job"}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this job posting?"
        message={`"${deleteTarget?.title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
