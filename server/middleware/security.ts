import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express, { Express } from 'express';
import { config } from '../config/env';

export function applySecurityMiddleware(app: Express): void {
  // Helmet for secure HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Vite dev tooling & inline styles during preview
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: config.corsOrigin === '*' ? true : config.corsOrigin,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    })
  );

  // Parse Cookies for HttpOnly session tokens
  app.use(cookieParser(config.auth.sessionSecret));

  // Request Body Size Limits to prevent DoS attacks
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
}
