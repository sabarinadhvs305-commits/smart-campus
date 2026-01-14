/**
 * 📅 MOCK Calendar Service
 * Use this during development to test without Google Cloud keys.
 */

// 1️⃣ HELPER: Create a date relative to "Right Now"
// This ensures that whenever you run the demo, there is always a class active.
const getRelativeDate = (minutesOffset) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesOffset);
  return date.toISOString();
};

/**
 * 🕵️‍♂️ GET SCHEDULE (MOCK)
 * Returns a fake list of bookings for the requested room.
 */
export const getRoomSchedule = async (calendarId) => {
  console.log(`⚠️ [MOCK] Fetching schedule for Calendar: ${calendarId}`);

  // Simulating network delay (0.5s)
  await new Promise(resolve => setTimeout(resolve, 500));

  // RETURN FAKE EVENTS
  return [
    {
      summary: "Completed Class (History)",
      start: getRelativeDate(-120), // 2 hours ago
      end: getRelativeDate(-60),    // 1 hour ago
      organizer: "prof.doe@university.edu"
    },
    {
      // 🚨 CRITICAL: This event is happening RIGHT NOW
      // It allows you to test "Ghost Booking" logic if the camera sees 0 people.
      summary: "CS101 - Intro to AI (Live)",
      start: getRelativeDate(-15),  // Started 15 mins ago
      end: getRelativeDate(45),     // Ends in 45 mins
      organizer: "dr.smith@university.edu"
    },
    {
      summary: "Future Workshop (Robotics)",
      start: getRelativeDate(60),   // Starts in 1 hour
      end: getRelativeDate(120),
      organizer: "lab.admin@university.edu"
    }
  ];
};

/**
 * 📝 BOOK ROOM (MOCK)
 * Simulates a successful booking.
 */
export const bookRoom = async (calendarId, teacherEmail, subject, startTime, endTime) => {
  console.log(`⚠️ [MOCK] Booking Room: ${calendarId}`);
  console.log(`   Event: ${subject} by ${teacherEmail}`);
  console.log(`   Time: ${startTime} to ${endTime}`);

  // Simulate delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
    status: "confirmed",
    htmlLink: "https://calendar.google.com/mock-link-123",
    summary: subject
  };
};