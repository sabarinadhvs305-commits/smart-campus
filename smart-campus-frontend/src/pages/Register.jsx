import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase"; 
import axios from "axios"; 
import { Link } from "react-router-dom"; 

export default function Register({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // --- LOGIC: CREATE & VERIFY ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create User in Firebase
      // (This automatically signs them in on the Firebase side)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase Account Created:", user.email);

      // 2. Add their Name
      await updateProfile(user, { displayName: name });

      // 3. Get Role from Backend
      // We force a token refresh to ensure everything is synced
      const token = await user.getIdToken(true);

      const response = await axios.post("http://localhost:5000/api/auth/identify", { 
        token 
      });

      const { role } = response.data;
      console.log("Backend Assigned Role:", role);

      // 4. Update App State
      // This triggers the redirect to Dashboard
      onLogin(role); 

    } catch (error) {
      console.error("Registration Failed:", error);
      
      let msg = "Could not register.";
      if (error.code === "auth/email-already-in-use") msg = "This email is already registered. Please Login.";
      if (error.code === "auth/weak-password") msg = "Password must be at least 6 characters.";
      if (error.response) msg = "Server Error: " + (error.response.data.error || "Unknown");
      
      alert(msg);
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Join Smart Room Tracker</p>

        <form onSubmit={handleRegister} style={styles.form}>
          <input
            type="text"
            placeholder="Full Name"
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
            placeholder="Password (min 6 chars)"
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
            {loading ? "Creating Profile..." : "Sign Up"}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={{ color: "#4b5563" }}>Already have an account? </span>
          <Link to="/login" style={styles.link}>
            Log In
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
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    width: "380px",
    padding: "32px",
    borderRadius: "16px",
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
    boxSizing: "border-box", 
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "white",
    padding: "10px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    marginTop: "8px",
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
    fontSize: "14px",
  },
  link: {
    color: "#2563eb",
    fontWeight: "600",
    textDecoration: "none",
  }
};