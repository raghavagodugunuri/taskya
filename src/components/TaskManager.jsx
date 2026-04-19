import { useState, useEffect, useReducer, useRef } from "react";

/* ───────────────────────── state ───────────────────────── */

function taskReducer(state, action) {
  switch (action.type) {
    case "ADD_TASK":
      return [...state, { ...action.payload, id: Date.now() }];
    case "TOGGLE_STATUS":
      return state.map(t =>
        t.id === action.id
          ? {
              ...t,
              status: t.status === "completed" ? "pending" : "completed",
              delayed: t.status === "missed" ? true : (t.status === "completed" ? t.delayed : false),
              completedAt: t.status !== "completed" ? new Date().toISOString() : null,
            }
          : t
      );
    case "DELETE_TASK":
      return state.filter(t => t.id !== action.id);
    case "AUTO_MISS":
      return state.map(t => {
        if (t.status === "pending" && t.dueDate) {
          const now = new Date();
          const dueStr = t.dueDate + (t.dueTime ? "T" + t.dueTime : "T23:59");
          const due = new Date(dueStr);
          if (now > due) return { ...t, status: "missed" };
        }
        return t;
      });
    case "UPDATE_DUE":
      return state.map(t =>
        t.id === action.id
          ? { ...t, dueDate: action.dueDate, dueTime: action.dueTime, status: "pending", rescheduled: true }
          : t
      );
    default:
      return state;
  }
}

const defaultGroups = [];


/* ───────────────────────── icons ───────────────────────── */

const I = {
  dashboard: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/></svg>,
  dashboardFill: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/></svg>,
  tasks: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  tasksFill: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11l1.4 1.4L9 10.6l-3-3L4.6 9l4.4 4.4 8-8L21 1v11z"/></svg>,
  groups: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  groupsFill: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2h16zM9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87 4 4 0 010-7.75"/></svg>,
  rewards: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  rewardsFill: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  plus: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  fire: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1012 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"/></svg>,
  star: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  quote: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" opacity="0.12"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.689 11 13.185 11 15a3 3 0 11-6 0c0-.258.026-.51.076-.753zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.689 21 13.185 21 15a3 3 0 11-6 0c0-.258.026-.51.076-.753z"/></svg>,
  empty: <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.18"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 12l2 2 4-4"/></svg>,
  userPlus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
};

/* ───────────────────────── main ───────────────────────── */

/* ═══════════════════════ LOGIN ═══════════════════════ */

function LoginPage({ onLogin, users, setUsers }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const trimmed = email.trim().toLowerCase();
  const isSignUp = mode === "signup";

  const handleLogin = () => {
    setError("");
    if (!trimmed) { setError("Please enter your username"); return; }
    if (!/^[a-z][a-z0-9._]*$/.test(trimmed)) { setError("Username: lowercase letters, numbers, dots or underscores only"); return; }

    if (!password) { setError("Please enter your password"); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters"); return; }

    if (isSignUp) {
      if (!confirmPass) { setError("Please confirm your password"); return; }
      if (password !== confirmPass) { setError("Passwords do not match"); return; }
    }

    setLoading(true);
    setTimeout(() => {
      if (isSignUp) {
        if (users[trimmed]) { setError(`"${trimmed}" is already registered. Please sign in.`); setLoading(false); return; }
        setUsers(prev => ({ ...prev, [trimmed]: password }));
        setLoading(false);
        onLogin(trimmed);
      } else {
        if (!users[trimmed]) { setError(`"${trimmed}" is not registered. Please sign up first.`); setLoading(false); return; }
        if (users[trimmed] !== password) { setError("Incorrect password"); setLoading(false); return; }
        setLoading(false);
        onLogin(trimmed);
      }
    }, 400);
  };

  const setSignin = () => { setMode("signin"); setError(""); setPassword(""); setConfirmPass(""); };
  const setSignup = () => { setMode("signup"); setError(""); setPassword(""); setConfirmPass(""); };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  const fld = {
    width: "100%", padding: "13px 16px", border: "1.5px solid var(--border)",
    borderRadius: 12, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
    background: "var(--bg-card)", color: "var(--text)", outline: "none",
    transition: "border-color 0.2s ease",
  };

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "var(--bg)", color: "var(--text)",
      width: "100%", maxWidth: 480, minHeight: "100vh",
      margin: "0 auto", display: "flex", flexDirection: "column",
      justifyContent: "center", padding: "40px 20px",
      opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        :root {
          --bg:#FAF8F5;--bg-card:#FFFFFF;--bg-dark:#1C1917;--text:#1C1917;--text2:#78716C;
          --text-inv:#FAF8F5;--accent:#D97706;--accent-lt:#FEF3C7;--border:#E7E1DA;
          --green:#16A34A;--red:#DC2626;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes floatUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* logo */}
      <div style={{ textAlign: "center", marginBottom: 40, animation: "floatUp 0.6s ease both" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 20, background: "var(--bg-dark)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", boxShadow: "0 8px 32px rgba(28,25,23,0.12)",
        }}>
          <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: "var(--accent)" }}>T</span>
        </div>
        <h1 style={{
          fontFamily: "'Instrument Serif', serif", fontSize: 32, fontWeight: 400,
          letterSpacing: "-0.02em",
        }}>
          Taskflow<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <p style={{ fontSize: 13, color: "var(--text2)", marginTop: 6 }}>
          {isSignUp ? "Create a new account" : "Sign in to your account"}
        </p>
      </div>

      {/* form */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "floatUp 0.6s ease 0.15s both" }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Username
          </label>
          <input
            value={email} onChange={e => { setEmail(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "")); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder="johndoe"
            autoCapitalize="none" autoCorrect="off"
            style={{...fld, textTransform: "lowercase"}}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--border)"}
          />
        </div>

        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder={isSignUp ? "Create a password" : "Enter your password"}
              style={{...fld, paddingRight: 48}}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <button onClick={() => setShowPass(p => !p)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", padding: 4,
              color: "var(--text2)", fontSize: 12,
            }}>
              {showPass ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        {isSignUp && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="Re-enter your password"
              style={fld}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
        )}

        {error && (
          <div style={{
            fontSize: 12, color: "var(--red)", fontWeight: 500,
            padding: "8px 12px", background: "#FEE2E2", borderRadius: 8,
          }}>{error}</div>
        )}

        <button onClick={handleLogin} disabled={loading} style={{
          padding: "14px", background: loading ? "var(--text2)" : "var(--bg-dark)", color: "var(--text-inv)",
          border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", width: "100%",
          marginTop: 4, transition: "opacity 0.15s ease",
          boxShadow: "0 4px 16px rgba(28,25,23,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
        onMouseEnter={e => { if (!loading) e.target.style.opacity = "0.88"; }}
        onMouseLeave={e => e.target.style.opacity = "1"}
        >
          {loading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: "spin 0.8s linear infinite" }}>
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
            </svg>
          )}
          {loading ? "Please wait..." : (isSignUp ? "Create Account" : "Sign In")}
        </button>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        <p style={{ fontSize: 12, color: "var(--text2)", textAlign: "center", marginTop: 4 }}>
          {isSignUp ? (
            <>Already have an account? <span onClick={setSignin} style={{ color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}>Sign in</span></>
          ) : (
            <>Don't have an account? <span onClick={setSignup} style={{ color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}>Sign up</span></>
          )}
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── main ───────────────────────── */

export default function TaskManager() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [groups, setGroups] = useState(defaultGroups);
  const [invitations, setInvitations] = useState([]);
  const [users, setUsers] = useState({});
  const [allTasks, setAllTasks] = useState([]);

  const handleLogin = (name) => {
    setGroups(prev => {
      const hasGroup = prev.some(g => g.members.includes(name));
      if (!hasGroup) {
        return [...prev, { id: Date.now(), name: "General", color: "#D97706", members: [name], createdBy: name, isDefault: true }];
      }
      return prev;
    });
    setUserName(name);
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return <LoginPage users={users} setUsers={setUsers} onLogin={handleLogin} />;
  }

  return <AppShell userName={userName} onLogout={() => { setLoggedIn(false); setUserName(""); }}
    groups={groups} setGroups={setGroups} invitations={invitations} setInvitations={setInvitations} users={users}
    allTasks={allTasks} setAllTasks={setAllTasks} />;
}

