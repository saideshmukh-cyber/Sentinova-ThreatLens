# Deployment guide

## Local Docker deployment

Create `.env` from `.env.example` and replace at minimum:

- `JWT_SECRET`
- `BOOTSTRAP_ADMIN_PASSWORD`

Then:

```bash
docker compose -f docker-compose.full.yml up --build -d
docker compose -f docker-compose.full.yml ps
```

Use:

- frontend: `http://localhost:3000`
- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

## Production architecture

The PRD targets Kubernetes with:

- frontend deployment
- FastAPI API/WebSocket deployment
- worker deployment
- scheduler deployment
- managed PostgreSQL
- managed Redis
- Elasticsearch/OpenSearch
- ingress with TLS
- cloud secret manager
- horizontal scaling

The local compose file is a development/demo environment, not a hardened production cluster.

## Production checklist

### Secrets

Use a cloud secret manager. Do not put secrets in Git or container images.

### TLS

Terminate TLS at the ingress and use `wss://` for WebSockets.

### Database

Use managed PostgreSQL, automated backups, monitoring and restricted network access.

### Redis

Use a managed Redis service for multi-instance WebSocket fan-out and caching.

### Elasticsearch

Use managed Elasticsearch/OpenSearch or a properly configured cluster. Enable authentication/TLS in production.

### API scaling

The API is designed to be stateless with JWT authentication. Redis carries realtime events between instances.

### Health checks

Monitor:

- `/health/database`
- `/health/elasticsearch`
- API availability
- Redis connectivity
- worker/scheduler liveness
- WebSocket connection errors

### Security gate

Before production, run dependency/image scans and OWASP testing. The PRD explicitly requires no critical/high vulnerabilities outstanding before release.

## Kubernetes

The PRD calls for Kubernetes manifests and cloud deployment. The recommended production progression is:

1. Docker Compose local demo.
2. Single-node Kubernetes staging.
3. Integration/performance/security validation.
4. Managed Kubernetes production.
5. HPA and rolling deployments with health-gated rollout.

Do not expose PostgreSQL, Redis or Elasticsearch directly to the public internet.
