import pino from 'pino';
import { construirOpcionesDeLogger } from './logger.config.js';

function logWith(entry: Record<string, unknown>): Record<string, unknown> {
  const { redact } = construirOpcionesDeLogger('info').pinoHttp;
  const lines: string[] = [];
  const logger = pino({ redact }, { write: (line: string) => void lines.push(line) });
  logger.info(entry, 'request');
  return JSON.parse(lines[0]) as Record<string, unknown>;
}

describe('construirOpcionesDeLogger', () => {
  it('redacta el header authorization', () => {
    const salida = logWith({ req: { headers: { authorization: 'Bearer secreto', accept: '*/*' } } });
    expect(JSON.stringify(salida)).not.toContain('Bearer secreto');
    expect(salida.req).toEqual({ headers: { authorization: '[REDACTED]', accept: '*/*' } });
  });

  it('redacta las claves de los clientes si el body llegara a loguearse', () => {
    const salida = logWith({
      req: {
        body: {
          clientes: [{ cuit: '20111111112', claveFiscal: 'a', claveCiudad: 'b', claveCit: 'c' }],
        },
      },
    });
    const texto = JSON.stringify(salida);
    expect(texto).toContain('20111111112');
    expect(texto).not.toMatch(/"clave(Fiscal|Ciudad|Cit)":"[abc]"/);
  });
});
