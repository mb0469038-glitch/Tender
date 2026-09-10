import { useState } from "react";
import type { FormEvent } from "react";
import { useSession } from "./SessionContext";
import "./auth.css";

export function LoginScreen() {
  const { login } = useSession();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    const result = await login(username.trim(), password);
    setIsSubmitting(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <div className="auth-login-screen">
      <form className="auth-login-card" onSubmit={submit}>
        <h1 className="auth-login-title">Tender Helping System</h1>
        <p className="auth-login-subtitle">Sign in to continue.</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-field">
          <label htmlFor="auth-username">Username</label>
          <input
            id="auth-username"
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="auth-field">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button className="auth-submit" type="submit" disabled={isSubmitting || !username || !password}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
        <p className="auth-hint">First run? Default account is admin / admin123 — change it after signing in.</p>
      </form>
    </div>
  );
}
