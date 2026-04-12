# EC2 rebuild guide

Use this when replacing the whole EC2 instance.

## 1. Before deleting the old instance

Download anything you cannot recreate:

```bash
cd ~/Voleena-Online-Ordering-System
docker exec mysql_db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers --databases "$MYSQL_DATABASE"' > voleena_backup.sql
cp server/.env server.env.backup
```

If you want a totally fresh database, you do not need to restore `voleena_backup.sql`.

## 2. Create the new EC2 instance

Recommended basics:

- Ubuntu Server 22.04 or 24.04
- Instance type: `t3.micro`
- Storage: at least 20 GB
- Security group inbound:
  - SSH `22` from your IP only
  - Frontend `5173` from `0.0.0.0/0`
  - Backend `3001` only if you need direct API debugging

After launch, use the public IPv4 address when SSHing into the instance. The
self-hosted runner handles deploys after it is registered.

## 3. Install Docker and Git

SSH into the new instance:

```bash
ssh -i your-key.pem ubuntu@<new-ec2-public-ip>
```

Then run:

```bash
sudo apt update
sudo apt install -y git ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
sudo reboot
```

Reconnect after reboot.

## 4. Add small swap space

This helps `t3.micro` avoid memory pressure:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 5. Clone the repo

```bash
cd ~
git clone https://github.com/malanchanukaherath/Voleena-Online-Ordering-System.git
cd ~/Voleena-Online-Ordering-System
```

## 6. Create the backend environment file

```bash
cp server/.env.example server/.env
nano server/.env
```

Make sure the DB values match Docker Compose:

```env
DB_HOST=db
DB_PORT=3306
DB_NAME=voleena_foods_db
DB_USER=voleena_user
DB_PASSWORD=voleena
NODE_ENV=production
FRONTEND_URL=http://<new-ec2-public-ip>:5173
BACKEND_URL=http://<new-ec2-public-ip>:3001
```

Fill in the real JWT, email, payment, Cloudinary, and maps values you need.

## 7. First deploy with fresh DB and login users

Do not build on the EC2 instance. Pull the images from Docker Hub:

```bash
cd ~/Voleena-Online-Ordering-System
git fetch origin
git pull --ff-only origin main
chmod +x deploy-ec2.sh scripts/deploy-ec2.sh
sed -i 's/\r$//' deploy-ec2.sh scripts/deploy-ec2.sh
DEPLOY_STRATEGY=pull DOCKERHUB_USERNAME=<dockerhub-user> IMAGE_TAG=latest RUN_ACCOUNT_SEED=true TARGET_BRANCH=main ./deploy-ec2.sh
```

If your Docker Hub images are private:

```bash
export DOCKERHUB_TOKEN='<dockerhub-token>'
DEPLOY_STRATEGY=pull DOCKERHUB_USERNAME=<dockerhub-user> IMAGE_TAG=latest RUN_ACCOUNT_SEED=true TARGET_BRANCH=main ./deploy-ec2.sh
```

The fresh MySQL volume initializes from `database/safe_schema_full_completion_v2_4.sql`.
The account seed creates or updates:

- `admin@gmail.com` / `Admin@123`
- `cashier@gmail.com` / `Cashier@123`
- `kitchen@gmail.com` / `Kitchen@123`
- `delivery@gmail.com` / `Delivery@123`
- `sanjani@gmail.com` / `Sanjani@123`

## 8. GitHub Actions setup

This repo deploys from an EC2 self-hosted runner. Follow
`docs/ec2-self-hosted-runner.md` after creating the instance.

Required repository secrets:

- `DOCKER_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub token

The old SSH deploy secrets are not needed for self-hosted deploy:

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_PRIVATE_KEY`

After this, every push to `main` should deploy automatically.

For the first manual workflow run after rebuilding EC2, use **Run workflow** and set
`seed_accounts` to `true`. Leave it as `false` for normal deploys.

## Notes

`database/Full SQL File.sql` is a raw schema dump and currently has no `INSERT INTO` seed rows. Avoid applying raw dump files to a live database unless you intentionally want destructive `DROP TABLE` behavior.
