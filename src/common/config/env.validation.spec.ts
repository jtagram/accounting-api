import { validate } from './env.validation.js';

describe('validate', () => {
  const valido = { IAM_API_URL: 'http://iam-api:3000', ACCOUNTING_API_APPLICATION_NAME: 'accounting-api' };

  it('acepta las variables requeridas', () => {
    expect(validate(valido)).toMatchObject(valido);
  });

  it.each(Object.keys(valido))('falla si falta %s', (clave) => {
    const config: Record<string, unknown> = { ...valido };
    delete config[clave];
    expect(() => validate(config)).toThrow(`Missing required environment variable(s): ${clave}`);
  });

  it('falla si una variable está vacía', () => {
    expect(() => validate({ ...valido, IAM_API_URL: '' })).toThrow('IAM_API_URL');
  });
});
