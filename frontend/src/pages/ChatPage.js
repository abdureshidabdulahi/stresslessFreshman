import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  sendChatMessage,
  uploadChatFile,
  getChatSessions,
  getChatSession,
  deleteChatSession,
} from '../utils/api';
import './ChatPage.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const diff = Math.floor((today - d) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Parse [RECOMMENDATION] lines from AI text into card objects
function parseRecommendations(text) {
  const recs = [];
  const lines = text.split('\n');
  lines.forEach((line) => {
    const match = line.match(/\[RECOMMENDATION\]\s*(.+?)\s*\|\s*Type:\s*(.+?)\s*\|\s*(.+)/i);
    if (match) {
      recs.push({ title: match[1].trim(), type: match[2].trim(), desc: match[3].trim() });
    }
  });
  return recs;
}

// Remove [RECOMMENDATION] lines from display text
function stripRecommendations(text) {
  return text
    .split('\n')
    .filter((l) => !/^\[RECOMMENDATION\]/i.test(l.trim()))
    .join('\n')
    .trim();
}

// Very light markdown → spans (bold, inline code, emoji headers preserved)
function renderText(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bullet
    const bulletMatch = line.match(/^[\s]*[-*•]\s+(.+)/);
    if (bulletMatch) {
      return (
        <div key={i} className="chat-msg__bullet">
          <span className="chat-msg__bullet-dot">•</span>
          <span>{inlineFmt(bulletMatch[1])}</span>
        </div>
      );
    }
    // Numbered
    const numMatch = line.match(/^[\s]*(\d+)\.\s+(.+)/);
    if (numMatch) {
      return (
        <div key={i} className="chat-msg__bullet">
          <span className="chat-msg__bullet-dot">{numMatch[1]}.</span>
          <span>{inlineFmt(numMatch[2])}</span>
        </div>
      );
    }
    // Section header (emoji or ##)
    if (/^(📄|🔑|📝|❓|##)/.test(line.trim())) {
      return <p key={i} className="chat-msg__section-header">{line.trim().replace(/^#+\s*/, '')}</p>;
    }
    // Empty line → spacer
    if (!line.trim()) return <div key={i} className="chat-msg__spacer" />;
    // Normal paragraph
    return <p key={i}>{inlineFmt(line)}</p>;
  });
}

function inlineFmt(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={i} className="chat-msg__code">{p.slice(1, -1)}</code>;
    }
    return p;
  });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="chat-msg chat-msg--ai">
      <div className="chat-msg__avatar">🤖</div>
      <div className="chat-msg__bubble chat-msg__bubble--ai">
        <div className="chat-msg__typing">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

