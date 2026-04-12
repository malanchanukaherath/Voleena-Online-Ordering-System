Database folder usage (production-safe)

- `safe_schema_full_completion_v2_4.sql`: full idempotent schema for new/empty databases.
- `safe_schema_sync_v2_4.sql`: additive sync for existing databases (use this in EC2 deployments).
- `archive/data_full_dump_local_only.sql`: local development dump only. Do not apply on production.

Recommended seed/sync sequence:

```bash
docker compose up -d db
docker compose --profile init run --rm db_sync
docker compose --profile init run --rm backend_seed
```

Avoid applying raw full dumps that contain `DROP TABLE` statements on live environments.
