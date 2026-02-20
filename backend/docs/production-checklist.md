# Production Checklist

- [ ] Configure all required environment variables from `backend/.env.example`.
- [ ] Set `NODE_ENV=production`.
- [ ] Set strict CORS allowlist (`CORS_ALLOWED_ORIGINS`) and credentials policy.
- [ ] Set `TRUST_PROXY=true` when behind reverse proxy/load balancer.
- [ ] Tune rate limits for baseline and auth endpoints (`RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*`, `REFRESH_RATE_LIMIT_*`).
- [ ] Validate `/health` and `/ready` endpoint behavior in deployment.
- [ ] Verify structured logs include `requestId` and are collected by your log pipeline.
- [ ] Confirm error responses do not leak stack traces in production.
- [ ] Ensure CI job (`.github/workflows/ci.yml`) is green for lint/typecheck/tests/build.
- [ ] Build and run Docker images (if used) from `backend/Dockerfile` and `frontend/Dockerfile`.
- [ ] Verify JWT secrets are rotated and managed by a secret manager.
