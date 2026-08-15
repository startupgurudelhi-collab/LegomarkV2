import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  // Don't clutter logs with static asset requests or HMR polling
  if (
    originalUrl.startsWith('/@') ||
    originalUrl.startsWith('/src/') ||
    originalUrl.startsWith('/node_modules/') ||
    originalUrl.includes('.vite/') ||
    originalUrl.endsWith('.ico')
  ) {
    return next();
  }

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms [ip: ${ip || 'unknown'}]`;

    if (statusCode >= 500) {
      logger.error(message, 'HTTP');
    } else if (statusCode >= 400) {
      logger.warn(message, 'HTTP');
    } else {
      logger.info(message, 'HTTP');
    }
  });

  next();
}
