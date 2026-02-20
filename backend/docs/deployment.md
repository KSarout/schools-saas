# Deployment Notes

## Backend
- Build image:
  - `docker build -t school-saas-backend -f backend/Dockerfile backend`
- Run container:
  - `docker run --rm -p 4000:4000 --env-file backend/.env school-saas-backend`

## Frontend
- Build image:
  - `docker build -t school-saas-frontend -f frontend/Dockerfile frontend`
- Run container:
  - `docker run --rm -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://localhost:4000 school-saas-frontend`

## Runtime checks
- Liveness: `GET /health`
- Readiness: `GET /ready`

## Security knobs
- CORS: `CORS_ALLOWED_ORIGINS`, `CORS_ALLOW_CREDENTIALS`
- Rate limits: `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*`, `REFRESH_RATE_LIMIT_*`
- Logging level: `LOG_LEVEL`
- Reverse proxy support: `TRUST_PROXY=true` behind load balancer
