import express from 'express';
import { 
  updateRoomStatus, 
  getAllRooms, 
  getRoomDetails 
} from '../controllers/roomController.js';
import { verifyFirebaseToken } from '../middlewares/authMiddleware.js';
import { getRoomSchedule, bookRoom } from '../controllers/calendarController.js';

const router = express.Router();

// 🟢 PUBLIC ROUTES

// Get all rooms (for Dashboard)
router.get('/', verifyFirebaseToken,getAllRooms);

// Get specific room details + schedule
router.get('/:id',verifyFirebaseToken, getRoomDetails);

// 🔒 INTERNAL ROUTE (Used by Python AI)
// In a real app, you might add middleware like 'verifyAPIKey' here
router.post('/update', updateRoomStatus);

router.get("/:roomId/schedule", verifyFirebaseToken, getRoomSchedule);

// 3. POST Booking (Admin Only)
router.post("/:roomId/book", verifyFirebaseToken, async (req, res, next) => {
  const ADMIN_EMAILS = ["jayasankarmenonv@gmail.com"];
  
  if (!ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ error: "Admins only." });
  }
  next();
}, bookRoom);

export default router;