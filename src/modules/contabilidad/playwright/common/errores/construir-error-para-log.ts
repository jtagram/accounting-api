import { formatearError } from './formatear-error.js';

export function construirErrorParaLog(error: unknown): { message: string; stack: string } {
  return {
    message: error instanceof Error ? error.message : String(error),
    stack: formatearError(error),
  };
}
