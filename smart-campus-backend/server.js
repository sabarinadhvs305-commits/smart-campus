import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app from './app.js'; // 👈 Import the Express app

// Config Imports
import connectDB from './config/db.js';
import { connectRedis } from './config/redis.js';

// Load Config
dotenv.config();
const PORT = process.env.PORT || 5000;

// 1️⃣ Connect to Services (Database & Redis)
connectDB();
connectRedis();

// 2️⃣ Create HTTP Server
// Express cannot handle WebSockets natively, so we wrap it in a raw Node HTTP server.
const server = http.createServer(app);

// 3️⃣ Attach Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // React Frontend
    methods: ["GET", "POST"]
  }
});

// 4️⃣ The Bridge: Make 'io' available in Controllers
// This is critical. It allows controllers (app.js) to access the 'io' instance 
// created here (server.js) using: const io = req.app.get('socketio');
app.set('socketio', io);

// 5️⃣ Global Socket Event Listeners
io.on('connection', (socket) => {
  console.log(`🔌 Client Connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`❌ Client Disconnected: ${socket.id}`);
  });
});

// 6️⃣ Start the Server
server.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 WebSocket Server ready`);
});