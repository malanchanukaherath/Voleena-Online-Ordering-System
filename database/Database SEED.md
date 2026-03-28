docker compose up -d

docker compose --profile init up --abort-on-container-exit db_sync backend_seed

docker compose --profile init down
