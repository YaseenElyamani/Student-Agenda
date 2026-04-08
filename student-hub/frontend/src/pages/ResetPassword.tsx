import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./Login.module.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      setError("Invalid reset link.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("${import.meta.env.VITE_API_URL}/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setDone(true);
      setLoading(false);
    } catch {
      setError("Could not connect to backend.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.loadingIcon}>✦</span>
        <p className={styles.loadingText}>Resetting your password...</p>
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

        {!token ? (
          <>
            <div className={styles.hero}>
              <h1 className={styles.heading}>Invalid link</h1>
              <p className={styles.tagline}>This reset link is invalid or has already been used.</p>
            </div>
            <button className={styles.submitBtn} onClick={() => navigate("/login")}>
              Back to Sign In
            </button>
          </>
        ) : done ? (
          <>
            <div className={styles.hero}>
              <h1 className={styles.heading}>Password reset!</h1>
              <p className={styles.tagline}>
                Your password has been updated. You can now sign in with your new password.
              </p>
            </div>
            <button className={styles.submitBtn} onClick={() => navigate("/login")}>
              Sign In
            </button>
          </>
        ) : (
          <>
            <div className={styles.hero}>
              <h1 className={styles.heading}>Set new password</h1>
              <p className={styles.tagline}>Choose a strong password for your account.</p>
            </div>

            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>New Password</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                />
              </div>
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
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitBtn} onClick={handleSubmit}>
              Reset Password
            </button>
          </>
        )}
      </div>
    </div>
  );
}