import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { createPublicKey } from 'node:crypto';
import request from 'supertest';
import { TEST_APPLICATION_NAME, TEST_KEY_ID, TEST_PUBLIC_KEY_PEM } from './test-auth';

export const IAM_API_URL = 'http://iam-api.test';

const TEST_ENV: Record<string, string> = {
  LOG_LEVEL: 'fatal',
  IAM_API_URL,
  ACCOUNTING_API_APPLICATION_NAME: TEST_APPLICATION_NAME,
};

export interface AccountingTestApp {
  app: INestApplication;
  http: () => ReturnType<typeof request>;
  /** Calls that reached the (stubbed) Playwright-backed services. */
  serviceCalls: { arca: jest.Mock; arcaAgip: jest.Mock; arcaArba: jest.Mock };
  close: () => Promise<void>;
}

/**
 * Boots the REAL AppModule (env validation, pino logger, JwtAuthGuard +
 * RolesGuard as APP_GUARD, JwtPublicKeyService, controllers). Replaced edges:
 *  - the three Playwright-backed services -> mocks (no browser ever starts);
 *  - global `fetch` for `${IAM_API_URL}/.well-known/jwks.json` -> JWKS built
 *    from the test public key (any other URL is rejected);
 *  - console.error is muted: JwtAuthGuard logs every rejected token with it.
 */
export async function createAccountingTestApp(): Promise<AccountingTestApp> {
  const previousEnv: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(TEST_ENV)) {
    previousEnv[key] = process.env[key];
    process.env[key] = value;
  }

  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const jwk = createPublicKey(TEST_PUBLIC_KEY_PEM).export({ format: 'jwk' });
  const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation((input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url === `${IAM_API_URL}/.well-known/jwks.json`) {
      return Promise.resolve(
        new Response(JSON.stringify({ keys: [{ ...jwk, kid: TEST_KEY_ID }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    }
    return Promise.reject(new Error(`Unexpected outbound HTTP call in e2e: ${url}`));
  });

  const restore = () => {
    fetchSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };

  const zip = Buffer.from('zip');
  const result = { nombre: 'PDFs Contables', exito: true, zip };
  const serviceCalls = {
    arca: jest.fn(() => Promise.resolve(result)),
    arcaAgip: jest.fn(() => Promise.resolve(result)),
    arcaArba: jest.fn(() => Promise.resolve(result)),
  };

  try {
    // Imported lazily: EnvModule validates process.env while the module file is
    // evaluated, so the env above must already be in place.
    // Specifiers are variables so tsc does not demand file extensions; ts-jest
    // resolves them at runtime.
    const appModulePath = '../../src/app.module';
    const arcaPath = '../../src/modules/contabilidad/arca.service';
    const arcaAgipPath = '../../src/modules/contabilidad/arca-agip.service';
    const arcaArbaPath = '../../src/modules/contabilidad/arca-arba.service';
    const swaggerPath = '../../src/common/swagger/setup-swagger';
    const { setupSwagger } = (await import(swaggerPath)) as typeof import('../../src/common/swagger/setup-swagger');
    const { AppModule } = (await import(appModulePath)) as typeof import('../../src/app.module');
    const { ArcaService } = (await import(arcaPath)) as typeof import('../../src/modules/contabilidad/arca.service');
    const { ArcaAgipService } = (await import(arcaAgipPath)) as typeof import('../../src/modules/contabilidad/arca-agip.service');
    const { ArcaArbaService } = (await import(arcaArbaPath)) as typeof import('../../src/modules/contabilidad/arca-arba.service');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ArcaService)
      .useValue({ ejecutarArca: serviceCalls.arca })
      .overrideProvider(ArcaAgipService)
      .useValue({ ejecutarArcaAgip: serviceCalls.arcaAgip })
      .overrideProvider(ArcaArbaService)
      .useValue({ ejecutarArcaArba: serviceCalls.arcaArba })
      .compile();

    const app = moduleRef.createNestApplication({ logger: false });
    // Same global pipe as src/main.ts (outside AppModule).
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, stopAtFirstError: true }),
    );
    // Swagger is wired in src/main.ts as well; /docs must stay reachable without a token.
    setupSwagger(app);
    await app.init();

    return {
      app,
      http: () => request(app.getHttpServer() as Parameters<typeof request>[0]),
      serviceCalls,
      close: async () => {
        await app.close();
        restore();
      },
    };
  } catch (error) {
    restore();
    throw error;
  }
}
