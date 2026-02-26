# Backend

FastAPI backend for auth, property search, AI orchestration, and scheduling APIs.

## Planned scope
- Authentication and user management
- Property and lead CRUD APIs
- Agent orchestration endpoints
- Integrations with OpenAI, CRM, and Maps

## Testing

Run backend checks from the repo root:

```bash
./tools/scripts/run_checks.sh
```

This runs:
- Python bytecode compilation for scaffolded Python modules
- `pytest` health endpoint tests
