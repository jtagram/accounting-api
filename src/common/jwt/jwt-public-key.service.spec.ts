import { ConfigService } from '@nestjs/config';
import { generateKeyPairSync, JsonWebKey } from 'crypto';
import { Logger } from 'nestjs-pino';
import { JwtPublicKeyService } from './jwt-public-key.service.js';

// @nestjs/config and @nestjs/schedule are ESM-only and Jest runs as CommonJS;
// the service is built by hand, so only the class tokens need to exist.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
jest.mock('@nestjs/schedule', () => ({ Interval: () => () => undefined }));

const buildJwk = (kid?: string): JsonWebKey & { kid?: string } => {
  const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' });
  return kid === undefined ? jwk : { ...jwk, kid };
};

const jsonResponse = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, json: () => Promise.resolve(body) }) as unknown as Response;

const envelope = (keys: unknown[]) => ({ ok: true, msg: 'ok', data: { keys } });

describe('JwtPublicKeyService', () => {
  let fetchMock: jest.SpyInstance;
  let service: JwtPublicKeyService;

  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch');
    service = new JwtPublicKeyService(
      { get: jest.fn().mockReturnValue('http://iam-api:3002') } as unknown as ConfigService,
      { error: jest.fn() } as unknown as Logger,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reads the keys from the "data.keys" of the iam-api envelope', async () => {
    fetchMock.mockResolvedValue(jsonResponse(envelope([buildJwk('k1')])));

    await service.onModuleInit();

    expect(fetchMock).toHaveBeenCalledWith('http://iam-api:3002/.well-known/jwks.json');
    await expect(service.getPublicKey('k1')).resolves.toMatch(/^-----BEGIN PUBLIC KEY-----/);
  });

  it('fails when the envelope is ok:false, reporting its msg', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, msg: 'no keys today', data: null }));

    await expect(service.onModuleInit()).rejects.toThrow(
      'malformed JWKS envelope (no keys today)',
    );
  });

  it('fails on the pre-envelope bare { keys } shape', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ keys: [buildJwk('k1')] }));

    await expect(service.onModuleInit()).rejects.toThrow('malformed JWKS envelope');
  });

  it('fails when "data.keys" is missing or not an array', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, msg: 'ok', data: {} }));
    await expect(service.onModuleInit()).rejects.toThrow('malformed JWKS envelope');

    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, msg: 'ok', data: { keys: 'x' } }));
    await expect(service.onModuleInit()).rejects.toThrow('malformed JWKS envelope');
  });

  it('fails when the body is null', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null));

    await expect(service.onModuleInit()).rejects.toThrow('malformed JWKS envelope');
  });

  it('fails when no key carries a kid', async () => {
    fetchMock.mockResolvedValue(jsonResponse(envelope([buildJwk()])));

    await expect(service.onModuleInit()).rejects.toThrow('no usable keys');
  });

  it('fails on a non-2xx status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, false, 503));

    await expect(service.onModuleInit()).rejects.toThrow('HTTP 503');
  });
});
