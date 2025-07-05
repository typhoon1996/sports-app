import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import sequelize, { testConnection } from './config/database';
import { defineAssociations } from './models/associations';
import { seedSports } from './utils/seedDatabase';
import authRoutes from './routes/auth';
import sportsRoutes from './routes/sports';
import matchesRoutes from './routes/matches';
import ratingsRoutes from './routes/ratings';
import { setupSocketHandlers } from './socket/index';
import { performanceMiddleware, getHealthMetrics } from './middleware/performance';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Add your production domain
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(performanceMiddleware);
}

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Sports App API Server Running!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  const healthMetrics = getHealthMetrics();
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus ? 'connected' : 'disconnected',
    ...healthMetrics
  });
});

// Performance metrics endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/metrics', (req, res) => {
    res.json(getHealthMetrics());
  });
}

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/ratings', ratingsRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  // Don't send stack trace in production
  const errorResponse: any = {
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(500).json(errorResponse);
});

// Initialize server and Socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
  }
});

setupSocketHandlers(io);

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Define model associations
    defineAssociations();
    
    // Sync database models (be careful with this in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // Don't alter tables, just sync
      console.log('📊 Database models synchronized');
      
      // Seed initial data
      await seedSports();
    }
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
