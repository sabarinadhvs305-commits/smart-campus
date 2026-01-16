import express from 'express'
import admin from "../config/firebaseAdmin.js"; // Your firebase config

// 👇 ADD YOUR ADMIN EMAIL HERE
const ADMIN_EMAILS = ["jayasankarmenonv@gmail.com"];
const  router = express.Router()
router.post("/identify", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token missing" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { email } = decodedToken;
    const role = ADMIN_EMAILS.includes(email) ? "admin" : "student";
    
    console.log(`Verified: ${email} as ${role}`);
    res.json({ role, email });

  } catch (error) {
    console.error("Auth Error:", error.message);
    res.status(401).json({ error: "Invalid Token" });
  }
});

 export default router