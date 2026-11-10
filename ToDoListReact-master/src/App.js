import React, { useEffect, useState } from "react";
import service from "./service.js";
import "./App.css";
import Auth from "./Auth";
function App() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("token")
  );
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
    try {
      await service.deleteTask(id);
      await getTodos();
    } catch {
      setError("לא ניתן למחוק את המשימה.");
    }
  }

  useEffect(() => {
    if (token) {
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

  const completedCount = todos.filter(t => t.isComplete).length;
  const remainingCount = todos.length - completedCount;
  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }
  return (
    <div className="app-page" dir="rtl">
      <main className="app-container">

        <header className="app-header">
          <div className="header-icon">✓</div>
          <div>
            <h1>המשימות שלי</h1>
            <p>מקום מסודר לכל מה שצריך לעשות</p>
            <button type="button" onClick={handleLogout}>
              התנתקות
            </button>
          </div>
        </header>

        <div className="stats">
          <div className="stat-card">
            <span>סה"כ משימות</span>
            <strong>{todos.length}</strong>
          </div>
          <div className="stat-card">
            <span>ממתינות לביצוע</span>
            <strong>{remainingCount}</strong>
          </div>
          <div className="stat-card">
            <span>הושלמו</span>
            <strong>{completedCount}</strong>
          </div>
        </div>

        <section className="todo-panel">
          <h2>הוספת משימה חדשה</h2>

          <form onSubmit={createTodo} className="add-todo-form">
            <input
              type="text"
              placeholder="מה צריך לעשות היום?"
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
              {saving ? "מוסיפה..." : "+ הוספת משימה"}
            </button>
          </form>
        </section>

        <section className="todo-panel">
          <div className="list-heading">
            <h2>רשימת המשימות</h2>
            <span className="count-label">{remainingCount} נותרו</span>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
              <button onClick={getTodos}>נסי שוב</button>
            </div>
          )}

          {loading ? (
            <p className="empty-message">טוענת משימות...</p>
          ) : todos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">☑</div>
              <h3>הרשימה שלך עדיין ריקה</h3>
              <p>הוסיפי משימה ראשונה כדי להתחיל!</p>
            </div>
          ) : (
            <ul className="todo-list-custom">
              {todos.map(todo => (
                <li
                  key={todo.id}
                  className={`todo-item ${todo.isComplete ? "done" : ""}`}
                >
                  <label className="todo-content">
                    <input
                      type="checkbox"
                      checked={todo.isComplete}
                      onChange={e =>
                        updateCompleted(todo, e.target.checked)
                      }
                    />
                    <span className="todo-name">{todo.name}</span>
                  </label>

                  <button
                    className="delete-button"
                    onClick={() => deleteTodo(todo.id)}
                    title="מחיקת משימה"
                    aria-label={`מחיקת המשימה ${todo.name}`}
                  >
                    מחיקה
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="app-footer">
          צעד קטן בכל פעם, והמשימות מסתדרות ✓
        </footer>
      </main>
    </div>
  );
}

export default App;