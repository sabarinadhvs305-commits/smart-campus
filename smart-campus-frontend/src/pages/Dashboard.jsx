import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClassroomCard from "../components/ClassroomCard";
import axios from "axios";
import socketService from "../services/socket.js";
import { auth } from "../services/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Dashboard({ role, onLogout }) {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // AI State
  const [insight, setInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // 1️⃣ Auth & Initial Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setError("User not authenticated.");
        setLoading(false);
        return;
      }
      setUser(currentUser);
      fetchRooms(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchRooms = async (currentUser) => {
    try {
      const token = await currentUser.getIdToken();
      const res = await axios.get("http://localhost:5000/api/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setError("Could not load classroom data.");
      setLoading(false);
    }
  };

  // 2️⃣ WebSocket Updates
  useEffect(() => {
    const socket = socketService.getSocket();
    const handleUpdate = (data) => {
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.roomId === data.roomId) {
            return {
              ...room,
              liveStatus: {
                ...room.liveStatus,
                currentOccupancy: data.occupancy,
                isGhost: data.isGhost,
              },
              capacity: data.capacity || room.capacity,
            };
          }
          return room;
        })
      );
    };
    socket.on("room_update", handleUpdate);
    return () => socket.off("room_update", handleUpdate);
  }, []);

  // 3️⃣ AI Insight Fetch (Admin Only)
  useEffect(() => {
    if (role === "admin") {
      fetchAI();
    }
  }, [role]);

  const fetchAI = async () => {
    setLoadingAI(true);
    try {
      // NOTE: Make sure server.js mounts analyticsRoutes at /api/analytics
      const res = await axios.get("http://localhost:5000/api/analytics/dashboard");
      setInsight(res.data.insight);
    } catch (err) {
      console.error("AI Error", err);
    } finally {
      setLoadingAI(false);
    }
  };

  // 4️⃣ Helpers
  const getStatus = (room) => {
    if (room.liveStatus?.isGhost) return "ghost";
    const occupancy = room.liveStatus?.currentOccupancy || 0;
    const capacity = room.capacity || 50;
    if (occupancy === 0) return "available";
    if (occupancy < capacity / 2) return "partial";
    return "occupied";
  };

  const handleLogoutClick = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      console.error("Logout Error", err);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading Campus Map...</div>;
  if (error) return <div style={{ padding: "40px", color: "red", textAlign: "center" }}>{error}</div>;

  return (
    <div style={styles.page}>
      
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            Smart Campus Dashboard
            <span style={styles.roleBadge}>{role} view</span>
          </h2>
          <p style={styles.subtitle}>Real-time occupancy & AI analytics</p>
        </div>
        <button onClick={handleLogoutClick} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      {/* 🔴 GEMINI AI CARD (Admin Only) */}
      {role === "admin" && (
        <div style={styles.aiCard}>
          <div style={styles.aiHeader}>
            <span style={{ fontSize: "22px" }}>✨</span>
            <h3 style={styles.aiTitle}>Gemini Smart Insights</h3>
            {loadingAI && <span style={styles.pulse}>Analyzing...</span>}
          </div>

          <div style={styles.aiContent}>
            {loadingAI ? (
              <div style={styles.skeletonContainer}>
                <div style={styles.skeletonLine}></div>
                <div style={styles.skeletonLine}></div>
              </div>
            ) : (
              <p style={styles.aiText}>
                {insight || "Gathering campus data for analysis..."}
              </p>
            )}
          </div>

          <button onClick={fetchAI} style={styles.refreshBtn}>
            ↻ Refresh Analysis
          </button>
        </div>
      )}

      {/* ROOMS GRID */}
      <h3 style={styles.sectionTitle}>Live Classrooms</h3>
      
      {rooms.length === 0 ? (
         <p style={{color: "#666"}}>No rooms found.</p>
      ) : (
        <div style={styles.grid}>
          {rooms.map((room) => (
            <ClassroomCard
              key={room.roomId}
              room={room}
              status={getStatus(room)}
              onClick={() => navigate(`/room/${room.roomId}`)}
            />
          ))}
        </div>
      )}
      
      {/* Animation Styles */}
      <style>{`
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

// --- STYLES ---
const styles = {
  page: { padding: "30px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" },
  
  // Header
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px" },
  title: { fontSize: "28px", fontWeight: "800", color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "12px" },
  subtitle: { color: "#64748b", margin: "5px 0 0 0", fontSize: "15px" },
  roleBadge: { fontSize: "12px", background: "#e0f2fe", color: "#0284c7", padding: "4px 8px", borderRadius: "12px", textTransform: "uppercase", fontWeight: "700" },
  logoutBtn: { padding: "10px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },

  // AI Card
  aiCard: { background: "linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)", padding: "24px", borderRadius: "16px", marginBottom: "40px", border: "1px solid #bfdbfe", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" },
  aiHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" },
  aiTitle: { margin: 0, fontSize: "18px", fontWeight: "700", background: "linear-gradient(90deg, #2563eb, #9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  pulse: { fontSize: "12px", color: "#3b82f6", fontWeight: "600", animation: "pulse 1.5s infinite" },
  aiContent: { background: "rgba(255,255,255,0.7)", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" },
  aiText: { whiteSpace: "pre-line", lineHeight: "1.6", color: "#334155", fontSize: "15px", margin: 0 },
  refreshBtn: { marginTop: "15px", background: "none", border: "none", color: "#64748b", fontSize: "13px", cursor: "pointer", fontWeight: "600" },
  
  // Skeletons
  skeletonContainer: { display: "flex", flexDirection: "column", gap: "10px" },
  skeletonLine: { height: "12px", background: "#e2e8f0", borderRadius: "4px", width: "100%" },

  // Grid
  sectionTitle: { fontSize: "20px", fontWeight: "700", color: "#334155", marginBottom: "20px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" },
};