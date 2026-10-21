import { randomUUID } from 'node:crypto';
import type { Options } from 'pino-http';

const NIVELES_DE_LOG = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

export function obtenerNivelDeLog(valor: string | undefined): string {
  const nivel = valor ?? 'info';

  if (!NIVELES_DE_LOG.includes(nivel)) {
    throw new Error(`LOG_LEVEL inválido: "${nivel}". Valores permitidos: ${NIVELES_DE_LOG.join(', ')}`);
  }

  return nivel;
}

export function construirOpcionesDeLogger(nivel: string): { pinoHttp: Options } {
  return {
    pinoHttp: {
      level: nivel,
      genReqId: () => randomUUID(),
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          'req.body.ARCA_PASSWORD',
          'req.body.AGIP_CLAVE',
        ],
        censor: '[REDACTED]',
      },
    },
  };
}
