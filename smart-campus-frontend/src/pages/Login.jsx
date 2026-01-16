import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../services/firebase"; 
import axios from "axios"; 
import { Link } from "react-router-dom"; 

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- LOGIC: RACE CONDITION FIXED ---
  const verifyWithBackend = async (user) => {
    try {
      const token = await user.getIdToken();

      // 1. Send to Backend
      const response = await axios.post("http://localhost:5000/api/auth/identify", { 
        token 
      });

      const { role } = response.data;
      console.log("Backend Verified. Role:", role);

      // 2. UPDATE STATE ONLY
      // removing navigate("/") prevents the race condition.
      // App.jsx detects the change and redirects automatically.
      onLogin(role); 

    } catch (error) {
      console.error("Backend connection failed:", error);
      alert("Login failed: Could not verify role.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await verifyWithBackend(userCredential.user);
    } catch (error) {
      console.error(error);
      alert("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await verifyWithBackend(result.user);
    } catch (error) {
      console.error("Google Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Log in to Smart Room Tracker</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.primaryButton, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Verifying..." : "Log In"}
          </button>
        </form>

        <div style={styles.dividerContainer}>
          <div style={styles.dividerLine}></div>
          <span style={styles.dividerText}>OR</span>
          <div style={styles.dividerLine}></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ ...styles.googleButton, opacity: loading ? 0.7 : 1 }}
        >
          {/* SVG for Google Icon */}
          <svg style={{ width: "20px", height: "20px", marginRight: "10px" }} viewBox="0 0 24 24">
             <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
             <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
             <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" />
             <path fill="#EA4335" d="M12 4.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span style={{ fontWeight: "500" }}>Sign in with Google</span>
        </button>

        <div style={styles.footer}>
          <span style={{ color: "#4b5563" }}>Don't have an account? </span>
          <Link to="/register" style={styles.link}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- STANDARD CSS STYLES ---
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // The gradient background
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    width: "380px",
    padding: "32px",
    borderRadius: "16px",
    // Glassmorphism effect
    backgroundColor: "rgba(255, 255, 255, 0.85)", 
    backdropFilter: "blur(12px)",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
    color: "#1f2937",
    marginBottom: "4px",
    marginTop: 0,
  },
  subtitle: {
    textAlign: "center",
    color: "#4b5563",
    marginBottom: "24px",
    marginTop: 0,
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box", // Important for padding
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#2563eb", // Blue-600
    color: "white",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    marginTop: "8px",
  },
  dividerContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "20px 0",
  },
  dividerLine: {
    flexGrow: 1,
    height: "1px",
    backgroundColor: "#d1d5db",
  },
  dividerText: {
    color: "#9ca3af",
    fontSize: "12px",
  },
  googleButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    border: "1px solid #d1d5db",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    color: "#374151",
    fontSize: "14px",
  },
  footer: {
    marginTop: "16px",
    textAlign: "center",
    fontSize: "14px",
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
    textDecoration: "none",
  }
};