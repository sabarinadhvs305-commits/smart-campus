import { GoogleGenerativeAI } from "@google/generative-ai";
import History from "../models/History.js"; // Ensure this path is correct
import Room from "../models/Room.js";       // Import Room model for campus stats
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use the fast, efficient model
const MODEL_NAME = "gemini-2.5-flash"; 

// ---------------------------------------------------------
// 1. ROOM SPECIFIC INSIGHTS (Returns JSON)
// ---------------------------------------------------------
export const generateRoomInsights = async (roomId) => {
  try {
    const logs = await History.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(50);

    if (logs.length === 0) return { recommendation: "No data available yet to analyze." };

    const summary = logs.map(log => 
      `- ${log.dayOfWeek} ${log.timestamp.toLocaleTimeString()}: ${log.occupancy}/${log.capacity}. Ghost: ${log.isGhost}`
    ).join("\n");

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
      Act as a Facility Manager. Analyze logs for Room ${roomId}:
      ${summary}

      Return strictly valid JSON (no markdown) with these keys:
      {
        "efficiency_score": "0-100%",
        "peak_time": "Day & Time",
        "recommendation": "One specific action."
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    
    return JSON.parse(text);

  } catch (error) {
    console.error("Room AI Error:", error);
    return { error: "Failed to generate room insights" };
  }
};

// ---------------------------------------------------------
// 2. CAMPUS WIDE INSIGHTS (Returns Text for Dashboard)
// ---------------------------------------------------------
export const generateCampusInsights = async () => {
  try {
    // A. Fetch Real Stats from DB
    const rooms = await Room.find({});
    const totalRooms = rooms.length;
    const totalOccupancy = rooms.reduce((sum, r) => sum + (r.liveStatus.currentOccupancy || 0), 0);
    const ghostRooms = rooms.filter(r => r.liveStatus.isGhost).map(r => r.roomId);
    
    // B. Prepare Summary for AI
    const campusSummary = {
      totalRooms,
      totalOccupancy,
      ghostRoomsCount: ghostRooms.length,
      ghostRoomIds: ghostRooms.join(", ")
    };

    // C. Prompt
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
      Act as a Smart Campus Manager. Analyze this live snapshot:
      ${JSON.stringify(campusSummary)}

      Provide 3 short, punchy bullet points (plain text, no markdown) on:
      1. Current campus utilization status.
      2. Energy waste alert (specifically mention Ghost Rooms if any).
      3. One immediate optimization tip.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error("Campus AI Error:", error);
    return "System Offline: Unable to generate campus insights.";
  }
};