export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  data?: unknown;
  error?: {
    message: string;
    stack?: string;
    code?: string | number;
  };
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: string, data?: unknown, err?: unknown): string {
    const isProduction = process.env.NODE_ENV === 'production';
    const timestamp = new Date().toISOString();

    const payload: LogPayload = {
      level,
      message,
      timestamp,
      ...(context && { context }),
      ...(data !== undefined && { data }),
    };

    if (err instanceof Error) {
      payload.error = {
        message: err.message,
        code: (err as { code?: string | number }).code,
        stack: isProduction ? undefined : err.stack,
      };
    } else if (err) {
      payload.error = { message: String(err) };
    }

    if (isProduction) {
      return JSON.stringify(payload);
    }

    const colorMap: Record<LogLevel, string> = {
      debug: '\x1b[34m[DEBUG]\x1b[0m',
      info: '\x1b[32m[INFO]\x1b[0m',
      warn: '\x1b[33m[WARN]\x1b[0m',
      error: '\x1b[31m[ERROR]\x1b[0m',
    };

    const prefix = `${colorMap[level]} [${timestamp}]${context ? ` [${context}]` : ''}: ${message}`;
    if (data || payload.error) {
      return `${prefix}\n${JSON.stringify({ data, error: payload.error }, null, 2)}`;
    }
    return prefix;
  }

  debug(message: string, context?: string, data?: unknown) {
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatLog('debug', message, context, data));
    }
  }

  info(message: string, context?: string, data?: unknown) {
    console.info(this.formatLog('info', message, context, data));
  }

  warn(message: string, context?: string, data?: unknown) {
    console.warn(this.formatLog('warn', message, context, data));
  }

  error(message: string, context?: string, err?: unknown, data?: unknown) {
    console.error(this.formatLog('error', message, context, data, err));
  }
}

export const logger = new Logger();
