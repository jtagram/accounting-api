import { generateKeyPairSync } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../src/common/roles/role.enum';

export const TEST_APPLICATION_NAME = 'accounting-api-test';
export const TEST_KEY_ID = 'e2e-test-key';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const FOREIGN_KEY_PAIR = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** Public key served by the JWKS stub (PEM). */
export const TEST_PUBLIC_KEY_PEM = publicKey;

export interface TestUser {
  email: string;
  roles: (Role | string)[];
  applicationName?: string;
}

function claimsFor(user: TestUser): Record<string, unknown> {
  return {
    email: user.email,
    apps: {
      application: {
        id: 1,
        name: user.applicationName ?? TEST_APPLICATION_NAME,
        description: 'Accounting API (e2e)',
        roles: user.roles.map((name, index) => ({ id: index + 1, name, description: name })),
      },
    },
  };
}

/** Signs a real RS256 token with the same claim shape iam-api issues. */
export function authorizationHeaderFor(user: TestUser): string {
  const token = new JwtService().sign(claimsFor(user), {
    privateKey,
    algorithm: 'RS256',
    keyid: TEST_KEY_ID,
    expiresIn: '5m',
  });
  return `Bearer ${token}`;
}

const ADMIN: TestUser = { email: 'admin@example.com', roles: [Role.ADMIN] };

export const ADMIN_AUTHORIZATION = authorizationHeaderFor(ADMIN);

/** Well-formed ADMIN token whose `exp` is already in the past. */
export function expiredAdminAuthorizationHeader(): string {
  const token = new JwtService().sign(
    { ...claimsFor(ADMIN), exp: Math.floor(Date.now() / 1000) - 60 },
    { privateKey, algorithm: 'RS256', keyid: TEST_KEY_ID },
  );
  return `Bearer ${token}`;
}

/** ADMIN token announcing the trusted `kid` but signed with another RSA key. */
export function wrongKeyAdminAuthorizationHeader(): string {
  const token = new JwtService().sign(claimsFor(ADMIN), {
    privateKey: FOREIGN_KEY_PAIR.privateKey,
    algorithm: 'RS256',
    keyid: TEST_KEY_ID,
    expiresIn: '5m',
  });
  return `Bearer ${token}`;
}

/** Algorithm-confusion attempt: HS256 token keyed with the PUBLIC key PEM. */
export function hs256ConfusionAdminAuthorizationHeader(): string {
  const token = new JwtService().sign(claimsFor(ADMIN), {
    secret: publicKey,
    algorithm: 'HS256',
    keyid: TEST_KEY_ID,
    expiresIn: '5m',
  });
  return `Bearer ${token}`;
}
