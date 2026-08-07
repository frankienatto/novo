import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/appError.ts';
import { logger } from '../utils/logger.ts';
import { env } from '../config/environment.ts';

export interface StandardErrorResponse {
  success: false;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
  correlationId?: string;
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  const requestId = req.requestId || (req.headers['x-request-id'] as string) || 'unknown';
  const correlationId = req.correlationId || (req.headers['x-correlation-id'] as string) || requestId;
  const timestamp = new Date().toISOString();

  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Ocorreu um erro interno no servidor.';
  let details: any = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Dados de requisição inválidos.';
    details = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'O corpo da requisição contém um JSON inválido.';
  } else if (err.statusCode && typeof err.statusCode === 'number') {
    statusCode = err.statusCode;
    code = err.code || `HTTP_${statusCode}`;
    message = err.message || message;
    details = err.details || null;
  } else if (err.message) {
    message = env.NODE_ENV === 'production' ? 'Erro interno no processamento da requisição.' : err.message;
  }

  // Registra o erro detalhado no logger estruturado
  logger.error(`[Error ${code}] ${err.message || message}`, {
    statusCode,
    code,
    errorName: err.name,
    stack: env.NODE_ENV === 'production' ? undefined : err.stack,
    url: req.originalUrl || req.url,
    method: req.method,
  });

  const responsePayload: StandardErrorResponse = {
    success: false,
    code,
    message,
    details: details || undefined,
    timestamp,
    requestId,
    correlationId,
  };

  return res.status(statusCode).json(responsePayload);
}
