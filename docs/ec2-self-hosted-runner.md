# EC2 self-hosted runner deploy guide

This project uses GitHub-hosted runners for Docker image builds and the EC2
self-hosted runner only for deployment. That keeps heavy builds off the
`t3.micro`.

Only use this runner for trusted branches. A self-hosted runner can access the
EC2 machine, Docker, and local deployment files.

## Workflow shape

- Build job: `ubuntu-latest`
- Deploy job: `[self-hosted, linux, x64, voleena-ec2]`
- Deploy action: pull Docker Hub images and run `scripts/deploy-ec2.sh` locally

## GitHub secrets

Keep:

- `DOCKER_USERNAME`
- `DOCKERHUB_TOKEN`

You do not need these for self-hosted deploy anymore:

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_PRIVATE_KEY`

## EC2 setup

SSH into the EC2 instance:

```bash
ssh -i your-key.pem ubuntu@<ec2-public-ip>
```

Install Docker and Git:

```bash
sudo apt update
sudo apt install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
sudo reboot
```

Reconnect, then add swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Clone the deploy repo:

```bash
cd ~
git clone https://github.com/malanchanukaherath/Voleena-Online-Ordering-System.git
cd ~/Voleena-Online-Ordering-System
cp server/.env.example server/.env
nano server/.env
```

Set at least these values in `server/.env`:

```env
DB_HOST=db
DB_PORT=3306
DB_NAME=voleena_foods_db
DB_USER=voleena_user
DB_PASSWORD=voleena
NODE_ENV=production
FRONTEND_URL=http://<ec2-public-ip>:5173
BACKEND_URL=http://<ec2-public-ip>:3001
```

## Register the runner

In GitHub:

1. Open the repository.
2. Go to **Settings** > **Actions** > **Runners**.
3. Click **New self-hosted runner**.
4. Choose **Linux** and **x64**.
5. Run the generated download and configure commands on EC2.

When configuring, add this custom label:

```text
voleena-ec2
```

If you configure manually, the command shape is:

```bash
mkdir -p ~/actions-runner
cd ~/actions-runner
# Run the GitHub-provided curl/tar download command here.
./config.sh --url https://github.com/malanchanukaherath/Voleena-Online-Ordering-System --token <github-runner-token> --name voleena-ec2 --labels voleena-ec2 --work _work
sudo ./svc.sh install ubuntu
sudo ./svc.sh start
sudo ./svc.sh status
```

Use the real token from GitHub's runner setup page. It expires quickly.

Check Docker access for the runner user:

```bash
docker ps
```

If Docker says permission denied, run:

```bash
sudo usermod -aG docker ubuntu
sudo systemctl restart actions.runner.*.service
```

## First deploy

Push the repo changes to `main`, then run the workflow manually:

1. Go to **Actions** > **EC2 Deploy**.
2. Click **Run workflow**.
3. Set `seed_accounts` to `true`.
4. Set `run_v27_addon_migration` to `true` for the first deploy that should apply `database/migration_v2.7_addon_admin_safety_baseline.sql`.
5. Keep `run_db_sync` as needed for reviewed `safe_schema_sync_v2_4.sql` updates.
6. Run it.

This seeds:

- `admin@gmail.com` / `Admin@123`
- `cashier@gmail.com` / `Cashier@123`
- `kitchen@gmail.com` / `Kitchen@123`
- `delivery@gmail.com` / `Delivery@123`
- `sanjani@gmail.com` / `Sanjani@123`

For normal deploys after that, leave `seed_accounts` as `false`. Pushes to
`main` will deploy automatically.

## Manual fallback

Run this on EC2 only if GitHub Actions is unavailable:

```bash
cd ~/Voleena-Online-Ordering-System
git fetch origin
git pull --ff-only origin main
DEPLOY_STRATEGY=pull DOCKERHUB_USERNAME=<dockerhub-user> IMAGE_TAG=latest TARGET_BRANCH=main ./deploy-ec2.sh
```
