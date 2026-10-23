import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtPublicKeyService } from '../jwt/jwt-public-key.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

// @nestjs/config and @nestjs/schedule are ESM-only and Jest runs as CommonJS;
// the guards are built by hand, so only the class tokens need to exist.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
jest.mock('@nestjs/schedule', () => ({ Interval: () => () => undefined }));

function contextWith(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwtService = { decode: jest.fn(), verifyAsync: jest.fn() };
  const reflector = { getAllAndOverride: jest.fn() };
  const keys = { getPublicKey: jest.fn() };
  const guard = new JwtAuthGuard(
    jwtService as unknown as JwtService,
    reflector as unknown as Reflector,
    keys as unknown as JwtPublicKeyService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    reflector.getAllAndOverride.mockReturnValue(false);
  });

  it('lets public routes through without a token', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    await expect(guard.canActivate(contextWith({ headers: {} }))).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it.each([{}, { authorization: 'Basic abc' }, { authorization: 'Bearer' }])(
    'rejects a missing or malformed header %j',
    async (headers) => {
      await expect(guard.canActivate(contextWith({ headers }))).rejects.toThrow(
        new UnauthorizedException('Missing or malformed bearer token'),
      );
    },
  );

  it('rejects a token without a known kid', async () => {
    jwtService.decode.mockReturnValue({ header: { kid: 'x' } });
    keys.getPublicKey.mockResolvedValue(undefined);
    await expect(
      guard.canActivate(contextWith({ headers: { authorization: 'Bearer t' } })),
    ).rejects.toThrow(new UnauthorizedException('Invalid or expired token'));
  });

  it('rejects a token whose verification fails', async () => {
    jwtService.decode.mockReturnValue({ header: { kid: 'k' } });
    keys.getPublicKey.mockResolvedValue('pem');
    jwtService.verifyAsync.mockRejectedValue(new Error('expired'));
    await expect(
      guard.canActivate(contextWith({ headers: { authorization: 'Bearer t' } })),
    ).rejects.toThrow(new UnauthorizedException('Invalid or expired token'));
  });

  it('verifies with RS256 only and attaches the payload as request.user', async () => {
    const payload = { apps: { application: { name: 'accounting-api', roles: [] } } };
    jwtService.decode.mockReturnValue({ header: { kid: 'k' } });
    keys.getPublicKey.mockResolvedValue('pem');
    jwtService.verifyAsync.mockResolvedValue(payload);
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer t' } };

    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('t', {
      publicKey: 'pem',
      algorithms: ['RS256'],
    });
    expect(request.user).toBe(payload);
  });
});

describe('RolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() };
  const config = { get: jest.fn() };
  const guard = new RolesGuard(
    reflector as unknown as Reflector,
    config as unknown as import('@nestjs/config').ConfigService,
  );
  const userWith = (name: string, roles: string[]) => ({
    apps: { application: { name, roles: roles.map((r) => ({ name: r })) } },
  });

  beforeEach(() => {
    jest.resetAllMocks();
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    config.get.mockReturnValue('accounting-api');
  });

  it('allows routes with no required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextWith({}))).toBe(true);
  });

  it('forbids when there is no authenticated user', () => {
    expect(() => guard.canActivate(contextWith({}))).toThrow(ForbiddenException);
  });

  it('forbids a token issued for another application', () => {
    const request = { user: userWith('iam', ['ADMIN']) };
    expect(() => guard.canActivate(contextWith(request))).toThrow(
      'This token was not issued for the accounting-api application',
    );
  });

  it('forbids a token without the ADMIN role', () => {
    const request = { user: userWith('accounting-api', ['USER']) };
    expect(() => guard.canActivate(contextWith(request))).toThrow(
      'You do not have the required role',
    );
  });

  it('allows ADMIN of accounting-api', () => {
    const request = { user: userWith('accounting-api', ['ADMIN']) };
    expect(guard.canActivate(contextWith(request))).toBe(true);
  });
});
