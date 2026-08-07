import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export interface RequestValidationSchemas {
  body?: ZodSchema<any>;
  params?: ZodSchema<any>;
  query?: ZodSchema<any>;
  headers?: ZodSchema<any>;
}

export function validateRequest(schemas: RequestValidationSchemas) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.headers) {
        req.headers = await schemas.headers.parseAsync(req.headers);
      }
      return next();
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const errors = err.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }));

        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          code: 'BAD_REQUEST',
          message: 'Falha na validação dos parâmetros de entrada.',
          details: errors,
          timestamp: new Date().toISOString()
        });
      }

      return res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        code: 'BAD_REQUEST',
        message: err?.message || 'Dados fornecidos são inválidos.',
        timestamp: new Date().toISOString()
      });
    }
  };
}
