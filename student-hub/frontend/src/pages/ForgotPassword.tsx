import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:5001/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      setSent(true);
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
        <p className={styles.loadingText}>Sending reset link...</p>
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

        {sent ? (
          <>
            <div className={styles.hero}>
              <h1 className={styles.heading}>Check your email</h1>
              <p className={styles.tagline}>
                If an account exists for <strong style={{ color: "#fff" }}>{email}</strong>, 
                a password reset link has been sent. Check your inbox and spam folder.
              </p>
            </div>
            <button className={styles.submitBtn} onClick={() => navigate("/login")}>
              Back to Sign In
            </button>
          </>
        ) : (
          <>
            <div className={styles.hero}>
              <h1 className={styles.heading}>Forgot password?</h1>
              <p className={styles.tagline}>
                Enter your email and we'll send you a link to reset your password.
              </p>
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
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitBtn} onClick={handleSubmit}>
              Send Reset Link
            </button>

            <p className={styles.switchText}>
              <button className={styles.switchBtn} onClick={() => navigate("/login")}>
                ← Back to Sign In
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}