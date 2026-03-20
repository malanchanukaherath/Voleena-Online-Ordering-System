Get-Content -Raw database/safe_schema_sync_v2_4.sql | docker exec -i mysql_db mysql -uuser -ppassword voleena_foods_db

docker exec -it backend_app node seed_roles_and_staff.js