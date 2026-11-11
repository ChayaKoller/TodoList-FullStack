import React, { useEffect, useState } from "react";
import service from "./service.js";
import "./App.css";
import Auth from "./Auth";

// קריאת שם המשתמש מתוך הטוקן (ה-claim "unique_name" שהשרת יוצר בהתחברות)
function getUserName(token) {
  try {
    const payload = token.split(".")[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return data.unique_name || "";
  } catch {
    return "";
  }
}

// המשפט שמתחת לברכה
function leadText(total, open) {
  if (total === 0) return "עוד אין משימות. בואי נתחיל.";
  if (open === 0) return "סיימת הכול, כל הכבוד!";
  if (open === 1) return "נשארה לך משימה אחת";
  return `נשארו לך ${open} משימות`;
}

const RING = 263.9; // היקף העיגול של טבעת ההתקדמות (2 * pi * 42)

const filters = [
  { value: "all", label: "הכל" },
  { value: "open", label: "פתוחות" },
  { value: "done", label: "הושלמו" }
];

function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("token")
  );
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [confirmId, setConfirmId] = useState(null);

  function handleLogin(newToken) {
    sessionStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    sessionStorage.removeItem("token");
    setToken(null);
    setTodos([]);
  }

  async function getTodos() {
    try {
      const data = await service.getTasks();
      setTodos(data);
      setError("");
    } catch {
      setError("לא הצלחנו לטעון את המשימות. בדקי שהשרת פועל.");
    } finally {
      setLoading(false);
    }
  }

  async function createTodo(e) {
    e.preventDefault();
    const name = newTodo.trim();
    if (!name || saving) return;

    setSaving(true);
    try {
      await service.addTask(name);
      setNewTodo("");
      if (filter === "done") setFilter("all");
      await getTodos();
    } catch {
      setError("לא ניתן להוסיף את המשימה.");
    } finally {
      setSaving(false);
    }
  }

  async function updateCompleted(todo, isComplete) {
    try {
      await service.setCompleted(todo.id, isComplete);
      await getTodos();
    } catch {
      setError("לא ניתן לעדכן את המשימה.");
    }
  }

  async function deleteTodo(id) {
    setConfirmId(null);
    try {
      await service.deleteTask(id);
      await getTodos();
    } catch {
      setError("לא ניתן למחוק את המשימה.");
    }
  }

  useEffect(() => {
    if (token) {
      setLoading(true);
      getTodos();
    } else {
      setTodos([]);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    function handleAuthExpired() {
      setToken(null);
      setTodos([]);
    }

    window.addEventListener("auth-expired", handleAuthExpired);

    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, []);

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  const userName = getUserName(token);
  const completedCount = todos.filter(t => t.isComplete).length;
  const remainingCount = todos.length - completedCount;
  const percent = todos.length
    ? Math.round((completedCount / todos.length) * 100)
    : 0;
  const today = new Date().toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  // המשימות שמוצגות לפי הסינון שנבחר
  const shownTodos = todos.filter(t =>
    filter === "all" || (filter === "done") === Boolean(t.isComplete)
  );

  return (
    <div className="app-page" dir="rtl">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">✓</span>
          המשימות שלי
        </div>

        <div className="user-box">
          {userName && (
            <>
              <span className="avatar" aria-hidden="true">
                {userName[0]}
              </span>
              <span className="user-name">{userName}</span>
            </>
          )}
          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            יציאה
          </button>
        </div>
      </header>

      <main className="app-container">
        <section className="hello">
          <div>
            <p className="hello-date">{today}</p>
            <h1>{userName ? `שלום, ${userName}` : "שלום"}</h1>
            <p className="hello-lead">
              {leadText(todos.length, remainingCount)}
            </p>
          </div>

          <div
            className="ring"
            role="img"
            aria-label={`${percent}% מהמשימות הושלמו`}
          >
            <svg viewBox="0 0 100 100">
              <circle className="ring-track" cx="50" cy="50" r="42" />
              <circle
                className="ring-value"
                cx="50"
                cy="50"
                r="42"
                strokeDasharray={RING}
                strokeDashoffset={RING - (RING * percent) / 100}
              />
            </svg>
            <b>{percent}%</b>
          </div>
        </section>

        <section className="stats" aria-label="סיכום">
          <div className="stat-card">
            <strong>{todos.length}</strong>
            <span>סה"כ משימות</span>
          </div>
          <div className="stat-card open">
            <strong>{remainingCount}</strong>
            <span>ממתינות</span>
          </div>
          <div className="stat-card done">
            <strong>{completedCount}</strong>
            <span>הושלמו</span>
          </div>
        </section>

        <section className="todo-panel">
          <form onSubmit={createTodo} className="add-todo-form">
            <input
              type="text"
              placeholder="מה צריך לעשות היום?"
              aria-label="משימה חדשה"
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              className="add-todo-input"
              maxLength={100}
            />
            <button
              type="submit"
              className="add-todo-button"
              disabled={!newTodo.trim() || saving}
            >
              {saving ? "מוסיפה..." : "+ הוספה"}
            </button>
          </form>

          <div className="list-heading">
            <h2>רשימת המשימות</h2>
            <div className="filters" role="group" aria-label="סינון משימות">
              {filters.map(f => (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
              <button type="button" onClick={getTodos}>נסי שוב</button>
            </div>
          )}

          {loading ? (
            <p className="empty-message">טוענת משימות...</p>
          ) : shownTodos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">✓</div>
              <h3>
                {todos.length === 0
                  ? "הרשימה שלך עדיין ריקה"
                  : "אין משימות להצגה"}
              </h3>
              <p>
                {todos.length === 0
                  ? "הוסיפי משימה ראשונה כדי להתחיל"
                  : "נסי סינון אחר"}
              </p>
            </div>
          ) : (
            <ul className="todo-list-custom">
              {shownTodos.map(todo => (
                <li
                  key={todo.id}
                  className={`todo-item ${todo.isComplete ? "done" : ""}`}
                >
                  <label className="todo-content">
                    <input
                      type="checkbox"
                      checked={Boolean(todo.isComplete)}
                      onChange={e =>
                        updateCompleted(todo, e.target.checked)
                      }
                    />
                    <span className="check-box" aria-hidden="true">✓</span>
                    <span className="todo-name">{todo.name}</span>
                  </label>

                  {confirmId === todo.id ? (
                    <span className="confirm-delete">
                      למחוק?
                      <button
                        type="button"
                        className="confirm-yes"
                        onClick={() => deleteTodo(todo.id)}
                      >
                        כן
                      </button>
                      <button
                        type="button"
                        className="confirm-no"
                        onClick={() => setConfirmId(null)}
                      >
                        ביטול
                      </button>
                    </span>
                  ) : (
                    <>
                      <span className={`todo-tag ${todo.isComplete ? "done" : "open"}`}>
                        {todo.isComplete ? "הושלמה" : "פתוחה"}
                      </span>
                      <button
                        type="button"
                        className="delete-button"
                        onClick={() => setConfirmId(todo.id)}
                        title="מחיקת משימה"
                        aria-label={`מחיקת המשימה ${todo.name}`}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="app-footer">
          צעד קטן בכל פעם, והמשימות מסתדרות
        </footer>
      </main>
    </div>
  );
}

export default App;
