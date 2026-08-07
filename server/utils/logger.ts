import { AsyncLocalStorage } from 'node:async_hooks';

export interface LogContext {
  requestId?: string;
  correlationId?: string;
  organizationId?: string;
  propertyId?: string;
  module?: string;
  [key: string]: any;
}

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

export function runWithLogContext<T>(context: LogContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

export function getLogContext(): LogContext {
  return asyncLocalStorage.getStore() || {};
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

// Mapeamento para severity do Google Cloud Logging
const cloudLoggingSeverityMap: Record<LogLevel, string> = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARNING',
  ERROR: 'ERROR',
};

function formatAndPrintLog(level: LogLevel, message: string, meta?: Record<string, any>, moduleName?: string) {
  const currentContext = getLogContext();
  const timestamp = new Date().toISOString();

  const logPayload = {
    timestamp,
    severity: cloudLoggingSeverityMap[level],
    level,
    message,
    module: moduleName || currentContext.module || 'SYSTEM',
    requestId: currentContext.requestId || undefined,
    correlationId: currentContext.correlationId || undefined,
    organizationId: currentContext.organizationId || undefined,
    propertyId: currentContext.propertyId || undefined,
    ...meta,
  };

  // Remove campos undefined para manter o JSON limpo
  Object.keys(logPayload).forEach((key) => {
    if (logPayload[key as keyof typeof logPayload] === undefined) {
      delete logPayload[key as keyof typeof logPayload];
    }
  });

  const jsonOutput = JSON.stringify(logPayload);

  if (level === 'ERROR') {
    process.stderr.write(jsonOutput + '\n');
  } else {
    process.stdout.write(jsonOutput + '\n');
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, any>, moduleName?: string) => {
    formatAndPrintLog('DEBUG', message, meta, moduleName);
  },
  info: (message: string, meta?: Record<string, any>, moduleName?: string) => {
    formatAndPrintLog('INFO', message, meta, moduleName);
  },
  warn: (message: string, meta?: Record<string, any>, moduleName?: string) => {
    formatAndPrintLog('WARN', message, meta, moduleName);
  },
  error: (message: string, meta?: Record<string, any>, moduleName?: string) => {
    formatAndPrintLog('ERROR', message, meta, moduleName);
  },
};
