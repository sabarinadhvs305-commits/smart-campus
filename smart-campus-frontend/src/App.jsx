import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth"; // 1. Import signOut
import { auth } from "./services/firebase"; 
import axios from "axios";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register"; // 2. Import Register
import Dashboard from "./pages/Dashboard";
import RoomDetail from "./pages/RoomDetail";
import Analytics from "./pages/Analytics";

export default function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- 1. SESSION RESTORE (Secure) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          
          // Verify role with backend (Secure Source of Truth)
          const res = await axios.post("http://localhost:5000/api/auth/identify", { token });
          setRole(res.data.role);
          
        } catch (error) {
          console.error("Session restore failed:", error);
          setRole(null);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. LOGOUT LOGIC ---
  const handleLogout = async () => {
    await signOut(auth); // Fixed: Use modular syntax
    setRole(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <Routes>
        
        {/* Route 1: Login */}
        <Route 
          path="/login" 
          element={!role ? <Login onLogin={setRole} /> : <Navigate to="/" />} 
        />

        {/* Route 2: Register (Connected!) */}
        <Route 
          path="/register" 
          element={!role ? <Register onLogin={setRole} /> : <Navigate to="/" />} 
        />

        {/* Route 3: Dashboard (Protected) */}
        <Route
          path="/"
          element={role ? <Dashboard role={role} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Route 4: Room Detail (Protected) */}
        <Route
          path="/room/:roomId"
          element={role ? <RoomDetail role={role} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        {/* Route 5: Analytics (Admin Only) */}
        <Route
          path="/analytics"
          element={role === "admin" ? <Analytics onLogout={handleLogout} /> : <Navigate to="/" />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
        
      </Routes>
    </Router>
  );
}