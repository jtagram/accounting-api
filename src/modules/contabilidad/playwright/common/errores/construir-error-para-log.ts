import { formatearError } from './formatear-error.js';

// Arma el objeto `err` que se loguea: el mensaje del error y el stack con su cadena de `cause`.
export function construirErrorParaLog(error: unknown): { message: string; stack: string } {
  return {
    message: error instanceof Error ? error.message : String(error),
    stack: formatearError(error),
  };
}
