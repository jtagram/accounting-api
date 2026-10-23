import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { AccountingTestApp, createAccountingTestApp } from './helpers/app-test-app';
import {
  ADMIN_AUTHORIZATION,
  authorizationHeaderFor,
  expiredAdminAuthorizationHeader,
  hs256ConfusionAdminAuthorizationHeader,
  TEST_APPLICATION_NAME,
  wrongKeyAdminAuthorizationHeader,
} from './helpers/test-auth';

const CLIENTE_ARCA = { cuit: '20111111112', claveFiscal: 'secreto' };

const ENDPOINTS: { path: string; body: unknown }[] = [
  { path: '/contabilidad/arca', body: { clientes: [CLIENTE_ARCA] } },
  {
    path: '/contabilidad/arca-agip',
    body: { clientes: [{ ...CLIENTE_ARCA, claveCiudad: 'clave' }] },
  },
  {
    path: '/contabilidad/arca-arba',
    body: { clientes: [{ ...CLIENTE_ARCA, claveCit: 'clave' }] },
  },
];

describe('Authentication and authorization (e2e)', () => {
  let testApp: AccountingTestApp;

  beforeAll(async () => {
    testApp = await createAccountingTestApp();
  });

  afterAll(async () => {
    await testApp.close();
  });

  beforeEach(() => {
    testApp.serviceCalls.arca.mockClear();
    testApp.serviceCalls.arcaAgip.mockClear();
    testApp.serviceCalls.arcaArba.mockClear();
  });

  const reachedAnyService = () =>
    Object.values(testApp.serviceCalls).some((mock) => mock.mock.calls.length > 0);

  it('keeps /health public', async () => {
    const response = await testApp.http().get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('keeps the swagger UI reachable without a token', async () => {
    await testApp.http().get('/docs').redirects(1).expect(200);
  });

  describe.each(ENDPOINTS)('POST $path', ({ path, body }) => {
    const post = (authorization?: string) => {
      const req = testApp.http().post(path).send(body as object);
      return authorization ? req.set('Authorization', authorization) : req;
    };

    it('returns 401 without a token', async () => {
      const response = await post().expect(401);
      expect(response.body).toMatchObject({
        message: 'Missing or malformed bearer token',
        statusCode: 401,
      });
      expect(reachedAnyService()).toBe(false);
    });

    it('returns 401 for a malformed token', async () => {
      const response = await post('Bearer not-a-jwt').expect(401);
      expect(response.body).toMatchObject({ message: 'Invalid or expired token' });
      expect(reachedAnyService()).toBe(false);
    });

    it('returns 401 for an expired token', async () => {
      await post(expiredAdminAuthorizationHeader()).expect(401);
      expect(reachedAnyService()).toBe(false);
    });

    it('returns 401 for a token signed with another key', async () => {
      await post(wrongKeyAdminAuthorizationHeader()).expect(401);
      expect(reachedAnyService()).toBe(false);
    });

    it('returns 401 for an HS256 token keyed with the public key', async () => {
      await post(hs256ConfusionAdminAuthorizationHeader()).expect(401);
      expect(reachedAnyService()).toBe(false);
    });

    it('returns 403 when the token has no ADMIN role', async () => {
      const response = await post(
        authorizationHeaderFor({ email: 'user@example.com', roles: ['USER'] }),
      ).expect(403);
      expect(response.body).toMatchObject({ message: 'You do not have the required role' });
      expect(reachedAnyService()).toBe(false);
    });

    it('returns 403 for an ADMIN of another application', async () => {
      const response = await post(
        authorizationHeaderFor({
          email: 'admin@example.com',
          roles: ['ADMIN'],
          applicationName: `not-${TEST_APPLICATION_NAME}`,
        }),
      ).expect(403);
      expect(response.body).toMatchObject({
        message: 'This token was not issued for the accounting-api application',
      });
      expect(reachedAnyService()).toBe(false);
    });

    it('passes the guards with an ADMIN token of accounting-api', async () => {
      const response = await post(ADMIN_AUTHORIZATION).expect(201);
      expect(response.headers['content-type']).toContain('application/zip');
      expect(reachedAnyService()).toBe(true);
    });
  });
});
