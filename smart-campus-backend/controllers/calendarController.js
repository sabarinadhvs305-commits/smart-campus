import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { roomCalendars } from '../config/calendarMapping.js';

// 1. Get correct file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEY_PATH = path.join(__dirname, '..', 'service-account.json');

// 2. READ & FIX THE KEY MANUALLY
let auth;
try {
  // Read the file as a string
  const rawData = fs.readFileSync(KEY_PATH, 'utf-8');
  const keyData = JSON.parse(rawData);

  // ⚠️ CRITICAL FIX: Replace literal "\n" characters with actual line breaks
  // If the key is undefined, this block will catch it.
  const privateKey = keyData.private_key 
    ? keyData.private_key.replace(/\\n/g, '\n') 
    : undefined;

  if (!privateKey || !keyData.client_email) {
    throw new Error("Missing 'private_key' or 'client_email' in JSON.");
  }

  console.log("🔑 Key loaded for:", keyData.client_email);

  // 3. Initialize GoogleAuth with the FIXED credentials
  auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: keyData.client_email,
      private_key: privateKey, // Pass the sanitized key
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

} catch (err) {
  console.error("❌ CRITICAL AUTH ERROR:", err.message);
  // We don't crash the server, but calendar features won't work
}

// ---------------------------------------------------------
// FETCH SCHEDULE (Read)
// ---------------------------------------------------------
// backend/controllers/calendarController.js

export const getRoomSchedule = async (req, res) => {
  if (!auth) return res.status(500).json({ error: "Server Auth Failed" });

  const { roomId } = req.params;
  const calendarId = roomCalendars[roomId];

  if (!calendarId) return res.status(404).json({ error: "Calendar not mapped" });

  try {
    const calendar = google.calendar({ version: 'v3', auth });

    // 🔧 FIX: Set timeMin to the START of today (Midnight IST)
    // Previous code used 'new Date()' which meant "Now". 
    // So past events for today were being hidden.
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Set to 00:00:00 (Midnight)

    const nextWeek = new Date();
    nextWeek.setDate(startOfDay.getDate() + 7);

    const response = await calendar.events.list({
      calendarId,
      timeMin: startOfDay.toISOString(), // Fetch from Midnight
      timeMax: nextWeek.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    // Transform data for Frontend
    const events = response.data.items.map(event => ({
      id: event.id, // Good to have ID for keys
      title: event.summary || "Booked",
      // Handle both 'dateTime' (timed event) and 'date' (all-day event)
      start: event.start.dateTime || event.start.date, 
      end: event.end.dateTime || event.end.date,
      organizer: event.organizer?.displayName || "Faculty",
      description: event.description
    }));

    res.json(events);

  } catch (error) {
    console.error("Calendar Read Error:", error.message);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
};

// ---------------------------------------------------------
// BOOK ROOM (Write)
// ---------------------------------------------------------
// backend/controllers/calendarController.js

// backend/controllers/calendarController.js

export const bookRoom = async (req, res) => {
  const { roomId, title, startTime, endTime, teacherEmail } = req.body;
  const calendarId = roomCalendars[roomId];

  if (!calendarId) return res.status(404).json({ error: "Room calendar not found" });

  try {
    const calendar = google.calendar({ version: 'v3', auth });

    // 🔧 NUCLEAR FIX: Manually append the Indian Timezone Offset (+05:30)
    // Input from Frontend: "2026-01-16T10:00"
    // We force it to:      "2026-01-16T10:00:00+05:30"
    
    // This tells Google: "This is 10:00 AM in India. Do not convert it."
    const startIST = `${startTime}:00+05:30`;
    const endIST = `${endTime}:00+05:30`;

    console.log(`Booking ${roomId} | Forcing IST: ${startIST}`);

    const resource = {
      summary: title,
      description: `Scheduled by: ${teacherEmail}`,
      start: {
        dateTime: startIST, 
        // We do NOT set 'timeZone' here because the offset (+05:30) already defines it strictly.
      },
      end: {
        dateTime: endIST,
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      resource,
    });

    res.json({ success: true, link: response.data.htmlLink });

  } catch (error) {
    console.error("Booking Error:", error.message);
    res.status(500).json({ error: "Booking Failed: " + error.message });
  }
};