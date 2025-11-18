require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const supabase = require('./utils/supabaseClient');
const deviceRoutes = require('./routes/devices');

const app = express();
const server = http.createServer(app);

// Updated: Add CORS options for Socket.io
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",  // Allow your React app's origin
    methods: ["GET", "POST"],         // Allow necessary methods
    credentials: true                 // If you need cookies/auth headers (optional)
  }
});

app.use(cors());  // Keep this for Express APIs
app.use(express.json());
app.use('/api/devices', deviceRoutes);

// Real-time via Socket.io (for live updates)
io.on('connection', (socket) => {
  console.log('Client connected');
  // supabase.from('devices').on('INSERT', (payload) => {
  //   socket.emit('deviceUpdate', payload.new);
  // }).subscribe();
});

server.listen(3001, () => console.log('Backend on port 3001'));
require('./proxy');  // Load proxy