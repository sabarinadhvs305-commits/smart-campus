import express from 'express';
// Check your imports in analyticsRoutes.js
import { generateRoomInsights, generateCampusInsights } from '../services/geminiService.js';

const router = express.Router();

router.get('/dashboard', async (req, res) => {
  try {
    console.log("🤖 Generating Campus-wide AI insights...");
    // We call a new service function for global stats
    const insight = await generateCampusInsights(); 
    res.json({ insight });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI Failed" });
  }
});

export default router;