import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import socketService from "../services/socket";

export default function RoomDetail({ role }) {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [room, setRoom] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking Form State
  const [showBooking, setShowBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    title: "",
    startTime: "",
    endTime: ""
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  // --- 1. FETCH DATA (Room + Schedule) ---
  const fetchRoomData = async (forceRefresh = false) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken(forceRefresh);
        
        // Parallel requests for speed
        const [roomRes, scheduleRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/rooms/${roomId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:5000/api/rooms/${roomId}/schedule`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setRoom(roomRes.data);
        setSchedule(scheduleRes.data);
        setError(null);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Could not load room data.");
      }
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchRoomData();
      } else {
        setError("Please login.");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [roomId]);

  // --- 2. WEBSOCKET (Live Updates) ---
  useEffect(() => {
    const socket = socketService.getSocket();
    
    const handleRoomUpdate = (data) => {
      // Only update if the message matches the current room ID
      if (data.roomId === roomId) {
        console.log("⚡ Live Room Update:", data);
        setRoom((prev) => 
          prev ? { ...prev, liveStatus: { ...prev.liveStatus, ...data } } : null
        );
      }
    };

    socket.on("room_update", handleRoomUpdate);
    return () => socket.off("room_update", handleRoomUpdate);
  }, [roomId]);

  // --- 3. HANDLE BOOKING (Optimistic Update) ---
  // src/pages/RoomDetail.jsx

// src/pages/RoomDetail.jsx

const handleBookSubmit = async (e) => {
  e.preventDefault();
  setBookingLoading(true);

  try {
    const user = auth.currentUser;
    const token = await user.getIdToken();

    // 1. Send Booking to Backend
    await axios.post(`http://localhost:5000/api/rooms/${roomId}/book`, {
      roomId,
      title: bookingData.title,
      startTime: bookingData.startTime, 
      endTime: bookingData.endTime,
      teacherEmail: user.email 
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    alert("✅ Room Booked Successfully!");

    // 2. OPTIMISTIC UPDATE (Show immediately)
    const newEvent = {
      title: bookingData.title,
      start: bookingData.startTime,
      end: bookingData.endTime,
      organizer: "You (Just now)"
    };
    
    setSchedule(prev => {
      const updated = [...prev, newEvent];
      return updated.sort((a, b) => new Date(a.start) - new Date(b.start));
    });

    setShowBooking(false);
    setBookingData({ title: "", startTime: "", endTime: "" });
    
    // 3. 🔧 FIX: WAIT 3 SECONDS before re-fetching
    // This gives Google Calendar API time to update its database
    setTimeout(() => {
      console.log("Fetching fresh data from Google...");
      fetchRoomData(); 
    }, 3000); 

  } catch (err) {
    console.error("Booking failed:", err);
    alert("Booking Failed: " + (err.response?.data?.error || err.message));
  } finally {
    setBookingLoading(false);
  }
};
  // --- HELPERS ---
  const getNextClass = () => {
    if (!schedule || schedule.length === 0) return "None Scheduled";
    const now = new Date();
    // Find first event that ends AFTER now
    const nextEvent = schedule.find(evt => new Date(evt.end) > now);
    
    if (!nextEvent) return "No more classes today";
    
    const timeStr = new Date(nextEvent.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    return `${timeStr} (${nextEvent.title})`;
  };

  if (loading) return <div style={styles.center}><div style={styles.loader}></div></div>;
  if (error) return <div style={styles.center}><div style={styles.errorCard}>{error}</div></div>;
  if (!room) return null; 

  // Derived Values
  const occupancy = room.liveStatus?.currentOccupancy || 0;
  const capacity = room.capacity || 1; 
  const percentage = Math.min(100, Math.round((occupancy / capacity) * 100));
  const isGhost = room.liveStatus?.isGhost;

  // Progress Bar Color Logic
  let progressColor = "#22c55e"; // Green
  if (percentage > 50) progressColor = "#eab308"; // Yellow
  if (percentage > 80) progressColor = "#ef4444"; // Red

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* HEADER SECTION */}
        <div style={styles.header}>
          <div>
            <button onClick={() => navigate("/")} style={styles.backLink}>← Back to Dashboard</button>
            <h1 style={styles.title}>{room.roomId}</h1>
            <p style={styles.subtitle}>Building C • Floor 2 • Smart Classroom</p>
          </div>
          
          <div style={styles.headerActions}>
            {/* Admin Booking Button */}
            {role === "admin" && (
              <button 
                onClick={() => setShowBooking(!showBooking)} 
                style={styles.bookBtn}
              >
                {showBooking ? "Close Form" : "+ Schedule Class"}
              </button>
            )}
            
            {/* Live Status Badge */}
            <div style={{
              ...styles.badge, 
              backgroundColor: isGhost ? "#f3f4f6" : "#dcfce7", 
              color: isGhost ? "#6b7280" : "#15803d",
              border: `1px solid ${isGhost ? "#e5e7eb" : "#bbf7d0"}`
            }}>
              <span style={{
                ...styles.dot, 
                backgroundColor: isGhost ? "#9ca3af" : "#22c55e",
                animation: isGhost ? "none" : "pulse 2s infinite"
              }}></span>
              {isGhost ? "Ghost Mode (Inactive)" : "Live Active"}
            </div>
          </div>
        </div>

        {/* ADMIN BOOKING FORM */}
        {showBooking && (
          <div style={styles.bookingCard}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
              <h3 style={styles.sectionTitleNoMargin}>📅 New Booking</h3>
              <button onClick={() => setShowBooking(false)} style={styles.closeBtn}>✕</button>
            </div>
            
            <form onSubmit={handleBookSubmit} style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Event Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. CS101 Lecture" 
                  required
                  style={styles.input}
                  value={bookingData.title}
                  onChange={e => setBookingData({...bookingData, title: e.target.value})}
                />
              </div>
              
              <div style={styles.dateRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    style={styles.input}
                    value={bookingData.startTime}
                    onChange={e => setBookingData({...bookingData, startTime: e.target.value})}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>End Time</label>
                  <input 
                    type="datetime-local" 
                    required
                    style={styles.input}
                    value={bookingData.endTime}
                    onChange={e => setBookingData({...bookingData, endTime: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" disabled={bookingLoading} style={styles.submitBtn}>
                {bookingLoading ? "Processing..." : "Confirm Booking"}
              </button>
            </form>
          </div>
        )}

        {/* INFO GRID */}
        <div style={styles.grid}>
          
          {/* Card 1: Live Occupancy */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Live Occupancy</h2>
            <div style={{ display: "flex", alignItems: "baseline", marginBottom: "15px" }}>
              <span style={styles.bigNumber}>{occupancy}</span>
              <span style={styles.smallNumber}>/ {capacity}</span>
            </div>
            
            <div style={styles.progressBarBg}>
              <div style={{
                ...styles.progressBarFill, 
                width: `${percentage}%`, 
                backgroundColor: progressColor
              }}></div>
            </div>
            
            <p style={styles.progressText}>
              {percentage}% full. {Math.max(0, capacity - occupancy)} seats remaining.
            </p>
          </div>

          {/* Card 2: Environment Details */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Room Details</h2>
            
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Last Updated</span>
              <span style={styles.detailValue}>Real-time (WebSocket)</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Sensor Status</span>
              <span style={{...styles.detailValue, color: "#16a34a", display: "flex", alignItems: "center", gap: "6px"}}>
                <span style={styles.onlineDot}></span> Online
              </span>
            </div>
            <div style={{...styles.detailRow, borderBottom: "none"}}>
              <span style={styles.detailLabel}>Next Class</span>
              <span style={styles.detailValue}>{getNextClass()}</span>
            </div>
          </div>

        </div>

        {/* SCHEDULE LIST */}
        <div style={{ marginTop: "40px" }}>
          <h2 style={styles.sectionTitle}>Today's Schedule</h2>
          <div style={styles.scheduleList}>
            {schedule.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No classes scheduled for today.</p>
              </div>
            ) : (
              schedule.map((event, index) => {
                const start = new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const end = new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={index} style={styles.scheduleItem}>
                    <div style={styles.timeBox}>
                      <span style={styles.timeStart}>{start}</span>
                      <span style={styles.timeEnd}>{end}</span>
                    </div>
                    <div style={styles.eventInfo}>
                      <h3 style={styles.eventTitle}>{event.title}</h3>
                      <p style={styles.eventDesc}>
                        <span style={{fontWeight:'500'}}>Organizer:</span> {event.organizer}
                      </p>
                    </div>
                    <div style={styles.statusIndicator}></div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// --- PROFESSIONAL CSS STYLES ---
const styles = {
  page: { minHeight: "100vh", padding: "40px 20px", background: "#f9fafb", fontFamily: "'Segoe UI', sans-serif" },
  container: { maxWidth: "900px", margin: "0 auto" },
  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background:"#f9fafb" },
  loader: { width: "40px", height: "40px", border: "4px solid #e5e7eb", borderTop: "4px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite" },
  errorCard: { background: "white", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", color: "#ef4444", fontWeight: "600" },

  // Header & Navigation
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px", flexWrap: "wrap", gap: "20px" },
  headerActions: { display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" },
  backLink: { background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "14px", fontWeight: "600", padding: 0, marginBottom: "5px" },
  title: { fontSize: "36px", fontWeight: "800", color: "#111827", margin: "0", letterSpacing: "-0.5px" },
  subtitle: { color: "#6b7280", fontSize: "16px", marginTop: "4px" },
  
  // Status Badge
  badge: { padding: "8px 16px", borderRadius: "30px", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
  dot: { width: "8px", height: "8px", borderRadius: "50%" },

  // Interactive Buttons
  bookBtn: { backgroundColor: "#2563eb", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)" },
  closeBtn: { background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" },
  submitBtn: { backgroundColor: "#0284c7", color: "white", padding: "12px", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px", fontSize: "15px", width: "100%" },

  // Booking Form Panel
  bookingCard: { backgroundColor: "white", padding: "25px", borderRadius: "16px", marginBottom: "30px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" },
  sectionTitleNoMargin: { fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 },
  formGrid: { display: "flex", flexDirection: "column", gap: "15px" },
  dateRow: { display: "flex", gap: "20px", flexDirection: "row", flexWrap: "wrap" },
  formGroup: { flex: 1, display: "flex", flexDirection: "column", gap: "6px", minWidth: "200px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "15px", outline: "none", transition: "border 0.2s", width: "100%", boxSizing: "border-box" },

  // Layout Grid
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" },

  // Data Cards
  card: { background: "white", padding: "30px", borderRadius: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #f3f4f6" },
  cardTitle: { fontSize: "18px", fontWeight: "600", color: "#374151", marginBottom: "20px", marginTop: 0 },
  
  // Occupancy Visuals
  bigNumber: { fontSize: "60px", fontWeight: "800", color: "#111827", lineHeight: 1 },
  smallNumber: { fontSize: "24px", color: "#9ca3af", marginLeft: "10px", fontWeight: "500" },
  progressBarBg: { width: "100%", height: "12px", background: "#f3f4f6", borderRadius: "6px", overflow: "hidden", marginTop: "10px" },
  progressBarFill: { height: "100%", transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)" },
  progressText: { fontSize: "14px", color: "#6b7280", marginTop: "12px" },

  // Detail Rows
  detailRow: { display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #f3f4f6", alignItems: "center" },
  detailLabel: { color: "#6b7280", fontSize: "15px" },
  detailValue: { fontWeight: "500", color: "#1f2937", fontSize: "15px" },
  onlineDot: { width: "8px", height: "8px", backgroundColor: "#16a34a", borderRadius: "50%" },

  // Schedule List & Items
  sectionTitle: { fontSize: "22px", fontWeight: "700", color: "#111827", marginBottom: "20px" },
  scheduleList: { display: "flex", flexDirection: "column", gap: "16px" },
  emptyState: { padding: "40px", textAlign: "center", background: "white", borderRadius: "12px", color: "#9ca3af", border: "1px dashed #e5e7eb" },
  
  scheduleItem: { 
    display: "flex", alignItems: "center", background: "white", padding: "24px", 
    borderRadius: "12px", border: "1px solid #f1f5f9", boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    transition: "transform 0.2s", cursor: "default"
  },
  timeBox: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: "90px", borderRight: "2px solid #f1f5f9", paddingRight: "20px", marginRight: "20px" },
  timeStart: { fontWeight: "700", color: "#1e293b", fontSize: "16px" },
  timeEnd: { fontSize: "13px", color: "#94a3b8", marginTop: "2px" },
  eventInfo: { flexGrow: 1 },
  eventTitle: { margin: "0 0 6px 0", fontSize: "17px", color: "#0f172a", fontWeight: "600" },
  eventDesc: { margin: 0, fontSize: "14px", color: "#64748b" },
  statusIndicator: { width: "4px", height: "40px", backgroundColor: "#3b82f6", borderRadius: "2px" }
};