function RecommendationCards({ recs }) {
  const icons = { book: '📚', video: '🎬', website: '🌐', article: '📰', course: '🎓', tool: '🛠️' };
  return (
    <div className="chat-recs">
      <p className="chat-recs__label">📌 Recommended Resources</p>
      <div className="chat-recs__list">
        {recs.map((r, i) => (
          <div key={i} className="chat-rec-card">
            <span className="chat-rec-card__icon">{icons[r.type.toLowerCase()] || '🔗'}</span>
            <div className="chat-rec-card__body">
              <span className="chat-rec-card__title">{r.title}</span>
              <span className="chat-rec-card__type">{r.type}</span>
              <span className="chat-rec-card__desc">{r.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const displayContent = isUser ? msg.content : stripRecommendations(msg.content);
  const recs = !isUser ? parseRecommendations(msg.content) : [];

  // Strip subject prefix for display
  const cleanContent = displayContent.replace(/^\[Subject:[^\]]+\]\n\n/, '');

  return (
    <div className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--ai'}`}>
      {!isUser && <div className="chat-msg__avatar">🤖</div>}
      <div className={`chat-msg__bubble ${isUser ? 'chat-msg__bubble--user' : 'chat-msg__bubble--ai'}`}>
        {msg.fileInfo && (
          <div className="chat-msg__file-badge">
            <span>📎</span> {msg.fileInfo.name}
          </div>
        )}
        <div className="chat-msg__text">{isUser ? cleanContent : renderText(cleanContent)}</div>
        {msg.createdAt && (
          <span className="chat-msg__time">{formatTime(msg.createdAt)}</span>
        )}
      </div>
      {isUser && <div className="chat-msg__avatar chat-msg__avatar--user">👤</div>}
      {recs.length > 0 && !isUser && <RecommendationCards recs={recs} />}
    </div>
  );
}

// ── Session Sidebar Item ──────────────────────────────────────────────────────

function SessionItem({ session, isActive, onOpen, onDelete }) {
  return (
    <div
      className={`chat-sidebar__item ${isActive ? 'chat-sidebar__item--active' : ''}`}
      onClick={() => onOpen(session._id)}
    >
      <div className="chat-sidebar__item-body">
        <span className="chat-sidebar__item-title">{session.title || 'Untitled Chat'}</span>
        <span className="chat-sidebar__item-meta">
          {formatDate(session.updatedAt)} · {session.messageCount} msg{session.messageCount !== 1 ? 's' : ''}
        </span>
      </div>
      <button
        className="chat-sidebar__item-del"
        onClick={(e) => { e.stopPropagation(); onDelete(session._id); }}
        title="Delete session"
      >
        🗑
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const SUBJECT_OPTIONS = [
  'General', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
  'Computer Science', 'History', 'Literature', 'Economics',
  'Psychology', 'Engineering', 'Medicine', 'Law', 'Other',
];

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [subject, setSubject] = useState('General');
  const [file, setFile] = useState(null);
  const [filePrompt, setFilePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Load session list from backend ──
  const loadSessions = useCallback(async () => {
    setSessionsError(false);
    setSessionsLoading(true);
    try {
      const { data } = await getChatSessions();
      // data is an array of { _id, title, updatedAt, messageCount }
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
      setSessionsError(true);
      toast.error('Unable to load chat history. Please refresh or login again.');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Open a session: fetch full messages from backend ──
  const openSession = async (sessionId) => {
    if (activeSession?._id === sessionId) { setSidebarOpen(false); return; }
    setLoadingSession(true);
    setSidebarOpen(false);
    try {
      const { data } = await getChatSession(sessionId);
      // data is the full session: { _id, title, messages[], ... }
      setActiveSession({ _id: data._id, title: data.title });
      setMessages(data.messages || []);
      setFile(null);
      setInput('');
    } catch (err) {
      console.error('Failed to open session:', err);
      toast.error('Could not load that conversation.');
    } finally {
      setLoadingSession(false);
    }
  };

  const startNewChat = () => {
    setActiveSession(null);
    setMessages([]);
    setFile(null);
    setInput('');
    setSidebarOpen(false);
  };

  const handleDeleteSession = async (id) => {
    try {
      await deleteChatSession(id);
      setSessions((prev) => prev.filter((s) => s._id !== id));
      if (activeSession?._id === id) startNewChat();
      toast.success('Session deleted');
    } catch {
      toast.error('Could not delete session');
    }
  };

  // ── Send plain text message ──
  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const optimistic = {
      role: 'user',
      content: subject !== 'General' ? `[Subject: ${subject}]\n\n${trimmed}` : trimmed,
      createdAt: new Date().toISOString(),
      _id: `optimistic-${Date.now()}`,
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await sendChatMessage(
        trimmed,
        activeSession?._id || null,
        subject !== 'General' ? subject : null,
      );

      const aiMsg = {
        role: 'assistant',
        content: data.reply,
        createdAt: new Date().toISOString(),
        _id: `ai-${Date.now()}`,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (!activeSession) {
        // New session was created — refresh the sidebar list
        setActiveSession({ _id: data.sessionId, title: trimmed.slice(0, 60) });
        await loadSessions();
      } else {
        // Update updatedAt for the existing session in the sidebar
        setSessions((prev) =>
          prev.map((s) =>
            s._id === activeSession._id
              ? { ...s, updatedAt: new Date().toISOString(), messageCount: (s.messageCount || 0) + 2 }
              : s
          )
        );
      }
    } catch (err) {
      const errorText = err.response?.data?.error || err.response?.data?.message || 'Failed to send message';
      toast.error(errorText);
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
    } finally {
      setLoading(false);
    }
  };

  // ── Upload file ──
  const handleUpload = async () => {
    if (!file || loading) return;
    setLoading(true);

    const uploadMsg = {
      role: 'user',
      content: filePrompt || 'Please create study notes from this file.',
      fileInfo: { name: file.name },
      createdAt: new Date().toISOString(),
      _id: `optimistic-${Date.now()}`,
    };
    setMessages((prev) => [...prev, uploadMsg]);

    try {
      const { data } = await uploadChatFile(file, activeSession?._id || null, filePrompt);

      const aiMsg = {
        role: 'assistant',
        content: data.summary,
        createdAt: new Date().toISOString(),
        _id: `ai-${Date.now()}`,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setFile(null);
      setFilePrompt('');

      if (!activeSession) {
        setActiveSession({ _id: data.sessionId, title: `Notes: ${file.name.replace(/\.[^/.]+$/, '')}` });
        await loadSessions();
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s._id === activeSession._id
              ? { ...s, updatedAt: new Date().toISOString(), messageCount: (s.messageCount || 0) + 2 }
              : s
          )
        );
      }
    } catch (err) {
      const errorText = err.response?.data?.error || err.response?.data?.message || 'Failed to process file';
      toast.error(errorText);
      setMessages((prev) => prev.filter((m) => m._id !== uploadMsg._id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      file ? handleUpload() : handleSend();
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = '';
  };

  const isEmpty = messages.length === 0 && !loadingSession;

  return (
    <div className="chat-page">
      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div className="chat-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Session Sidebar ── */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar--open' : ''}`}>
        <div className="chat-sidebar__header">
          <h2 className="chat-sidebar__title">Chat History</h2>
          <button className="chat-sidebar__new-btn" onClick={startNewChat} title="New Chat">
            ✏️ New Chat
          </button>
        </div>

        <div className="chat-sidebar__list">
          {sessionsLoading ? (
            <p className="chat-sidebar__empty">Loading history…</p>
          ) : sessionsError ? (
            <div className="chat-sidebar__empty">
              <p>Unable to load chat history.</p>
              <button className="chat-sidebar__retry-btn" onClick={loadSessions}>
                🔄 Retry
              </button>
            </div>
          ) : sessions.length === 0 ? (
            <p className="chat-sidebar__empty">No previous chats yet.<br />Start a conversation!</p>
          ) : (
            sessions.map((s) => (
              <SessionItem
                key={s._id}
                session={s}
                isActive={activeSession?._id === s._id}
                onOpen={openSession}
                onDelete={handleDeleteSession}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <button className="chat-header__menu-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <div className="chat-header__info">
            <span className="chat-header__icon">🤖</span>
            <div>
              <h1 className="chat-header__title">
                {activeSession ? activeSession.title : 'AI Study Assistant'}
              </h1>
              <p className="chat-header__sub">Ask questions · Upload files · Get recommendations</p>
            </div>
          </div>
          <div className="chat-header__subject">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="chat-subject-select"
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Thread */}
        <div className="chat-thread">
          {/* Loading a session spinner */}
          {loadingSession && (
            <div className="chat-session-loading">
              <div className="chat-session-loading__spinner" />
              <p>Loading conversation…</p>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="chat-empty">
              <div className="chat-empty__icon">🎓</div>
              <h2 className="chat-empty__title">Your AI Study Assistant</h2>
              <p className="chat-empty__sub">Ask any academic question, upload a file for notes, or request study recommendations.</p>
              <div className="chat-empty__chips">
                {[
                  'Explain photosynthesis simply',
                  'What is Big O notation?',
                  'Summarize my notes for me',
                  'Recommend resources for calculus',
                ].map((q) => (
                  <button key={q} className="chat-empty__chip" onClick={() => { setInput(q); textareaRef.current?.focus(); }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages from backend */}
          {!loadingSession && messages.map((msg, i) => (
            <MessageBubble key={msg._id || i} msg={msg} />
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* File chip */}
        {file && (
          <div className="chat-file-chip">
            <span className="chat-file-chip__icon">📎</span>
            <span className="chat-file-chip__name">{file.name}</span>
            <input
              className="chat-file-chip__prompt"
              placeholder="Optional: tell the AI what to focus on…"
              value={filePrompt}
              onChange={(e) => setFilePrompt(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="chat-file-chip__remove" onClick={() => { setFile(null); setFilePrompt(''); }}>✕</button>
          </div>
        )}

        {/* Input bar */}
        <div className="chat-input-bar">
          <button
            className="chat-input-bar__attach"
            onClick={() => fileInputRef.current?.click()}
            title="Attach a file"
            disabled={loading}
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <textarea
            ref={textareaRef}
            className="chat-input-bar__textarea"
            placeholder={file ? 'Add a message alongside the file (optional)…' : 'Ask anything about your studies…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className={`chat-input-bar__send ${(input.trim() || file) && !loading ? 'chat-input-bar__send--active' : ''}`}
            onClick={file ? handleUpload : handleSend}
            disabled={(!input.trim() && !file) || loading}
          >
            {loading ? '…' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
