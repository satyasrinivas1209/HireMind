import { useEffect, useState, useCallback } from "react";
import { UserPlus, ShieldCheck, Loader2, CheckCircle2, XCircle, Trash2, Clock, Users as UsersIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Layout from "../components/Layout";
import Skeleton from "react-loading-skeleton";

const initialForm = { name: "", email: "", password: "", role: "HR" };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/users");
      setUsers(data.users || []);
    } catch (err) {
      console.warn("Could not fetch team accounts:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/auth/users", form);
      toast.success("Team account created with instant access.");
      setForm(initialForm);
      fetchUsers();
    } catch (err) {
      const message = err?.response?.data?.message || "Could not create account.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionId(userId);
    try {
      await api.patch(`/auth/users/${userId}/approve`);
      toast.success("User account approved successfully!");
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not approve account.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    setActionId(userId);
    try {
      await api.delete(`/auth/users/${userId}`);
      toast.success("Account removed.");
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not remove account.");
    } finally {
      setActionId(null);
    }
  };

  const pendingUsers = users.filter((u) => u.isApproved === false);
  const activeUsers = users.filter((u) => u.isApproved !== false);

  return (
    <Layout title="Team Accounts & Approvals" subtitle="Manage user registrations, approve requests, and provision team access">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, alignItems: "start" }}>
        
        {/* Left Column: Pending Requests & Active Users */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Pending Approval Requests */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyBetween: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Clock size={20} color="var(--warning, #f59e0b)" />
                <h3 style={{ margin: 0, fontSize: 16 }}>Pending Sign-up Requests ({pendingUsers.length})</h3>
              </div>
            </div>

            {loading ? (
              <Skeleton count={2} height={60} />
            ) : pendingUsers.length === 0 ? (
              <div style={{ fontSize: 13.5, color: "var(--text-secondary)", padding: "16px 0", textAlign: "center" }}>
                No pending sign-up requests at this time.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      background: "rgba(245, 158, 11, 0.08)",
                      borderRadius: 10,
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                      <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{user.email}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "6px 12px", fontSize: 12.5 }}
                        disabled={actionId === user.id}
                        onClick={() => handleApprove(user.id)}
                      >
                        {actionId === user.id ? <Loader2 size={14} className="spin" /> : <><CheckCircle2 size={14} /> Approve</>}
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: 12.5, color: "var(--danger)" }}
                        disabled={actionId === user.id}
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Team Accounts Table */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <UsersIcon size={20} color="var(--brand)" />
              <h3 style={{ margin: 0, fontSize: 16 }}>Active Team Members ({activeUsers.length})</h3>
            </div>

            {loading ? (
              <Skeleton count={3} height={40} />
            ) : (
              <div className="scroll-x">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <th style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>User</th>
                      <th style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>Role</th>
                      <th style={{ padding: "8px 12px", color: "var(--text-secondary)" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{u.email}</div>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 12,
                              background: u.role === "Admin" ? "rgba(59, 130, 246, 0.15)" : "rgba(16, 185, 129, 0.15)",
                              color: u.role === "Admin" ? "#3b82f6" : "#10b981",
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: 12, color: "var(--danger)" }}
                            disabled={actionId === u.id}
                            onClick={() => handleDelete(u.id, u.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Direct Provision Form */}
        <div>
          <form className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <ShieldCheck size={20} color="var(--brand)" />
              <h3 style={{ margin: 0, fontSize: 16 }}>Directly Provision Account</h3>
            </div>

            <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-secondary)" }}>
              Admin-provisioned accounts receive instant access without requiring approval.
            </p>

            <div>
              <label htmlFor="account-name" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Full name</label>
              <input id="account-name" className="input" value={form.name} onChange={(event) => update("name", event.target.value)} required minLength={2} maxLength={100} />
            </div>
            <div>
              <label htmlFor="account-email" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Email</label>
              <input id="account-email" type="email" className="input" value={form.email} onChange={(event) => update("email", event.target.value)} required maxLength={254} />
            </div>
            <div>
              <label htmlFor="account-password" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Temporary password</label>
              <input id="account-password" type="password" className="input" value={form.password} onChange={(event) => update("password", event.target.value)} required minLength={8} maxLength={128} />
            </div>
            <div>
              <label htmlFor="account-role" style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 6 }}>Role</label>
              <select id="account-role" className="input" value={form.role} onChange={(event) => update("role", event.target.value)}>
                <option value="HR">HR</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {error && <div style={{ fontSize: 13, color: "var(--danger)", background: "rgba(239,68,68,0.1)", padding: "8px 12px", borderRadius: 8 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><Loader2 size={16} className="spin" /> Creating account</> : <><UserPlus size={16} /> Provision account</>}
            </button>
          </form>
        </div>

      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
