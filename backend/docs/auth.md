# Authentication Hardening

## Token model
- Access tokens: short-lived JWTs used on protected API calls.
- Refresh tokens: long-lived JWTs used only to rotate sessions.
- Both token classes enforce:
  - `iss` (issuer)
  - `aud` (audience)
  - `domain` (`school` or `super_admin`)
  - `tokenType` (`access` or `refresh`)

## Endpoints

### School auth
- `POST /auth/login` -> `{ accessToken, refreshToken, mustChangePassword, user, tenant }`
- `POST /auth/refresh` -> `{ accessToken, refreshToken }` (rotation)
- `POST /auth/logout` -> `{ ok: true }` (revokes provided refresh token)
- `GET /auth/me` -> protected by access token
- `POST /auth/change-password` -> protected by access token; revokes all school refresh tokens for that user

### Super-admin auth
- `POST /super-admin/login` -> `{ accessToken, refreshToken, superAdmin }`
- `POST /super-admin/refresh` -> `{ accessToken, refreshToken }` (rotation)
- `POST /super-admin/logout` -> `{ ok: true }` (revokes provided refresh token)
- `GET /super-admin/me` -> protected by access token

## Rotation strategy
1. Login creates one refresh-token record with `tokenId`, expiry, subject metadata.
2. Refresh verifies JWT claims + active DB record.
3. Old refresh token is revoked and linked to replacement (`replacedByTokenId`).
4. New access + refresh pair is returned and persisted.

## Revocation
- Logout revokes the presented refresh token.
- School password change revokes all active school refresh tokens for that user+tenant.

## Required env vars
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ISSUER`
- `JWT_SCHOOL_AUDIENCE`
- `JWT_SUPER_ADMIN_AUDIENCE`
- `ACCESS_TOKEN_EXPIRES`
- `REFRESH_TOKEN_EXPIRES`
