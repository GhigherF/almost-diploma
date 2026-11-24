require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Pool } = require('pg');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { WebSocketServer } = require('ws');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'microblog',
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 300 * 1024 * 1024 } });

function handleMulterError(err, req, res, next) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Файл слишком большой. Максимальный размер — 300 МБ.' });
  }
  next(err);
}

function resolveFileType(mime) {
  if (mime === 'image/gif') return 'gif';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('application/')) return 'document';
  return 'other';
}

// WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
const roomClients = new Map();

function broadcast(postId, data) {
  const room = roomClients.get(postId);
  if (!room) return;
  const msg = JSON.stringify(data);
  room.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/ws?', ''));
  const postId = parseInt(params.get('postId'));
  if (!postId) { ws.close(); return; }

  if (!roomClients.has(postId)) roomClients.set(postId, new Set());
  roomClients.get(postId).add(ws);

  ws.on('close', () => {
    const room = roomClients.get(postId);
    if (room) { room.delete(ws); if (!room.size) roomClients.delete(postId); }
  });
});

// Routes
const authRoutes = require('./routes/authRoutes')(pool);
const postsRoutes = require('./routes/postsRoutes')(pool, upload, handleMulterError, resolveFileType);
const usersRoutes = require('./routes/usersRoutes')(pool, upload, handleMulterError);
const commentsRoutes = require('./routes/commentsRoutes')(pool, broadcast);
const commentDeleteRoutes = require('./routes/commentDeleteRoutes')(pool, broadcast);
const likesRoutes = require('./routes/likesRoutes')(pool, broadcast);
const viewsRoutes = require('./routes/viewsRoutes')(pool, broadcast);
const notificationsRoutes = require('./routes/notificationsRoutes')(pool);
const emailRoutes = require('./routes/emailRoutes')(pool);

app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);
app.use('/posts', viewsRoutes);
app.use('/posts', commentsRoutes);
app.use('/comments', commentDeleteRoutes);
app.use('/', likesRoutes);
app.use('/users', usersRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/email', emailRoutes);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend запущен на порту ${PORT}`));

module.exports = { app, server, pool };
