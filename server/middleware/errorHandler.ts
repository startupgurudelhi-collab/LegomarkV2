import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested resource '${req.originalUrl}' was not found.`,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    },
  });
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  const isProduction = config.env === 'production';
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'API_ERROR');

  logger.error(
    `Unhandled error on ${req.method} ${req.originalUrl}: ${err.message}`,
    'ErrorHandler',
    err,
    { path: req.originalUrl, statusCode, ip: req.ip }
  );

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: isProduction && statusCode === 500 ? 'An unexpected internal server error occurred.' : err.message,
      ...(isProduction ? {} : { stack: err.stack, details: err.details }),
      timestamp: new Date().toISOString(),
    },
  });
}
