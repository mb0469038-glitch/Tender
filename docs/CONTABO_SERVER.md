# Contabo VPS Server & Deployment Guide

This document records the hardware specifications, access credentials, and initial deployment guide for the **Contabo VPS** running **Ubuntu 24.04 LTS** for hosting **TenderStudio**.

---

## 1. 🖥️ Server Specifications & Details

| Parameter | Specification / Value |
| :--- | :--- |
| **Provider** | [Contabo](https://contabo.com) |
| **Order ID** | `15390504` |
| **Status** | Provisioning (Estimated ~30 mins) |
| **Region** | Europe |
| **Operating System** | Ubuntu 24.04 LTS (64-bit) |
| **CPU** | 4 vCPU Cores |
| **RAM** | 8 GB RAM |
| **Storage** | 100 GB SSD |
| **Network Bandwidth** | Unlimited Traffic (Fair Use Policy) |
| **Port Speed** | 200 Mbit/s port |
| **IPv4 Address** | 1 Dedicated Public IP *(Assigned upon delivery in Contabo email)* |
| **Snapshots** | 1 Included Snapshot |
| **Private Networking** | None (Disabled / Free) |

---

## 2. 🔑 Access Credentials

> [!CAUTION]
> Keep these credentials safe! For maximum security, change the default root password after your first login and configure SSH Key-Based Authentication.

* **Default Username:** `root`
* **Default Root Password:** `M0ckermrx909`
* **SSH Port:** `22` (default)

### Connecting to the Server

Once Contabo sends your server IP address via email (e.g. `123.45.67.89`):

```bash
ssh root@<YOUR_SERVER_IP>
```
*When prompted, paste the password: `M0ckermrx909`*

---

## 3. 🛡️ Recommended First-Step Security Hardening

Once you log in for the first time, run these security steps:

### 1. Update the System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. (Optional but Recommended) Change Root Password
```bash
passwd root
```

### 3. Setup Firewall (UFW)
Only open the ports needed by SSH and TenderStudio (Web & SSL):
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Web App)
sudo ufw allow 443/tcp   # HTTPS (SSL)
sudo ufw enable
sudo ufw status
```

---

## 4. 🐳 Installing Docker & Docker Compose on Ubuntu 24.04

TenderStudio runs in Docker containers (`frontend`, `backend`, `postgres`). Install the official Docker engine:

```bash
# 1. Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release git

# 2. Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Install Docker and Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5. Verify installation
docker --version
docker compose version
```

---

## 5. 🚀 Deploying TenderStudio to the Server

### Step 1: Clone or Copy Your Code to the Server
```bash
# Clone your repository (or copy files using SCP/rsync)
git clone <YOUR_GIT_REPOSITORY_URL> /opt/tenderstudio
cd /opt/tenderstudio
```

*(Alternatively, if copying from your local Windows machine via PowerShell:)*
```powershell
scp -r c:\Users\mosta\Documents\TenderLastest root@<YOUR_SERVER_IP>:/opt/tenderstudio
```

### Step 2: Configure Environment Variables
Inside `/opt/tenderstudio/server/`, create or verify `.env`:
```env
PORT=4000
NODE_ENV=production
DATABASE_URL=postgres://postgres:postgrespassword@postgres:5432/tenderstudio
```

### Step 3: Launch Containers with Docker Compose
```bash
cd /opt/tenderstudio
docker compose up -d --build
```

### Step 4: Verify Deployment
Check that all 3 services (`tender-frontend`, `tender-backend`, `tender-postgres`) are running:
```bash
docker ps
```

### Step 5: Access the Application
Open your browser and navigate to:
👉 **`http://<YOUR_SERVER_IP>`**

* **Default Admin Username:** `admin`
* **Default Admin Password:** `admin123`

---

## 6. 🔄 Maintenance & Helpful Commands

| Action | Command |
| :--- | :--- |
| **View live logs** | `docker compose logs -f` |
| **Restart services** | `docker compose restart` |
| **Stop application** | `docker compose down` |
| **Rebuild after updates** | `git pull && docker compose up -d --build` |
| **Create Database Backup** | `docker exec -t tender-postgres pg_dump -U postgres tenderstudio > backup.sql` |
| **Restore Database Backup** | `cat backup.sql \| docker exec -i tender-postgres psql -U postgres -d tenderstudio` |
