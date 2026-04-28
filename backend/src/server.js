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
const logger = require('./config/logger');
const errorHandler = require('./middleware/error');
const seedAdmin = require('./config/seedAdmin');

// Import routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const staffRoutes = require('./routes/staff');

// Initialize express
const app = express();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Connect to MongoDB
connectDB();

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
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // In production, add your frontend domain
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:5173',
      'http://localhost:8080',
      process.env.FRONTEND_URL // This will be your Vercel URL
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

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
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
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
    origin: process.env.NODE_ENV === 'development' ? '*' : process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
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
reportController.setIO(io);

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

server.listen(PORT, async () => {
  logger.info(`
🚀 Samvad Civic Connect Backend Server Started!
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