import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { config } from './config/env';
import { verifyDatabaseConnection, closeDatabasePool } from './config/database';
import { applySecurityMiddleware } from './middleware/security';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRouter from './routes/index';
import { logger } from './utils/logger';

async function bootstrap() {
  logger.info('====================================================', 'Bootstrap');
  logger.info(`Starting LEGOMARK India Server in [${config.env}] mode`, 'Bootstrap');
  logger.info('====================================================', 'Bootstrap');

  // Step 1: Verify PostgreSQL connection before or upon server startup
  const dbConnected = await verifyDatabaseConnection();
  if (!dbConnected) {
    logger.warn('Server starting with degraded database state. Supply valid PostgreSQL credentials to achieve full health.', 'Bootstrap');
  }

  // Step 2: Initialize Express App
  const app = express();

  // Step 3: Apply Security & Body Parsers
  applySecurityMiddleware(app);

  // Step 4: Apply Request Logging
  app.use(requestLogger);

  // Step 5: Mount API Router
  app.use('/api', apiRouter);

  // Step 6: Integrate Vite Middleware in Dev or Serve Static Dist in Prod
  if (config.env !== 'production') {
    logger.info('Mounting Vite middleware for development...', 'Vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    logger.info('Mounting static production assets from dist/ folder...', 'Production');
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Wildcard fallback for Single Page Application routing (Express v4)
    app.get('*', (req, res, next) => {
      // If request was meant for an API route that didn't match, send 404 JSON instead of HTML
      if (req.originalUrl.startsWith('/api/')) {
        return notFoundHandler(req, res);
      }
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  // Step 7: Centralized Error Handling Middleware
  app.use(errorHandler);

  // Step 8: Start Listening on Port 3000 and 0.0.0.0
  const server = app.listen(config.port, config.host, () => {
    logger.info(`LEGOMARK India server listening on http://${config.host}:${config.port}`, 'Server');
    logger.info(`Health check available at http://${config.host}:${config.port}/api/health`, 'Server');
  });

  // Step 9: Graceful Shutdown Handlers
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`, 'Server');
    server.close(async () => {
      logger.info('HTTP server closed.', 'Server');
      await closeDatabasePool();
      logger.info('Process terminated gracefully.', 'Server');
      process.exit(0);
    });

    // Force exit if hanging after 10s
    setTimeout(() => {
      logger.error('Graceful shutdown timed out after 10s. Forcing exit.', 'Server');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal failure during application bootstrap:', 'Bootstrap', err);
  process.exit(1);
});
