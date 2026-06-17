const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

// Load env vars
require('dotenv').config();

// Import config
const connectDB = require('./config/database');
const { isDatabaseConnected } = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/error');
const seedAdmin = require('./config/seedAdmin');
const { corsOriginCallback, socketCorsOrigin } = require('./config/cors');

// Import routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const staffRoutes = require('./routes/staff');

// Initialize express
const app = express();

// Render/Heroku/nginx sit behind a reverse proxy — required for rate-limit + real IPs
app.set('trust proxy', 1);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Connect to MongoDB (must succeed in production)
connectDB().catch((error) => {
  logger.error(`Database startup failed: ${error.message}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: corsOriginCallback,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbConnected = isDatabaseConnected();
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? 'Server is healthy' : 'Database not connected',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasMongoUri: Boolean(process.env.MONGODB_URI),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/staff', staffRoutes);

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development' ? '*' : socketCorsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('./models/User');
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return next(new Error('Invalid user'));
    }
    
    socket.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.user.email} (${socket.id})`);
  
  // Join user-specific room
  socket.join(`user_${socket.user.id}`);
  
  // Join role-based rooms
  if (socket.user.role === 'admin' || socket.user.role === 'staff') {
    socket.join('staff_room');
  }
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.user.email}`);
  });
});

// Make io available to controllers
const reportController = require('./controllers/reportController');
const notificationService = require('./services/notificationService');
reportController.setIO(io);
notificationService.setIO(io);

// Export io for use in other modules
module.exports.io = io;

// Seed admin user after database connection
const seedAdminOnStartup = async () => {
  try {
    await seedAdmin();
  } catch (error) {
    logger.error(`Admin seeding failed: ${error.message}`);
  }
};

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Stop the existing process or set a different PORT in backend/.env.`);
    process.exit(1);
  }

  logger.error(`Server error: ${err.message}`);
  process.exit(1);
});

server.listen(PORT, async () => {
  logger.info(`
🚀 Civiconnect Backend Server Started!
📍 Environment: ${process.env.NODE_ENV}
🔗 Port: ${PORT}
📊 MongoDB: Connected
🛡️  Security: Enabled
📁 Uploads: /api/uploads
⚡ Health Check: /health
🔌 Socket.io: Enabled
  `);
  
  // Seed admin after server starts
  await seedAdminOnStartup();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = { app, server, io };