function AppShell({ userName, onLogout, groups, setGroups, invitations, setInvitations, users, allTasks, setAllTasks }) {
  const [page, setPage] = useState("dashboard");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Only show tasks where the current user is a member of the task's group
  const myGroups = groups.filter(g => g.members.includes(userName));
  const userGroupIds = new Set(myGroups.map(g => g.id));
  const userGroupNames = new Set(myGroups.map(g => g.name));
  const tasks = allTasks.filter(t => {
    if (t.groupId !== undefined && t.groupId !== null) return userGroupIds.has(t.groupId);
    return userGroupNames.has(t.group);
  });

  const dispatch = (action) => {
    setAllTasks(prev => {
      const nowTs = Date.now();
      switch (action.type) {
        case "ADD_TASK": {
          const payload = action.payload || action.task;
          return [...prev, {
            ...payload, id: nowTs, status: "pending", createdBy: userName,
            createdAt: nowTs,
            activity: [{ type: "created", by: userName, at: nowTs }],
          }];
        }
        case "TOGGLE_STATUS": {
          return prev.map(t => {
            if (t.id !== action.id) return t;
            const activity = t.activity || [];
            if (t.status === "completed") {
              return { ...t, status: "pending", completedAt: null,
                activity: [...activity, { type: "reopened", by: userName, at: nowTs }] };
            }
            const wasPreviouslyMissed = t.status === "missed";
            return { ...t, status: "completed", completedAt: nowTs, delayed: wasPreviouslyMissed || t.delayed,
              activity: [...activity, { type: "completed", by: userName, at: nowTs }] };
          });
        }
        case "DELETE_TASK":
          return prev.filter(t => t.id !== action.id);
        case "AUTO_MISS": {
          return prev.map(t => {
            if (t.status !== "pending" || !t.dueDate) return t;
            const dueStr = t.dueDate + (t.dueTime ? "T" + t.dueTime : "T23:59");
            const due = new Date(dueStr).getTime();
            if (due < nowTs) {
              const activity = t.activity || [];
              return { ...t, status: "missed",
                activity: [...activity, { type: "missed", by: "system", at: nowTs }] };
            }
            return t;
          });
        }
        case "UPDATE_DUE":
          return prev.map(t => {
            if (t.id !== action.id) return t;
            const activity = t.activity || [];
            return {
              ...t, dueDate: action.dueDate, dueTime: action.dueTime,
              status: "pending", rescheduled: true, delayed: true,
              activity: [...activity, { type: "rescheduled", by: userName, at: nowTs, dueDate: action.dueDate, dueTime: action.dueTime }],
            };
          });
        default:
          return prev;
      }
    });
  };

  // Auto-mark overdue pending tasks as missed
  useEffect(() => {
    dispatch({ type: "AUTO_MISS" });
    const iv = setInterval(() => dispatch({ type: "AUTO_MISS" }), 5000);
    return () => clearInterval(iv);
    // eslint-disable-next-line
  }, []);

  const navItems = [
    { id: "dashboard", label: "Home", icon: I.dashboard, iconActive: I.dashboardFill },
    { id: "tasks", label: "Tasks", icon: I.tasks, iconActive: I.tasksFill },
    { id: "groups", label: "Groups", icon: I.groups, iconActive: I.groupsFill },
  ];

  return (
    <div className="app-shell" style={{
      fontFamily: "'DM Sans', sans-serif",
      background: "var(--bg)",
      color: "var(--text)",
      width: "100%", maxWidth: "var(--app-max, 480px)", minHeight: "100vh",
      margin: "0 auto", position: "relative",
      opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease",
      overflowX: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        :root {
          --bg:#FAF8F5;--bg-card:#FFFFFF;--bg-dark:#1C1917;--text:#1C1917;--text2:#78716C;
          --text-inv:#FAF8F5;--accent:#D97706;--accent-lt:#FEF3C7;--border:#E7E1DA;
          --green:#16A34A;--green-lt:#DCFCE7;--red:#DC2626;--red-lt:#FEE2E2;
          --blue:#2563EB;--blue-lt:#DBEAFE;--purple:#7C3AED;
          --sh:0 1px 3px rgba(28,25,23,0.04);--shm:0 4px 16px rgba(28,25,23,0.06);
          --r:14px;--rs:10px;
          --page-px:14px;
          --font-title:24px;
          --font-card:13px;
          --card-pad:12px;
          --gap:8px;
          --app-max:480px;
        }
        @media(min-width:360px){:root{
          --page-px:16px;--r:14px;--rs:10px;--font-title:26px;--font-card:13px;--card-pad:13px;--gap:10px;
        }}
        @media(min-width:390px){:root{
          --page-px:18px;--r:16px;--rs:12px;--font-title:28px;--font-card:14px;--card-pad:14px;--gap:10px;
        }}
        @media(min-width:430px){:root{
          --page-px:22px;--font-title:28px;--card-pad:16px;--gap:12px;
        }}
        @media(min-width:480px){:root{
          --page-px:28px;--app-max:520px;
        }}
        @media(min-width:768px){:root{
          --page-px:32px;--app-max:600px;--font-title:32px;--card-pad:18px;
        }}
        @media(min-width:1024px){:root{
          --app-max:640px;
        }}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{display:none;}
        html,body{overflow-x:hidden;-webkit-text-size-adjust:100%;}
        body{background:var(--bg);min-height:100vh;}
        @media(min-width:768px){
          body{
            background:linear-gradient(135deg, #f5f0e8 0%, #ede4d3 100%);
          }
        }
        @keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes si{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
        @keyframes fq{0%{opacity:0;transform:translateY(6px)}6%{opacity:1;transform:translateY(0)}90%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-6px)}}
        @keyframes tabFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu 0.4s ease both}
        .si{animation:si 0.3s ease both}
        .tab-content{animation:tabFade 0.25s ease both}
        input[type="date"],input[type="time"]{
          position:relative;cursor:pointer;color-scheme:light;
          min-height:44px;
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator{
          position:absolute;top:0;left:0;right:0;bottom:0;
          width:100%;height:100%;opacity:0;cursor:pointer;
        }
        select{cursor:pointer;min-height:44px;}
        input,textarea{min-height:44px;font-size:16px !important;}
        button{-webkit-tap-highlight-color:transparent;}
        @media(min-width:768px){
          .app-shell{
            box-shadow: 0 20px 60px rgba(28,25,23,0.12), 0 8px 24px rgba(28,25,23,0.06);
            border-radius: 0;
          }
        }
        /* FAB positions relative to app-shell container width, not viewport */
        .fab-group{
          right: max(calc((100vw - 480px) / 2 + 18px), 18px);
        }
        @media(min-width:480px){.fab-group{right: max(calc((100vw - 520px) / 2 + 18px), 18px);}}
        @media(min-width:768px){.fab-group{right: max(calc((100vw - 600px) / 2 + 18px), 18px);}}
        @media(min-width:1024px){.fab-group{right: max(calc((100vw - 640px) / 2 + 18px), 18px);}}
      `}</style>

      <div style={{ paddingBottom: 90, minHeight: "100vh" }}>
        {page === "dashboard" && <Dashboard tasks={tasks} groups={groups.filter(g => g.members.includes(userName))} userName={userName} onLogout={onLogout} setPage={setPage} />}
        {page === "tasks" && <Tasks tasks={tasks} dispatch={dispatch} groups={groups.filter(g => g.members.includes(userName))} onLogout={onLogout} userName={userName} />}
        {page === "groups" && <GroupsPage groups={groups} setGroups={setGroups} tasks={tasks} onLogout={onLogout} userName={userName} invitations={invitations} setInvitations={setInvitations} users={users} />}
        {/* Rewards hidden for now */}
        {/* {page === "rewards" && <Rewards tasks={tasks} onLogout={onLogout} />} */}
      </div>

      {/* ── bottom tab bar ── */}
      <nav style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "var(--app-max, 480px)",
        background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-around", alignItems: "center",
        padding: "8px 0 calc(10px + env(safe-area-inset-bottom, 0px))", zIndex: 100,
      }}>
        {navItems.map((n) => {
          const active = page === n.id;
          const pendingInvites = n.id === "groups" ? invitations.filter(inv => inv.to === userName && inv.status === "pending").length : 0;
          return (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
              padding: "6px 16px", color: active ? "var(--accent)" : "var(--text2)",
              transition: "color 0.2s ease", WebkitTapHighlightColor: "transparent",
              position: "relative",
            }}>
              <div style={{ transition: "transform 0.2s ease", transform: active ? "scale(1.12)" : "scale(1)", position: "relative" }}>
                {active ? n.iconActive : n.icon}
                {pendingInvites > 0 && (
                  <div style={{
                    position: "absolute", top: -4, right: -6,
                    width: 14, height: 14, borderRadius: "50%",
                    background: "var(--red)", color: "white", fontSize: 8, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{pendingInvites}</div>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: "0.02em" }}>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ═══════════════════════ DASHBOARD ═══════════════════════ */

function Dashboard({ tasks, groups, userName, onLogout, setPage }) {
  const completed = tasks.filter(t => t.status === "completed").length;
  const pending = tasks.filter(t => t.status === "pending").length;
  const missed = tasks.filter(t => t.status === "missed").length;
  const total = tasks.length;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  // carousel tasks sorted same as Tasks view: missed > pending, high > med > low, daily > weekly > monthly > quarterly, due asc
  const statusOrder = { missed: 0, pending: 1, completed: 2 };
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const timeOrder = { daily: 0, weekly: 1, monthly: 2, quarterly: 3 };

  const upcomingTasks = tasks
    .filter(t => t.status === "pending" || t.status === "missed")
    .sort((a, b) => {
      const s = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      if (s !== 0) return s;
      const p = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
      if (p !== 0) return p;
      const t2 = (timeOrder[a.time] ?? 4) - (timeOrder[b.time] ?? 4);
      if (t2 !== 0) return t2;
      if (a.dueDate && b.dueDate) {
        const d = a.dueDate.localeCompare(b.dueDate);
        if (d !== 0) return d;
        const at = a.dueTime || "23:59";
        const bt = b.dueTime || "23:59";
        const tc = at.localeCompare(bt);
        if (tc !== 0) return tc;
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return (a.id || 0) - (b.id || 0);
    });

  const [ti, setTi] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const swipeThreshold = 50;

  useEffect(() => {
    if (upcomingTasks.length <= 1) return;
    const iv = setInterval(() => setTi(p => (p + 1) % upcomingTasks.length), 10000);
    return () => clearInterval(iv);
  }, [upcomingTasks.length]);

  const handleSwipe = () => {
    if (upcomingTasks.length <= 1) return;
    if (touchStart === null || touchEnd === null) return;
    const diff = touchStart - touchEnd;
    if (diff > swipeThreshold) {
      // swipe left → next
      setTi(p => (p + 1) % upcomingTasks.length);
    } else if (diff < -swipeThreshold) {
      // swipe right → previous
      setTi(p => (p - 1 + upcomingTasks.length) % upcomingTasks.length);
    }
  };

  const currentTask = upcomingTasks[ti % Math.max(upcomingTasks.length, 1)];

  const fmtDate = (d) => {
    if (!d) return "";
    return new Date(d + "T00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };
  const fmtTime12 = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":"); const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
  };

  const stats = [
    { label: "Total", value: total, color: "var(--blue)", bg: "var(--blue-lt)" },
    { label: "Done", value: completed, color: "var(--green)", bg: "var(--green-lt)" },
    { label: "Pending", value: pending, color: "var(--accent)", bg: "var(--accent-lt)" },
    { label: "Missed", value: missed, color: "var(--red)", bg: "var(--red-lt)" },
  ];

  return (
    <div style={{ padding: "20px var(--page-px, 18px)" }}>
      {/* header */}
      <div className="fu" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 2, letterSpacing: "0.04em" }}>WELCOME BACK</p>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "var(--font-title, 28px)", fontWeight: 400, letterSpacing: "-0.02em" }}>
            Hi, {userName}<span style={{ color: "var(--accent)" }}>.</span>
          </h2>
        </div>
        <LogoutBtn onLogout={onLogout} />
      </div>

      {/* upcoming due task spotlight */}
      <div className="fu" style={{
        background: "var(--bg-dark)", borderRadius: "var(--r)", padding: "18px 20px",
        marginBottom: 18, position: "relative", overflow: "hidden", animationDelay: "0.04s",
        minHeight: 88, touchAction: upcomingTasks.length > 1 ? "pan-y" : "auto",
        cursor: upcomingTasks.length > 1 ? "grab" : "default",
      }}
      onTouchStart={e => setTouchStart(e.targetTouches[0].clientX)}
      onTouchMove={e => setTouchEnd(e.targetTouches[0].clientX)}
      onTouchEnd={handleSwipe}
      onMouseDown={e => { setTouchStart(e.clientX); setTouchEnd(null); }}
      onMouseMove={e => { if (touchStart !== null) setTouchEnd(e.clientX); }}
      onMouseUp={handleSwipe}
      onMouseLeave={() => { setTouchStart(null); setTouchEnd(null); }}
      >
        {upcomingTasks.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "var(--accent)", flexShrink: 0 }}>{I.check}</div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-inv)", marginBottom: 2 }}>All clear!</p>
              <p style={{ fontSize: 12, color: "rgba(250,248,245,0.5)" }}>No upcoming tasks due</p>
            </div>
          </div>
        ) : (
          <>
            {/* counter */}
            <div style={{ position: "absolute", top: 14, right: 16, fontSize: 10, color: "rgba(250,248,245,0.3)", fontWeight: 600 }}>
              {(ti % upcomingTasks.length) + 1}/{upcomingTasks.length}
            </div>
            <div key={ti} style={{ animation: upcomingTasks.length > 1 ? "fq 10s ease both" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{
                  padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                  background: currentTask?.status === "missed" ? "rgba(220,38,38,0.25)" : "rgba(217,119,6,0.2)",
                  color: currentTask?.status === "missed" ? "#FCA5A5" : "var(--accent)",
                }}>{currentTask?.status === "missed" ? "Overdue" : "Upcoming"}</span>
                <span style={{
                  padding: "2px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                  textTransform: "uppercase", background: "rgba(250,248,245,0.08)", color: "rgba(250,248,245,0.5)",
                }}>{currentTask?.priority}</span>
              </div>
              <p style={{
                fontSize: 15, fontWeight: 600, color: "var(--text-inv)",
                lineHeight: 1.4, marginBottom: 6,
              }}>{currentTask?.title}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "rgba(250,248,245,0.45)" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{fmtDate(currentTask?.dueDate)}</span>
                {currentTask?.dueTime && (
                  <>
                    <span>·</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>{fmtTime12(currentTask?.dueTime)}</span>
                  </>
                )}
                <span>·</span>
                <span>{currentTask?.group}</span>
              </div>
            </div>
            {/* progress dots */}
            {upcomingTasks.length > 1 && (
              <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                {upcomingTasks.map((_, i) => (
                  <div key={i} style={{
                    width: i === (ti % upcomingTasks.length) ? 16 : 4, height: 4, borderRadius: 100,
                    background: i === (ti % upcomingTasks.length) ? "var(--accent)" : "rgba(250,248,245,0.15)",
                    transition: "all 0.3s ease",
                  }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap, 10px)", marginBottom: 18 }}>
        {stats.map((s, i) => (
          <div key={i} className="fu" onClick={() => setPage && setPage("tasks")} style={{
            background: "var(--bg-card)", borderRadius: "var(--r)", padding: "var(--card-pad, 14px)",
            border: "1px solid var(--border)", boxShadow: "var(--sh)",
            animationDelay: `${0.06 + i * 0.04}s`,
            cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease",
            WebkitTapHighlightColor: "transparent",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shm)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--sh)"; }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: s.bg, color: s.color,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8,
            }}>{I.check}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* groups overview */}
      <div className="fu" style={{ animationDelay: "0.3s" }}>
        <SectionHeader title="Groups" />
        {groups.length === 0 ? (
          <EmptyMsg msg="No groups yet" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {groups.map(g => {
              const gt = tasks.filter(t => t.group === g.name);
              const gd = gt.filter(t => t.status === "completed").length;
              const pct = gt.length ? Math.round((gd / gt.length) * 100) : 0;
              return (
                <div key={g.id} onClick={() => setPage && setPage("groups")} style={{
                  background: "var(--bg-card)", borderRadius: "var(--rs)", padding: "12px 14px",
                  border: "1px solid var(--border)", borderLeft: `3px solid ${g.color}`,
                  cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  WebkitTapHighlightColor: "transparent",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateX(2px)"; e.currentTarget.style.boxShadow = "var(--sh)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateX(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      flex: 1, minWidth: 0,
                    }}>{g.name}</span>
                    <span style={{ fontSize: 10, color: "var(--text2)", flexShrink: 0 }}>{gd}/{gt.length}</span>
                  </div>
                  <div style={{ background: "var(--border)", borderRadius: 100, height: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 100, background: g.color, width: `${pct}%`, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════ TASKS ═══════════════════════ */

function Tasks({ tasks, dispatch, groups, onLogout, userName }) {
  const [tab, setTab] = useState("view");
  const [timeFilter, setTimeFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [activeTask, setActiveTask] = useState(null); // task for activity sheet

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const tabs = [
    { id: "view", label: "View" },
    { id: "add", label: "Add" },
    { id: "missed", label: "Missed" },
  ];
  const timeFilters = ["all", "daily", "weekly", "monthly", "quarterly"];

  const missedCount = tasks.filter(t => t.status === "missed").length;

  const statusOrder = { missed: 0, pending: 1, completed: 2 };
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const timeOrder = { daily: 0, weekly: 1, monthly: 2, quarterly: 3 };

  const multiSort = (a, b) => {
    const s = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    if (s !== 0) return s;
    const p = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
    if (p !== 0) return p;
    const t = (timeOrder[a.time] ?? 4) - (timeOrder[b.time] ?? 4);
    if (t !== 0) return t;
    // older due date first (ascending)
    if (a.dueDate && b.dueDate) {
      const d = a.dueDate.localeCompare(b.dueDate);
      if (d !== 0) return d;
      // same due date, compare due time ascending
      const at = a.dueTime || "23:59";
      const bt = b.dueTime || "23:59";
      const tc = at.localeCompare(bt);
      if (tc !== 0) return tc;
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    // final tiebreaker: creation order ascending
    return (a.id || 0) - (b.id || 0);
  };

  const getFiltered = () => {
    let base = tasks;
    if (tab === "missed") base = tasks.filter(t => t.status === "missed");
    if (timeFilter !== "all") base = base.filter(t => t.time === timeFilter);
    if (hideCompleted && tab !== "missed") base = base.filter(t => t.status !== "completed");
    return [...base].sort(multiSort);
  };

  const filtered = getFiltered();

  const emptyMsg = tab === "missed"
    ? (timeFilter !== "all" ? `No missed ${timeFilter} tasks` : "No missed tasks — great job!")
    : (timeFilter !== "all" ? `No ${timeFilter} tasks yet.` : "No tasks yet. Tap Add to create one!");

  return (
    <div style={{ padding: "20px var(--page-px, 18px)" }}>
      <div className="fu" style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "var(--font-title, 28px)", fontWeight: 400, letterSpacing: "-0.02em" }}>
          Tasks<span style={{ color: "var(--accent)" }}>.</span>
        </h2>
        <LogoutBtn onLogout={onLogout} />
      </div>

      {/* view / add / missed tabs */}
      <div className="fu" style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, marginBottom: 14,
        background: "#F0ECE6", borderRadius: "var(--rs)", padding: 3, animationDelay: "0.04s",
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "10px 0", border: "none", borderRadius: 10,
            background: tab === t.id ? "var(--bg-card)" : "transparent",
            color: tab === t.id ? "var(--text)" : "var(--text2)",
            fontSize: 13, fontWeight: tab === t.id ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.2s ease", position: "relative",
            boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            {t.label}
            {t.id === "missed" && missedCount > 0 && (
              <span style={{
                minWidth: 16, height: 16, borderRadius: 100, padding: "0 5px",
                background: "var(--red)", color: "white", fontSize: 9, fontWeight: 700,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>{missedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* time filter pills — shown on all tabs */}
      <div className="fu" style={{
        display: "flex", gap: 6, marginBottom: 14, overflowX: "auto",
        WebkitOverflowScrolling: "touch", paddingBottom: 2, animationDelay: "0.08s",
      }}>
        {timeFilters.map(f => {
          const active = timeFilter === f;
          const label = tab === "add" && f === "all" ? "Anytime" : f;
          return (
            <button key={f} onClick={() => setTimeFilter(f)} style={{
              padding: "6px 14px", border: "1.5px solid",
              borderColor: active ? "var(--accent)" : "var(--border)",
              borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", whiteSpace: "nowrap",
              background: active ? "var(--accent-lt)" : "var(--bg-card)",
              color: active ? "var(--accent)" : "var(--text2)",
              transition: "all 0.15s ease", textTransform: "capitalize",
            }}>{label}</button>
          );
        })}
      </div>

      <div key={`${tab}-${timeFilter}`} className="tab-content">
      {tab === "add" ? (
        <AddTaskForm dispatch={dispatch} groups={groups} setTab={setTab} defaultTime={timeFilter !== "all" ? timeFilter : ""} existingTasks={tasks} showToast={showToast} userName={userName} />
      ) : (
        <>
          {/* hide completed toggle */}
          {tab === "view" && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 12,
            }}>
              <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>
                {filtered.length} task{filtered.length !== 1 ? "s" : ""}
              </span>
              <button onClick={() => setHideCompleted(p => !p)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
                border: "1px solid var(--border)", borderRadius: 100,
                background: hideCompleted ? "var(--green-lt)" : "var(--bg-card)",
                cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                color: hideCompleted ? "var(--green)" : "var(--text2)",
                transition: "all 0.15s ease",
              }}>
                <div style={{
                  width: 32, height: 18, borderRadius: 100, padding: 2,
                  background: hideCompleted ? "var(--green)" : "var(--border)",
                  transition: "background 0.2s ease",
                  display: "flex", alignItems: "center",
                }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%", background: "white",
                    transition: "transform 0.2s ease",
                    transform: hideCompleted ? "translateX(14px)" : "translateX(0)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }} />
                </div>
                Hide done
              </button>
            </div>
          )}
          {filtered.length === 0 ? (
            <EmptyState msg={emptyMsg} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((t, i) => (
                <TaskCard key={t.id} task={t} dispatch={dispatch} delay={i * 0.04} showToast={showToast} userName={userName} groups={groups} onOpenActivity={setActiveTask} />
              ))}
            </div>
          )}
        </>
      )}
      </div>

      {/* toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* ── activity bottom sheet – rendered here so position:fixed is never clipped ── */}
      {activeTask && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 300,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setActiveTask(null)}>
          <div style={{
            background: "var(--bg)",
            width: "100%", maxWidth: "var(--app-max, 480px)",
            borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: "0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
            animation: "slideUpSheet 0.3s cubic-bezier(0.32,0.72,0,1) both",
            maxHeight: "75vh", overflowY: "auto",
            position: "relative",
            boxSizing: "border-box",
          }} onClick={e => e.stopPropagation()}>
            <style>{`@keyframes slideUpSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

            {/* drag handle */}
            <div style={{
              width: 40, height: 4, background: "var(--border)", borderRadius: 100,
              margin: "12px auto 0",
            }} />

            {/* header */}
            <div style={{
              padding: "14px 20px", borderBottom: "1px solid var(--border)", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <button onClick={() => setActiveTask(null)} style={{
                position: "absolute", top: "50%", left: 14, transform: "translateY(-50%)",
                width: 36, height: 36, borderRadius: "50%",
                background: "transparent", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text)", padding: 0, transition: "background 0.15s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-card)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <h4 style={{
                fontSize: 18, fontWeight: 700, margin: 0,
                maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                textAlign: "center",
              }}>{activeTask.title}</h4>
            </div>

            {/* timeline */}
            <div style={{ padding: "20px 20px calc(24px + env(safe-area-inset-bottom, 0px))" }}>
              <p style={{ fontSize: 11, color: "var(--text2)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                Activity timeline
              </p>
              <ActivityTimeline activity={activeTask.activity || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, dispatch, delay, showToast, userName, groups, onOpenActivity }) {
  const pc = { high: "var(--red)", medium: "var(--accent)", low: "var(--green)" };
  const pbg = { high: "var(--red-lt)", medium: "var(--accent-lt)", low: "var(--green-lt)" };
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDueDate, setNewDueDate] = useState(task.dueDate || "");
  const [newDueTime, setNewDueTime] = useState(task.dueTime || "");

  const isMissed = task.status === "missed";
  const isDone = task.status === "completed";

  const cardBg = isDone
    ? "rgba(22,163,74,0.06)"
    : isMissed
      ? "rgba(220,38,38,0.1)"
      : "var(--bg-card)";

  const cardBorder = isDone
    ? "1px solid rgba(22,163,74,0.18)"
    : isMissed
      ? "1px solid rgba(220,38,38,0.25)"
      : "1px solid var(--border)";

  const titleColor = isDone ? "var(--text2)" : isMissed ? "var(--red)" : "var(--text)";

  const handleReschedule = () => {
    if (!newDueDate) return;
    dispatch({ type: "UPDATE_DUE", id: task.id, dueDate: newDueDate, dueTime: newDueTime || null });
    setShowReschedule(false);
    showToast("Task rescheduled", "green");
  };

  // ownership: owner of task OR owner of group can delete
  const taskOwner = task.createdBy;
  const taskGroup = groups?.find(g => g.id === task.groupId || g.name === task.group);
  const groupOwner = taskGroup?.createdBy;
  const canDelete = userName === taskOwner || userName === groupOwner;
  const isOwner = userName === taskOwner;
  // group task = group has more than 1 member (shared group)
  const isGroupTask = taskGroup && taskGroup.members?.length > 1;
  const groupColor = taskGroup?.color || "var(--accent)";

  return (
    <>
      <div className="fu" onClick={() => onOpenActivity && onOpenActivity(task)} style={{
        background: cardBg, borderRadius: "var(--r)", padding: "var(--card-pad, 14px)",
        border: cardBorder, boxShadow: "var(--sh)", animationDelay: `${delay}s`,
        borderLeft: isGroupTask ? `4px solid ${groupColor}` : cardBorder,
        position: "relative", cursor: "pointer",
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <button onClick={(e) => { e.stopPropagation(); setShowCompleteConfirm(true); }} style={{
            width: 22, height: 22, borderRadius: 6, border: "2px solid",
            borderColor: isDone ? "var(--green)" : isMissed ? "var(--red)" : "var(--border)",
            background: isDone ? "var(--green)" : "transparent",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1, color: "white", transition: "all 0.15s ease",
          }}>{isDone && I.check}</button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <div style={{
                fontSize: 14, fontWeight: isMissed ? 600 : 500, lineHeight: 1.35,
                color: titleColor,
              }}>{task.title}</div>
              {isGroupTask && !isOwner && taskOwner && (
                <span style={{
                  padding: "2px 7px", borderRadius: 100, fontSize: 9, fontWeight: 700,
                  background: groupColor, color: "white", opacity: 0.9,
                  letterSpacing: "0.02em", display: "inline-flex", alignItems: "center", gap: 3,
                }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"/></svg>
                  {taskOwner}
                </span>
              )}
              {isGroupTask && isOwner && (
                <span style={{
                  padding: "2px 7px", borderRadius: 100, fontSize: 9, fontWeight: 700,
                  background: groupColor, color: "white", opacity: 0.9,
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>You</span>
              )}
            </div>
            {task.desc && <div style={{ fontSize: 12, color: isMissed ? "rgba(220,38,38,0.6)" : "var(--text2)", marginTop: 2, lineHeight: 1.4 }}>{task.desc}</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
              <Pill bg={pbg[task.priority]} color={pc[task.priority]} text={task.priority} />
              <Pill text={task.time} />
              <Pill text={task.group} bg={isGroupTask ? `${groupColor}22` : undefined} color={isGroupTask ? groupColor : undefined} />
              {task.dueDate && <Pill
                bg={isMissed ? "var(--red-lt)" : undefined}
                color={isMissed ? "var(--red)" : undefined}
                text={task.dueDate}
              />}
              {task.dueTime && <Pill
                bg={isMissed ? "var(--red-lt)" : undefined}
                color={isMissed ? "var(--red)" : undefined}
                text={task.dueTime}
              />}
              <StatusBadge status={task.status} />
              {task.rescheduled && !isMissed && (
                <span style={{
                  padding: "2px 7px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                  background: "var(--accent-lt)", color: "var(--accent)",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                }}>Rescheduled</span>
              )}
              {task.delayed && isDone && (() => {
                const dueStr = task.dueDate + (task.dueTime ? "T" + task.dueTime : "T23:59");
                const due = new Date(dueStr);
                const completed = new Date(task.completedAt);
                const diffMs = completed - due;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHrs = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHrs / 24);
                const diffMonths = Math.floor(diffDays / 30);
                let delayText = "";
                if (diffMonths > 0) delayText = `${diffMonths}mo`;
                else if (diffDays >= 7) delayText = `${Math.floor(diffDays / 7)}w`;
                else if (diffDays > 0) delayText = `${diffDays}d`;
                else if (diffHrs > 0) delayText = `${diffHrs}h`;
                else delayText = `${Math.max(1, diffMins)}m`;
                return (
                  <span style={{
                    padding: "2px 7px", borderRadius: 5, fontSize: 9, fontWeight: 700,
                    background: "var(--red-lt)", color: "var(--red)",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>Delayed {delayText}</span>
                );
              })()}
            </div>
          </div>

          {/* action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, alignItems: "center", marginTop: 1 }} onClick={e => e.stopPropagation()}>
            {!isDone && (
              <button onClick={(e) => { e.stopPropagation(); setShowReschedule(true); }} style={{
                background: "none", border: "none", color: "var(--text2)", cursor: "pointer",
                padding: 3, borderRadius: 6, transition: "color 0.15s ease",
                opacity: 0.5,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "0.5"; e.currentTarget.style.color = "var(--text2)"; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} style={{
              background: "none", border: "none", color: isMissed ? "rgba(220,38,38,0.3)" : "var(--border)", cursor: "pointer",
              padding: 3, borderRadius: 6, transition: "color 0.15s ease",
              display: canDelete ? "block" : "none",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
            onMouseLeave={e => e.currentTarget.style.color = isMissed ? "rgba(220,38,38,0.3)" : "var(--border)"}
            >{I.trash}</button>
          </div>
        </div>
      </div>

      {/* delete confirmation */}
      {showDeleteConfirm && (
        <ConfirmPopup
          title="Delete task"
          message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmColor="var(--red)"
          onConfirm={() => { dispatch({ type: "DELETE_TASK", id: task.id }); setShowDeleteConfirm(false); showToast("Task deleted", "red"); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* complete/uncomplete confirmation */}
      {showCompleteConfirm && (
        <ConfirmPopup
          title={isDone ? "Mark as pending" : isMissed ? "Mark as completed" : "Mark as completed"}
          message={isDone
            ? `Move "${task.title}" back to pending?`
            : `Mark "${task.title}" as completed?`}
          confirmLabel={isDone ? "Undo" : "Complete"}
          confirmColor={isDone ? "var(--accent)" : "var(--green)"}
          onConfirm={() => { dispatch({ type: "TOGGLE_STATUS", id: task.id }); setShowCompleteConfirm(false); }}
          onCancel={() => setShowCompleteConfirm(false)}
        />
      )}

      {/* reschedule popup */}
      {showReschedule && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(28,25,23,0.12)",
          
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200, padding: 24,
        }} onClick={() => setShowReschedule(false)}>
          <div className="si" style={{
            background: "var(--bg-card)", borderRadius: "var(--r)", padding: 24,
            maxWidth: "90%", width: "100%", boxShadow: "0 12px 40px rgba(28,25,23,0.15)",
          }} onClick={e => e.stopPropagation()}>
            <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Reschedule task</h4>
            <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>Set a new due date for "{task.title}"</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  New Due Date
                </label>
                <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} style={{
                  width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)",
                  borderRadius: "var(--rs)", fontSize: 13, fontFamily: "inherit",
                  background: "var(--bg)", color: "var(--text)", outline: "none",
                }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  New Due Time
                </label>
                <input type="time" value={newDueTime} onChange={e => setNewDueTime(e.target.value)} style={{
                  width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)",
                  borderRadius: "var(--rs)", fontSize: 13, fontFamily: "inherit",
                  background: "var(--bg)", color: "var(--text)", outline: "none",
                }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowReschedule(false)} style={{
                padding: "8px 18px", border: "1.5px solid var(--border)", borderRadius: "var(--rs)",
                background: "var(--bg)", color: "var(--text2)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>Cancel</button>
              <button onClick={handleReschedule} style={{
                padding: "8px 18px", border: "none", borderRadius: "var(--rs)",
                background: "var(--accent)", color: "white", fontSize: 12, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", opacity: newDueDate ? 1 : 0.5,
              }}>Reschedule</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActivityTimeline({ activity }) {
  if (!activity || activity.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", padding: "20px 0" }}>No activity yet.</p>;
  }

  const fmtDateTime = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    const yest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const isToday = d.toDateString() === today.toDateString();
    const isYest = d.toDateString() === yest.toDateString();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today at ${time}`;
    if (isYest) return `Yesterday at ${time}`;
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at ${time}`;
  };

  const typeConfig = {
    created:    { label: "Created by",    color: "var(--blue)",   bg: "var(--blue-lt)",   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
    rescheduled:{ label: "Rescheduled by",color: "var(--accent)", bg: "var(--accent-lt)", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg> },
    completed:  { label: "Finished by",   color: "var(--green)",  bg: "var(--green-lt)",  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
    reopened:   { label: "Reopened by",   color: "var(--text2)",  bg: "var(--bg)",        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 009 9 9.75 9.75 0 006.74-2.74L21 16"/><path d="M21 22v-6h-6"/><path d="M21 12a9 9 0 00-9-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M8 8H3V3"/></svg> },
    missed:     { label: "Marked missed", color: "var(--red)",    bg: "var(--red-lt)",    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  };

  return (
    <div style={{ position: "relative", paddingLeft: 36 }}>
      <div style={{ position: "absolute", left: 14, top: 10, bottom: 10, width: 2, background: "var(--border)" }} />
      {activity.map((a, idx) => {
        const cfg = typeConfig[a.type] || typeConfig.created;
        return (
          <div key={idx} style={{ position: "relative", marginBottom: idx === activity.length - 1 ? 0 : 24 }}>
            <div style={{
              position: "absolute", left: -36, top: 2,
              width: 28, height: 28, borderRadius: "50%",
              background: cfg.bg, color: cfg.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2px solid var(--bg)`,
            }}>{cfg.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", lineHeight: 1.4 }}>
              {cfg.label} <span style={{ color: cfg.color }}>{a.by === "system" ? "system" : a.by}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{fmtDateTime(a.at)}</div>
            {a.type === "rescheduled" && a.dueDate && (
              <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                New due: {a.dueDate}{a.dueTime ? ` at ${a.dueTime}` : ""}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ConfirmPopup({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, size }) {
  const maxW = size === "sm" ? 280 : "90%";
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(28,25,23,0.12)",
      
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 200, padding: 24,
    }} onClick={onCancel}>
      <div className="si" style={{
        background: "var(--bg-card)", borderRadius: "var(--r)", padding: size === "sm" ? 18 : 24,
        maxWidth: maxW, width: "100%", boxShadow: "0 12px 40px rgba(28,25,23,0.15)",
      }} onClick={e => e.stopPropagation()}>
        <h4 style={{ fontSize: size === "sm" ? 14 : 16, fontWeight: 600, marginBottom: 6 }}>{title}</h4>
        <p style={{ fontSize: size === "sm" ? 12 : 13, color: "var(--text2)", lineHeight: 1.5, marginBottom: size === "sm" ? 14 : 20 }}>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            padding: size === "sm" ? "6px 14px" : "8px 18px", border: "1.5px solid var(--border)", borderRadius: "var(--rs)",
            background: "var(--bg)", color: "var(--text2)", fontSize: size === "sm" ? 11 : 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s ease",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: size === "sm" ? "6px 14px" : "8px 18px", border: "none", borderRadius: "var(--rs)",
            background: confirmColor, color: "white", fontSize: size === "sm" ? 11 : 12, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s ease",
          }}
          onMouseEnter={e => e.target.style.opacity = "0.88"}
          onMouseLeave={e => e.target.style.opacity = "1"}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function AddTaskForm({ dispatch, groups, setTab, defaultTime, existingTasks, showToast, userName }) {
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const getDefaultDue = (time) => {
    const now = new Date();
    switch (time) {
      case "daily":
        return fmtDate(now);
      case "weekly": {
        const sun = new Date(now);
        sun.setDate(now.getDate() + (7 - now.getDay()));
        return fmtDate(sun);
      }
      case "monthly": {
        const eom = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return fmtDate(eom);
      }
      case "quarterly": {
        const q = Math.ceil((now.getMonth() + 1) / 3);
        const eoq = new Date(now.getFullYear(), q * 3, 0);
        return fmtDate(eoq);
      }
      default:
        return "";
    }
  };

  const isNoDue = !defaultTime;
  const initTime = defaultTime || "daily";
  const [form, setForm] = useState({
    title: "", desc: "", group: groups[0]?.name || "", time: initTime, priority: "medium",
    dueDate: isNoDue ? "" : getDefaultDue(initTime), dueTime: isNoDue ? "" : "23:59",
  });
  const [errors, setErrors] = useState({});
  const [dueDateManual, setDueDateManual] = useState(false);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupBtnRef = useRef(null);

  // Sync form when time filter pill changes
  useEffect(() => {
    const noDue = !defaultTime;
    const newTime = defaultTime || "daily";
    if (!dueDateManual) {
      setForm(prev => ({
        ...prev,
        time: newTime,
        dueDate: noDue ? "" : getDefaultDue(newTime),
        dueTime: noDue ? "" : "23:59",
      }));
    } else {
      setForm(prev => ({ ...prev, time: newTime }));
    }
  }, [defaultTime]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    else if (existingTasks.some(t => t.group === form.group && t.title.toLowerCase() === form.title.trim().toLowerCase())) {
      e.title = `"${form.title.trim()}" already exists in ${form.group}`;
    }
    if (!form.priority) e.priority = "Select priority";
    if (!form.group) e.group = "Select a group";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const selectedGroup = groups.find(g => g.name === form.group);
    dispatch({ type: "ADD_TASK", payload: { ...form, groupId: selectedGroup?.id, title: form.title.trim(), status: "pending", dueDate: form.dueDate || null, dueTime: form.dueTime || null } });
    showToast("Task added successfully", "green");
    const resetTime = defaultTime || "daily";
    setForm({ title: "", desc: "", group: groups[0]?.name || "", time: resetTime, priority: "medium", dueDate: isNoDue ? "" : getDefaultDue(resetTime), dueTime: isNoDue ? "" : "23:59" });
    setErrors({});
    setDueDateManual(false);
  };

  const fld = {
    width: "100%", padding: "11px 14px", border: "1.5px solid var(--border)",
    borderRadius: "var(--rs)", fontSize: 14, fontFamily: "inherit",
    background: "var(--bg)", color: "var(--text)", outline: "none",
    transition: "border-color 0.15s ease", WebkitAppearance: "none",
  };
  const fldErr = { ...fld, borderColor: "var(--red)" };
  const lbl = { fontSize: 10, fontWeight: 700, color: "var(--text2)", marginBottom: 5, display: "flex", alignItems: "center", gap: 4, textTransform: "uppercase", letterSpacing: "0.07em" };
  const reqDot = <span style={{
    width: 6, height: 6, borderRadius: "50%", background: "var(--accent)",
    display: "inline-block", flexShrink: 0,
  }} />;
  const errStyle = { fontSize: 10, color: "var(--red)", marginTop: 4, fontWeight: 500 };

  return (
    <div className="si" style={{
      background: "var(--bg-card)", borderRadius: "var(--r)", padding: 20,
      border: "1px solid var(--border)", boxShadow: "var(--shm)",
    }}>
      <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 400, marginBottom: 18 }}>
        New task
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={lbl}>Title {reqDot}</label>
          <input value={form.title} onChange={e => { setForm({...form, title: e.target.value}); if (errors.title) setErrors(p => ({...p, title: undefined})); }}
            placeholder="What needs to be done?" style={errors.title ? fldErr : fld}
            onFocus={e => e.target.style.borderColor = errors.title ? "var(--red)" : "var(--accent)"}
            onBlur={e => e.target.style.borderColor = errors.title ? "var(--red)" : "var(--border)"} />
          {errors.title && <div style={errStyle}>{errors.title}</div>}
        </div>
        <div>
          <label style={lbl}>Description</label>
          <textarea value={form.desc} onChange={e => setForm({...form, desc: e.target.value})}
            placeholder="Add details..." rows={2}
            style={{...fld, resize: "vertical"}}
            onFocus={e => e.target.style.borderColor="var(--accent)"}
            onBlur={e => e.target.style.borderColor="var(--border)"} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <label style={lbl}>Group {reqDot}</label>
            <button ref={groupBtnRef} type="button"
              onClick={() => setGroupDropdownOpen(o => !o)}
              style={{
                ...((errors.group ? fldErr : fld)),
                textAlign: "left", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 8,
              }}>
              {form.group ? (() => {
                const sel = groups.find(g => g.name === form.group);
                const isOwner = sel?.createdBy === userName;
                return (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                    <span style={{
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      minWidth: 0, flexShrink: 1,
                    }}>{form.group}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                      background: isOwner ? "var(--accent-lt)" : "var(--blue-lt)",
                      color: isOwner ? "var(--accent)" : "var(--blue)",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                      flexShrink: 0, whiteSpace: "nowrap",
                    }}>{isOwner ? "Owner" : sel?.createdBy}</span>
                  </span>
                );
              })() : <span style={{ color: "var(--text2)" }}>Select group</span>}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{
                flexShrink: 0, color: "var(--text2)",
                transition: "transform 0.2s ease",
                transform: groupDropdownOpen ? "rotate(180deg)" : "rotate(0)",
              }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {errors.group && <div style={errStyle}>{errors.group}</div>}

            {groupDropdownOpen && (
              <>
                <div onClick={() => setGroupDropdownOpen(false)} style={{
                  position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 150,
                }} />
                <div style={{
                  position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "var(--rs)", boxShadow: "0 -8px 24px rgba(28,25,23,0.12)",
                  zIndex: 160,
                  maxHeight: groups.length > 4 ? 220 : "none",
                  overflowY: groups.length > 4 ? "auto" : "visible",
                  animation: "si 0.15s ease both",
                }}>
                  {groups.length === 0 ? (
                    <div style={{ padding: "14px", textAlign: "center", fontSize: 12, color: "var(--text2)" }}>
                      No groups available
                    </div>
                  ) : groups.map((g, idx) => {
                    const isOwner = g.createdBy === userName;
                    const selected = form.group === g.name;
                    const isLast = idx === groups.length - 1;
                    return (
                      <button key={g.id} type="button" onClick={() => {
                        setForm({ ...form, group: g.name });
                        if (errors.group) setErrors(p => ({ ...p, group: undefined }));
                        setGroupDropdownOpen(false);
                      }} style={{
                        width: "100%", padding: "11px 14px", border: "none",
                        background: selected ? "var(--bg)" : "transparent",
                        color: "var(--text)", fontFamily: "inherit", fontSize: 13,
                        cursor: "pointer", textAlign: "left",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: 8, transition: "background 0.1s ease",
                        borderBottom: isLast ? "none" : "1px solid var(--border)",
                      }}
                      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "var(--bg)"; }}
                      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
                      >
                        <span style={{
                          fontWeight: selected ? 600 : 500,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          minWidth: 0, flex: 1,
                        }}>{g.name}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                          background: isOwner ? "var(--accent-lt)" : "var(--blue-lt)",
                          color: isOwner ? "var(--accent)" : "var(--blue)",
                          textTransform: "uppercase", letterSpacing: "0.04em",
                          flexShrink: 0, whiteSpace: "nowrap",
                        }}>{isOwner ? "Owner" : g.createdBy}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div>
            <label style={lbl}>Priority {reqDot}</label>
            <select value={form.priority} onChange={e => { setForm({...form, priority: e.target.value}); if (errors.priority) setErrors(p => ({...p, priority: undefined})); }}
              style={errors.priority ? fldErr : fld}>
              <option value="">Select priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {errors.priority && <div style={errStyle}>{errors.priority}</div>}
          </div>
        </div>
        {!isNoDue && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={lbl}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => { setForm({...form, dueDate: e.target.value}); setDueDateManual(true); }} style={fld} />
            </div>
            <div>
              <label style={lbl}>Due Time</label>
              <input type="time" value={form.dueTime || ""} onChange={e => { setForm({...form, dueTime: e.target.value}); setDueDateManual(true); }} style={fld} />
            </div>
          </div>
        )}
        <button onClick={submit} style={{
          padding: "13px", background: "var(--bg-dark)", color: "var(--text-inv)",
          border: "none", borderRadius: "var(--rs)", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit", width: "100%", marginTop: 2,
          transition: "opacity 0.15s ease",
        }}
        onMouseEnter={e => e.target.style.opacity="0.88"}
        onMouseLeave={e => e.target.style.opacity="1"}>
          Create Task
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════ GROUPS ═══════════════════════ */

function GroupsPage({ groups, setGroups, tasks, onLogout, userName, invitations, setInvitations, users }) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#D97706");
  const [memberInput, setMemberInput] = useState({});
  const [inviteToast, setInviteToast] = useState(null);
  const [confirmCreate, setConfirmCreate] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(null); // { groupId, memberName }
  const topRef = useRef(null);

  const toggleForm = () => {
    const next = !showForm;
    setShowForm(next);
    if (next) {
      // scroll to top so user sees the newly opened form
      setTimeout(() => {
        if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }, 50);
    }
  };

  const colors = ["#D97706","#2563EB","#16A34A","#DC2626","#7C3AED","#0EA5E9","#EC4899","#10B981"];

  const showInviteToast = (msg, type) => {
    setInviteToast({ message: msg, type });
    setTimeout(() => setInviteToast(null), 2500);
  };

  const addGroup = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    // check if user already has a group with this name (case-insensitive)
    const exists = groups.some(g => g.members.includes(userName) && g.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) { showInviteToast(`You already have a group named "${trimmed}"`, "red"); return; }
    setConfirmCreate(true);
  };

  const confirmAddGroup = () => {
    setGroups(p => [...p, { id: Date.now(), name: newName.trim(), color: newColor, members: [userName], createdBy: userName }]);
    setNewName(""); setShowForm(false); setConfirmCreate(false);
    showInviteToast("Group created", "green");
  };

  const deleteGroup = (gid) => {
    setGroups(p => p.filter(g => g.id !== gid));
    setConfirmDeleteId(null);
    showInviteToast("Group deleted", "red");
  };

  const sendInvite = (gid) => {
    const target = (memberInput[gid] || "").trim().toLowerCase();
    if (!target) return;
    if (!/^[a-z][a-z0-9._]*$/.test(target)) { showInviteToast("Invalid username format", "red"); return; }
    if (target === userName) { showInviteToast("You can't invite yourself", "red"); return; }
    if (!users[target]) { showInviteToast(`User "${target}" is not registered`, "red"); return; }
    const group = groups.find(g => g.id === gid);
    if (group?.isDefault) { showInviteToast("Can't invite others to your default group", "red"); return; }
    if (group?.members?.includes(target)) { showInviteToast(`${target} is already a member`, "red"); return; }
    if (invitations.some(inv => inv.to === target && inv.groupId === gid && inv.status === "pending")) {
      showInviteToast(`Invite already sent to ${target}`, "red"); return;
    }
    setInvitations(p => [...p, {
      id: Date.now(), from: userName, to: target,
      groupId: gid, groupName: group?.name, status: "pending",
    }]);
    setMemberInput(p => ({ ...p, [gid]: "" }));
    showInviteToast(`Invite sent to ${target}`, "green");
  };

  const acceptInvite = (invId) => {
    const inv = invitations.find(i => i.id === invId);
    if (!inv) return;
    setGroups(p => p.map(g => g.id === inv.groupId ? { ...g, members: [...g.members, inv.to] } : g));
    setInvitations(p => p.map(i => i.id === invId ? { ...i, status: "accepted" } : i));
    showInviteToast(`Joined ${inv.groupName}`, "green");
  };

  const rejectInvite = (invId) => {
    setInvitations(p => p.map(i => i.id === invId ? { ...i, status: "rejected" } : i));
    showInviteToast("Invitation declined", "red");
  };

  const removeMember = (gid, idx) => {
    setGroups(p => p.map(g => g.id === gid ? { ...g, members: g.members.filter((_, i) => i !== idx) } : g));
  };

  const confirmRemoveUserFromGroup = () => {
    if (!confirmRemoveMember) return;
    const { groupId, memberName } = confirmRemoveMember;
    setGroups(p => p.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m !== memberName) } : g));
    showInviteToast(`${memberName} removed from group`, "red");
    setConfirmRemoveMember(null);
  };

  const myPendingInvites = invitations.filter(inv => inv.to === userName && inv.status === "pending");
  const sentPending = (gid) => invitations.filter(inv => inv.groupId === gid && inv.status === "pending");
  // groups where current user received an invite (accepted or pending)
  const invitedGroups = invitations.filter(inv => inv.to === userName && (inv.status === "accepted" || inv.status === "pending"));
  const invitedGroupIds = new Set(invitedGroups.map(inv => inv.groupId));

  const fld = {
    width: "100%", padding: "10px 12px", border: "1.5px solid var(--border)",
    borderRadius: "var(--rs)", fontSize: 13, fontFamily: "inherit",
    background: "var(--bg)", color: "var(--text)", outline: "none",
  };

  return (
    <div ref={topRef} style={{ padding: "20px var(--page-px, 18px)" }}>
      <div className="fu" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "var(--font-title, 28px)", fontWeight: 400, letterSpacing: "-0.02em" }}>
          Groups<span style={{ color: "var(--accent)" }}>.</span>
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoutBtn onLogout={onLogout} />
        </div>
      </div>

      {/* pending invitations for current user */}
      {myPendingInvites.length > 0 && (
        <div className="fu" style={{ marginBottom: 16, animationDelay: "0.02s" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Invitations ({myPendingInvites.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myPendingInvites.map(inv => (
              <div key={inv.id} style={{
                background: "var(--accent-lt)", borderRadius: "var(--rs)", padding: "12px 14px",
                border: "1.5px solid var(--accent)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  {inv.from} <span style={{ fontWeight: 400, color: "var(--text2)" }}>invited you to</span> {inv.groupName}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => acceptInvite(inv.id)} style={{
                    padding: "6px 14px", border: "none", borderRadius: 100,
                    background: "var(--green)", color: "white", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>Accept</button>
                  <button onClick={() => rejectInvite(inv.id)} style={{
                    padding: "6px 14px", border: "1.5px solid var(--border)", borderRadius: 100,
                    background: "var(--bg-card)", color: "var(--text2)", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="si" style={{
          background: "var(--bg-card)", borderRadius: "var(--r)", padding: 18,
          border: "1px solid var(--border)", marginBottom: 16, boxShadow: "var(--shm)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>New Group</div>
          <input value={newName} onChange={e => setNewName(e.target.value.slice(0, 40))}
            placeholder="Group name" maxLength={40} style={{ ...fld, marginBottom: 4 }}
            onFocus={e => e.target.style.borderColor="var(--accent)"}
            onBlur={e => e.target.style.borderColor="var(--border)"} />
          <div style={{ fontSize: 10, color: "var(--text2)", textAlign: "right", marginBottom: 10 }}>
            {newName.length}/40
          </div>
          <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
            {colors.map(c => (
              <button key={c} onClick={() => setNewColor(c)} style={{
                width: 26, height: 26, borderRadius: "50%", background: c, border: "2.5px solid",
                borderColor: newColor === c ? "var(--text)" : "transparent", cursor: "pointer",
              }} />
            ))}
          </div>
          <button onClick={addGroup} style={{
            padding: "10px", background: "var(--bg-dark)", color: "var(--text-inv)",
            border: "none", borderRadius: "var(--rs)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit", width: "100%",
          }}>Create Group</button>
        </div>
      )}

      {(() => {
        // Only show groups where the current user is a member
        const visibleGroups = groups.filter(g => g.members.includes(userName));
        return visibleGroups.length === 0 ? (
          <EmptyState msg="No groups yet. Tap + to create!" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visibleGroups.map((g, i) => {
              const gt = tasks.filter(t => t.group === g.name);
              const gd = gt.filter(t => t.status === "completed").length;
              const pendingSent = sentPending(g.id);
              const isInvited = invitedGroupIds.has(g.id);
              const isCreator = g.createdBy === userName;
              return (
                <div key={g.id} className="fu" style={{
                  background: "var(--bg-card)", borderRadius: "var(--r)", padding: 16,
                  border: "1px solid var(--border)", borderLeft: `3px solid ${g.color}`,
                  boxShadow: "var(--sh)", animationDelay: `${i * 0.05}s`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: 15, fontWeight: 600,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        minWidth: 0,
                      }}>{g.name}</span>
                      {isInvited && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "var(--blue-lt)", color: "var(--blue)", textTransform: "uppercase", flexShrink: 0 }}>Invited</span>
                      )}
                      {g.isDefault && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "var(--bg)", color: "var(--text2)", textTransform: "uppercase", flexShrink: 0 }}>Default</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: "var(--text2)", background: "var(--bg)", padding: "2px 8px", borderRadius: 100 }}>{gt.length} tasks</span>
                      {!g.isDefault && isCreator && (
                        <button onClick={() => setConfirmDeleteId(g.id)} style={{ background: "none", border: "none", color: "var(--border)", cursor: "pointer", padding: 2 }}>{I.trash}</button>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <div style={{ background: "var(--border)", borderRadius: 100, height: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 100, background: g.color, width: `${gt.length ? (gd/gt.length)*100 : 0}%`, transition: "width 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 3 }}>{gd}/{gt.length} completed</div>
                  </div>

                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Members</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                    {g.members.filter(m => m !== userName).length === 0 && <span style={{ fontSize: 11, color: "var(--text2)", fontStyle: "italic" }}>No other members</span>}
                    {g.members.filter(m => m !== userName).map((m, j) => {
                      // Can only remove a member if I am the creator OR the member is not the creator
                      const canRemove = isCreator && m !== g.createdBy;
                      return (
                        <div key={j} style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: canRemove ? "3px 8px 3px 3px" : "3px 10px 3px 3px", borderRadius: 100,
                          background: "var(--bg)", border: "1px solid var(--border)", fontSize: 11,
                        }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%", background: g.color, opacity: 0.8,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 8, fontWeight: 700, color: "white",
                          }}>{m[0]}</div>
                          {m}
                          {m === g.createdBy && <span style={{ fontSize: 8, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", marginLeft: 2 }}>owner</span>}
                          {canRemove && (
                            <button onClick={() => setConfirmRemoveMember({ groupId: g.id, memberName: m, groupName: g.name })} style={{
                              background: "none", border: "none", color: "var(--text2)", cursor: "pointer",
                              fontSize: 13, padding: 0, marginLeft: 1, lineHeight: 1,
                            }}>×</button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* pending invites for this group */}
                  {pendingSent.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
                      {pendingSent.map(inv => (
                        <div key={inv.id} style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "3px 8px", borderRadius: 100, fontSize: 10, fontWeight: 600,
                          background: "var(--accent-lt)", color: "var(--accent)",
                          border: "1px dashed var(--accent)",
                        }}>
                          {inv.to} <span style={{ opacity: 0.6 }}>pending</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* invite input - hidden for default groups */}
                  {!g.isDefault && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        value={memberInput[g.id] || ""}
                        onChange={e => setMemberInput(p => ({ ...p, [g.id]: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "") }))}
                        onKeyDown={e => { if (e.key === "Enter") sendInvite(g.id); }}
                        placeholder="Invite by username..."
                        autoCapitalize="none" autoCorrect="off"
                        style={{ ...fld, flex: 1, textTransform: "lowercase" }}
                      />
                      <button onClick={() => sendInvite(g.id)} style={{
                        padding: "8px 12px", background: g.color, color: "white", border: "none",
                        borderRadius: "var(--rs)", cursor: "pointer", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{I.userPlus}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* create group confirmation */}
      {confirmCreate && (
        <ConfirmPopup
          size="sm"
          title="Create group"
          message={`Create a new group "${newName.trim()}"?`}
          confirmLabel="Create"
          confirmColor="var(--green)"
          onConfirm={confirmAddGroup}
          onCancel={() => setConfirmCreate(false)}
        />
      )}

      {/* delete group confirmation */}
      {confirmDeleteId && (
        <ConfirmPopup
          size="sm"
          title="Delete group"
          message={`Delete "${groups.find(g => g.id === confirmDeleteId)?.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          confirmColor="var(--red)"
          onConfirm={() => deleteGroup(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* remove member confirmation */}
      {confirmRemoveMember && (
        <ConfirmPopup
          size="sm"
          title="Remove member"
          message={`Remove "${confirmRemoveMember.memberName}" from "${confirmRemoveMember.groupName}"?`}
          confirmLabel="Remove"
          confirmColor="var(--red)"
          onConfirm={confirmRemoveUserFromGroup}
          onCancel={() => setConfirmRemoveMember(null)}
        />
      )}

      {inviteToast && <Toast message={inviteToast.message} type={inviteToast.type} />}

      {/* floating action button - add group */}
      <button onClick={toggleForm} className="fab-group" style={{
        position: "fixed", bottom: `calc(80px + env(safe-area-inset-bottom, 0px))`,
        width: 52, height: 52, borderRadius: "50%", border: "none",
        background: "var(--bg-dark)", color: "var(--text-inv)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 20px rgba(28,25,23,0.25)",
        transition: "transform 0.25s ease, box-shadow 0.15s ease",
        transform: showForm ? "rotate(45deg) scale(1.05)" : "rotate(0) scale(1)",
        zIndex: 90,
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 24px rgba(28,25,23,0.35)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(28,25,23,0.25)"}
      >{I.plus}</button>
    </div>
  );
}

/* ═══════════════════════ REWARDS ═══════════════════════ */

function Rewards({ tasks, onLogout }) {
  const completed = tasks.filter(t => t.status === "completed").length;

  const badges = [
    { name: "First Step", desc: "Complete your first task", threshold: 1, icon: I.star },
    { name: "Hat Trick", desc: "Complete 3 tasks", threshold: 3, icon: I.fire },
    { name: "High Five", desc: "Complete 5 tasks", threshold: 5, icon: I.check },
    { name: "Perfect Ten", desc: "Complete 10 tasks", threshold: 10, icon: I.star },
    { name: "Quarter Century", desc: "Complete 25 tasks", threshold: 25, icon: I.fire },
    { name: "Half Century", desc: "Complete 50 tasks", threshold: 50, icon: I.star },
  ];

  return (
    <div style={{ padding: "20px var(--page-px, 18px)" }}>
      <div className="fu" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "var(--font-title, 28px)", fontWeight: 400, letterSpacing: "-0.02em" }}>
            Rewards<span style={{ color: "var(--accent)" }}>.</span>
          </h2>
          <p style={{ color: "var(--text2)", fontSize: 12, marginTop: 3 }}>Earn badges by completing tasks.</p>
        </div>
        <LogoutBtn onLogout={onLogout} />
      </div>

      {/* score */}
      <div className="fu" style={{
        background: "linear-gradient(135deg, #1C1917, #44403C)", borderRadius: "var(--r)",
        padding: 22, marginBottom: 18, color: "white", animationDelay: "0.04s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "rgba(217,119,6,0.2)", border: "2px solid var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>{I.fire}</div>
          <div>
            <div style={{ fontSize: 10, opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 1 }}>Tasks Completed</div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{completed}</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 10, opacity: 0.4, marginBottom: 5 }}>
            {completed < 50 ? `${Math.max(0, (badges.find(b => b.threshold > completed)?.threshold || 50) - completed)} more to next badge` : "All badges earned!"}
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 100, height: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 100, background: "var(--accent)", width: `${Math.min(100, (completed / 50) * 100)}%`, transition: "width 0.5s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {badges.map((b, i) => {
          const earned = completed >= b.threshold;
          return (
            <div key={i} className="fu" style={{
              background: "var(--bg-card)", borderRadius: "var(--r)", padding: "var(--card-pad, 14px)",
              border: "1px solid var(--border)", boxShadow: "var(--sh)",
              animationDelay: `${0.08 + i * 0.05}s`, opacity: earned ? 1 : 0.4,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "var(--rs)", flexShrink: 0,
                background: earned ? "var(--accent-lt)" : "var(--bg)",
                color: earned ? "var(--accent)" : "var(--text2)",
                border: earned ? "2px solid var(--accent)" : "2px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{b.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{b.desc}</div>
              </div>
              {earned ? (
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--green)" }}>Earned</span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text2)" }}>{b.threshold - completed} left</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════ SHARED ═══════════════════════ */

function StatusBadge({ status }) {
  const c = {
    completed: { bg: "var(--green-lt)", color: "var(--green)", label: "Done" },
    pending: { bg: "var(--accent-lt)", color: "var(--accent)", label: "Pending" },
    missed: { bg: "var(--red-lt)", color: "var(--red)", label: "Missed" },
  }[status] || { bg: "var(--accent-lt)", color: "var(--accent)", label: "Pending" };
  return (
    <span style={{
      padding: "2px 7px", borderRadius: 5, fontSize: 9, fontWeight: 700,
      background: c.bg, color: c.color, textTransform: "uppercase", letterSpacing: "0.04em",
    }}>{c.label}</span>
  );
}

function Pill({ text, bg, color: clr }) {
  return (
    <span style={{
      padding: "2px 7px", borderRadius: 5, fontSize: 9, fontWeight: 600,
      background: bg || "var(--bg)", color: clr || "var(--text2)",
      textTransform: "capitalize", letterSpacing: "0.02em",
      maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis",
      whiteSpace: "nowrap", display: "inline-block",
    }}>{text}</span>
  );
}

function LogoutBtn({ onLogout }) {
  return (
    <button onClick={onLogout} style={{
      display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
      border: "1px solid var(--border)", borderRadius: 8,
      background: "var(--bg-card)", cursor: "pointer", fontFamily: "inherit",
      fontSize: 11, fontWeight: 600, color: "var(--text2)",
      transition: "all 0.15s ease",
      WebkitTapHighlightColor: "transparent",
      minHeight: 32,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--red)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-lt)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.background = "var(--bg-card)"; }}
    onTouchStart={e => { e.currentTarget.style.borderColor = "var(--red)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.background = "var(--red-lt)"; }}
    onTouchEnd={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.background = "var(--bg-card)"; }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Logout
    </button>
  );
}

function Dot({ c }) {
  return <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: c, marginRight: 7 }} />;
}

function SectionHeader({ title }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
      {title}
    </div>
  );
}

function EmptyState({ msg }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "44px 20px", color: "var(--text2)",
    }}>
      {I.empty}
      <p style={{ fontSize: 13, marginTop: 10, textAlign: "center" }}>{msg}</p>
    </div>
  );
}

function Toast({ message, type }) {
  const bg = type === "green" ? "var(--green)" : type === "red" ? "var(--red)" : "var(--bg-dark)";
  return (
    <div style={{
      position: "fixed", top: 20, left: 0, right: 0,
      display: "flex", justifyContent: "center",
      zIndex: 300, pointerEvents: "none",
    }}>
      <div style={{
        background: bg, color: "white", padding: "10px 20px",
        borderRadius: 100, fontSize: 12, fontWeight: 600,
        boxShadow: "0 4px 20px rgba(28,25,23,0.2)",
        animation: "fu 0.3s ease both",
        whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
        display: "flex", alignItems: "center", gap: 6,
        pointerEvents: "auto",
      }}>
        {type === "green" && I.check}
        {type === "red" && I.trash}
        {message}
      </div>
    </div>
  );
}

function EmptyMsg({ msg }) {
  return <div style={{ color: "var(--text2)", fontSize: 12, padding: "14px 0", textAlign: "center", fontStyle: "italic" }}>{msg}</div>;
}
