import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import api from "../api/axios";

const INITIAL_MESSAGE = {
  role: "assistant",
  text: "Hello! Ask me about HR policies, leave, salary, or notice periods.",
};

export default function HRChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setSending(true);

    try {
      const { data } = await api.post("/hr/chatbot", { message: text });
      setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Sorry, the HR assistant is temporarily unavailable. Please try again shortly." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open HR Assistant"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--brand)",
          color: "#fff",
          border: "none",
          boxShadow: "0 8px 20px rgba(21,30,94,0.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 60,
        }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: "fixed",
            bottom: 92,
            right: 24,
            width: "min(340px, calc(100vw - 32px))",
            height: 440,
            display: "flex",
            flexDirection: "column",
            zIndex: 60,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--brand)",
              color: "#fff",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>HireMind HR Assistant</div>
            <div style={{ fontSize: 11.5, opacity: 0.85 }}>Leave · Salary · Notice periods</div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? "var(--brand)" : "var(--bg)",
                  color: m.role === "user" ? "#fff" : "var(--text-primary)",
                  padding: "8px 12px",
                  borderRadius: 12,
                  fontSize: 13.5,
                  maxWidth: "85%",
                  lineHeight: 1.4,
                }}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: "flex-start", fontSize: 12.5, color: "var(--text-secondary)" }}>
                HireMind Assistant is typing…
              </div>
            )}
          </div>

          <div style={{ padding: 10, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Ask about leave, salary…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="btn btn-primary" onClick={sendMessage} disabled={sending} style={{ padding: "10px 14px" }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
