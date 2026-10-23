import type { AppsPayload } from './apps-payload.js';

/** Minimal shape JwtAuthGuard/RolesGuard need from a decoded token. */
export interface AuthenticatedUser {
  apps: AppsPayload;
}
