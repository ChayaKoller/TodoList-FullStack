
import React, { useState } from "react";
import axios from "axios";
import "./Auth.css";

export default function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = {
        userName: userName.trim(),
        password: password
      };

      if (isRegister) {
        // הרשמת משתמש חדש
        await axios.post("/auth/register", data);

        // מעבר למסך התחברות
        setIsRegister(false);
        setPassword("");

        // הודעת הצלחה
        setSuccess("נרשמת בהצלחה! כעת ניתן להתחבר.");
      } else {
        // התחברות משתמש קיים
        const response = await axios.post("/auth/login", data);

        // העברת הטוקן ל-App
        onLogin(response.data.token);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setError("שם המשתמש כבר קיים. בחרי שם אחר.");
      } else if (err.response?.status === 401) {
        setError("שם משתמש או סיסמה שגויים.");
      } else if (err.response?.status === 400) {
        setError("הפרטים אינם תקינים. בדקי את שם המשתמש והסיסמה.");
      } else if (!err.response) {
        setError("לא ניתן להתחבר לשרת. בדקי שהשרת פועל.");
      } else {
        setError("אירעה שגיאה. נסי שוב.");
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setIsRegister((prev) => !prev);
    setError("");
    setSuccess("");
    setPassword("");
  }

  return (
    <main className="auth-page" dir="rtl">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>
          {isRegister ? "יצירת חשבון חדש" : "התחברות"}
        </h1>

        <p>ברוכה הבאה למערכת ניהול המשימות</p>

        {success && (
          <p className="auth-success" role="status">
            ✓ {success}
          </p>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="username">
          שם משתמש
        </label>

        <input
          id="username"
          type="text"
          placeholder="הכניסי שם משתמש"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          required
          maxLength={100}
          autoComplete="username"
          disabled={loading}
        />

        <label htmlFor="password">
          סיסמה
        </label>

        <input
          id="password"
          type="password"
          placeholder="הכניסי סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={isRegister ? 8 : undefined}
          autoComplete={
            isRegister ? "new-password" : "current-password"
          }
          disabled={loading}
        />

        {isRegister && (
          <small className="password-hint">
            הסיסמה חייבת להכיל לפחות 8 תווים.
          </small>
        )}

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "נא להמתין..."
            : isRegister
              ? "הרשמה"
              : "התחברות"}
        </button>

        <button
          type="button"
          className="auth-switch"
          onClick={switchMode}
          disabled={loading}
        >
          {isRegister
            ? "כבר יש לך חשבון? התחברי"
            : "אין לך חשבון? הירשמי"}
        </button>
      </form>
    </main>
  );
}
