import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import styles from "./Login.module.css";

interface LoginProps {
  onLogin: (token: string) => void;
  onGuest: () => void;
  sessionExpired?: boolean;
  onClearExpired?: () => void;
}

export default function Login({ onLogin, onGuest, sessionExpired, onClearExpired }: LoginProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("https://student-agenda-production.up.railway.app/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Google sign-in failed.");
          setLoading(false);
          return;
        }
        localStorage.setItem("studhub_token", data.token);
        onLogin(data.token);
        navigate("/");
      } catch {
        setError("Could not connect to backend.");
        setLoading(false);
      }
    },
    onError: () => setError("Google sign-in failed."),
  });

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (mode === "register") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch(`https://student-agenda-production.up.railway.app/auth/${mode === "login" ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      localStorage.setItem("studhub_token", data.token);
      onLogin(data.token);
      navigate("/");
    } catch {
      setError("Could not connect to backend. Make sure Flask is running.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.loadingIcon}>✦</span>
        <p className={styles.loadingText}>Signing you in...</p>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✦</span>
          <span className={styles.logoText}>StudHub</span>
        </div>

        {sessionExpired && (
          <div className={styles.expiredBanner}>
            ⚠ Your session expired — please sign in again.
            <button className={styles.expiredClose} onClick={onClearExpired}>✕</button>
          </div>
        )}

        <div className={styles.hero}>
          <h1 className={styles.heading}>
            {mode === "login" ? "Welcome back" : "Get organized today"}
          </h1>
          <p className={styles.tagline}>
            Upload a syllabus, let AI extract every deadline — your entire semester organized in seconds.
          </p>
        </div>

        <button className={styles.googleBtn} onClick={() => googleLogin()}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or continue with email</span>
          <span className={styles.dividerLine} />
        </div>

        <div className={styles.fields}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <p className={styles.forgotLink}>
            <button className={styles.switchBtn} onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </button>
          </p>

          {mode === "register" && (
            <div className={styles.field}>
              <label className={styles.label}>Confirm Password</label>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
            </div>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.submitBtn} onClick={handleSubmit}>
          {mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or</span>
          <span className={styles.dividerLine} />
        </div>

        <button className={styles.guestBtn} onClick={onGuest}>
          Continue as Guest
          <span className={styles.guestNote}>No account needed · Data resets on logout</span>
        </button>

        <p className={styles.switchText}>
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          {" "}
          <button
            className={styles.switchBtn}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
              setPassword("");
              setConfirmPassword("");
            }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}