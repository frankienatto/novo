import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { runWithLogContext, logger } from '../utils/logger.ts';
import { env } from '../config/environment.ts';
import { metricsCollector } from '../utils/metricsCollector.ts';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      correlationId?: string;
    }
  }
}

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const incomingRequestId = req.headers['x-request-id'] as string;
  const incomingCorrelationId = req.headers['x-correlation-id'] as string;

  const requestId = incomingRequestId || randomUUID();
  const correlationId = incomingCorrelationId || requestId;

  req.requestId = requestId;
  req.correlationId = correlationId;

  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Correlation-ID', correlationId);

  const organizationId = (req.headers['x-organization-id'] as string) || (req as any).organizationId;
  const propertyId = (req.headers['x-property-id'] as string) || (req as any).propertyId;

  const startTime = Date.now();

  const logContext = {
    requestId,
    correlationId,
    organizationId,
    propertyId,
    module: 'HTTP',
  };

  runWithLogContext(logContext, () => {
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      metricsCollector.recordHttpRequest(durationMs);

      if (env.ENABLE_REQUEST_LOGGING) {
        logger.info(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${durationMs}ms`, {
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode: res.statusCode,
          durationMs,
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }
    });

    next();
  });
}

