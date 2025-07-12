import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import express from "express";
import cors from 'cors';
import morgan from 'morgan';
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
import notificationsRoutes from './routes/notifications';
import friendshipsRoutes from './routes/friendships';
import adminRoutes from './routes/admin';
import reportsRoutes from './routes/reports';
import logger from './config/logger';
import swaggerOptions from '../swaggerDef'; // Assuming swaggerDef.js is in the backend directory
import { ApiError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError } from './utils/errors';
import { setupSocketHandlers } from './socket/index';
import { Event } from '@sentry/node';
import { performanceMiddleware, getHealthMetrics } from './middleware/performance';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Sentry Initialization must occur before the first handler in the pipeline
if (process.env.SENTRY_DSN) {
 Sentry.init({
 dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  // We recommend adjusting this value in production, or using tracesSampler
  // for finer-grained control

    tracesSampleRate: 1.0, // Adjust this value in production
    beforeSend(event: Event) {
      // Check if it's a 404 error and filter it out
      if (event.request && event.request.status === 404) {
        return null;
      }
      // You can add other filtering logic here based on event data
      // For example, filter out specific error messages or types

      // If you want to send the event, return it
 return event;
    },
});

const app = express();
const PORT = process.env.PORT || 3001;

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

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

// Request logging middleware
// Use 'combined' format for comprehensive logs
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

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

// Swagger API Documentation
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/friendships', friendshipsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error handler:', err);

 if (res.headersSent) {
 return next(err);
 }

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
      logger.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }
    
    // Define model associations
    defineAssociations();
    
    // Sync database models (use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false }); // Don't alter tables, just sync
      logger.info('📊 Database models synchronized');
      
      // Seed initial data
      await seedSports();
    }
    
    // Start server
    server.listen(PORT, () => { 
 logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Received SIGINT. Graceful shutdown...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('🛑 Received SIGTERM. Graceful shutdown...');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();

export default app;
export { io };
