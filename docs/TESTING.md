# ThreatLens testing runbook

Run tests in this order.

## A. Static backend checks

```bash
python -m compileall -q backend
pytest -q backend/tests
```

Expected result: all backend tests pass.

## B. Database migration check

With PostgreSQL running:

```bash
alembic -c backend/alembic.ini current
alembic -c backend/alembic.ini upgrade head
```

The new authentication migration is:

```text
f2a7b8c9d0e1_harden_user_authentication.py
```

## C. API smoke tests

Open Swagger at `http://localhost:8000/docs`.

Test:

1. `GET /` returns the API-running message.
2. `GET /health/database` reports connected.
3. `GET /health/elasticsearch` reports connected.
4. `POST /api/v1/auth/signup` creates an Analyst account.
5. `POST /api/v1/auth/login` returns access and refresh tokens.
6. `POST /api/v1/auth/refresh` returns a new token pair.
7. Protected endpoints reject requests without a token.
8. Executive/admin/analyst permissions behave according to RBAC.
9. Duplicate indicator creation returns the expected conflict.
10. Indicator enrichment and scoring work for their supported indicator types.

## D. WebSocket test

1. Log in.
2. Open `/alerts`.
3. Open browser developer tools → Network → WS.
4. Confirm `/ws/alerts?token=...` is connected.
5. Create/update an alert through Swagger or the UI.
6. Confirm the alert event arrives without refreshing the page.
7. Stop/restart Redis and confirm local fallback still allows the current API process to broadcast.
8. Restart Redis and reconnect the page.

## E. Signup/login security test

- Correct credentials → login succeeds.
- Wrong password → 401.
- Five repeated failures → temporary lockout.
- Correct password during lockout → 423.
- Signup with weak password → validation error.
- Duplicate username → 409.
- Refresh token sent where access token is required → rejected.
- Logout removes browser tokens and returns to `/login`.

## F. Full workflow test

Follow the PRD's primary workflow:

```text
ingest indicator
    ↓
normalize + deduplicate
    ↓
enrich
    ↓
score
    ↓
alert rule
    ↓
alert
    ↓
incident correlation
    ↓
incident timeline
    ↓
report/export
```

Verify audit records exist for state-changing actions.

## G. Frontend quality gates

```bash
cd frontend
npm run lint
npm run build
```

## H. Docker validation

```bash
docker compose -f docker-compose.full.yml config
docker compose -f docker-compose.full.yml build
docker compose -f docker-compose.full.yml up
```

## I. PRD performance/security tracks

These are not proven by the normal local smoke test and should be run before calling the project production-ready:

- k6/Locust ingestion load test
- Elasticsearch p95 search test
- 200-concurrent-user test
- Trivy container scan
- dependency audit
- OWASP ZAP
- OpenAPI contract testing with Schemathesis
- Playwright end-to-end triage/enrich/escalate/report workflow

The PRD sets 80% coverage on core scoring/correlation/ingestion modules and <5 second realtime propagation as acceptance targets.
