# Archive

This folder stores local or historical SQL dumps that are **not** used by Docker runtime migrations.

- `data_full_dump_local_only.sql` is a full dump with destructive statements (`DROP TABLE`, data imports).
- Do **not** execute archived dumps directly on production databases.

For production-safe updates, use:

- `../safe_schema_sync_v2_4.sql` (existing DB sync)
- `../safe_schema_full_completion_v2_4.sql` (new DB bootstrap)
