import { useState } from "react";
import { UserPlus, ShieldCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Layout from "../components/Layout";

const initialForm = { name: "", email: "", password: "", role: "HR" };

export default function Users() {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/auth/users", form);
      toast.success("Team account created.");
      setForm(initialForm);
    } catch (err) {
      const message = err?.response?.data?.message || "Could not create account.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Team Accounts" subtitle="Provision secure access for HireMind administrators and HR staff">
      <div style={{ maxWidth: 560 }}>
        <form className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }} onSubmit={handleSubmit}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <ShieldCheck size={20} color="var(--brand)" />
            <h3 style={{ margin: 0, fontSize: 16 }}>Create team account</h3>
          </div>

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
            {saving ? <><Loader2 size={16} className="spin" /> Creating account</> : <><UserPlus size={16} /> Create account</>}
          </button>
        </form>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </Layout>
  );
}
