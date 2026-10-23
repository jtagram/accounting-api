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
          // pino-http does not serialize the request body by default; this is a safety net
          // so the clientes' claves are never written if a body serializer is ever added.
          'req.body.clientes[*].claveFiscal',
          'req.body.clientes[*].claveCiudad',
          'req.body.clientes[*].claveCit',
        ],
        censor: '[REDACTED]',
      },
    },
  };
}
