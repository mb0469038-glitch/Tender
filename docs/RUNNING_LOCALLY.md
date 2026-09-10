# Running the Project Locally (Non-Technical & AI Guide)

> **Notice for AI Assistants:**  
> If the user asks you to run, test, or launch this project locally, follow **Method 1 (Docker Mode)**. Execute `docker compose up -d --build`, verify container health with `docker ps`, and instruct the user to visit `http://localhost`.

---

## ⚡ Method 1: The One-Command Docker Setup (Recommended)

This is the easiest, most reliable way to run the entire project. It runs the **Web App**, the **Backend API**, and the **PostgreSQL Database** in isolated containers without needing to configure databases or dependencies manually.

### Step 1: Ensure Docker Desktop is Running
* Open **Docker Desktop** from your Windows Start Menu.
* Wait until the bottom-left icon in Docker Desktop turns **green** (*Engine running*).

### Step 2: Run the Project
Open PowerShell or Command Prompt inside this project folder and run:

```bash
docker compose up -d --build
```

*(This command builds and starts all containers in the background).*

### Step 3: Open the Application
Open your web browser (Chrome, Edge, etc.) and go to:

👉 **[http://localhost](http://localhost)**

### 🔑 Default Login Credentials:
* **Username:** `admin`
* **Password:** `admin123`

---

## 🛠 Useful Docker Commands

| What you want to do | Command to run |
| :--- | :--- |
| **Check if containers are running** | `docker ps` |
| **View live system logs** | `docker compose logs -f` |
| **Stop the application** | `docker compose down` |
| **Restart the application** | `docker compose restart` |
| **Clean restart (reset database to defaults)** | `docker compose down -v` then `docker compose up -d --build` |

---

## 💻 Method 2: Running Without Docker (Bare Metal Development)

If you are developing features directly without Docker containers, you need two terminal windows:

### Terminal 1: Backend Server & PostgreSQL
1. Ensure a local PostgreSQL server is running on port `5432` with a database named `tenderstudio`.
2. Open terminal in `server/`:
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *(Backend API runs on `http://localhost:4000`)*.

### Terminal 2: Frontend Web App
1. Open terminal in the project root:
   ```bash
   npm install
   npm run dev
   ```
2. Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🖥 Method 3: Desktop App Mode (Tauri)

To run as a native Windows desktop executable (`.exe`):
1. Ensure Rust and the C++ Build Tools are installed.
2. Run:
   ```bash
   npm run tauri dev
   ```

---

## ❓ Troubleshooting Common Issues

### 1. "Docker Desktop - WSL not installed"
* **Solution:** Open PowerShell as Administrator and run:
  ```powershell
  wsl --install --no-distribution
  ```
  Then restart your computer and launch Docker Desktop again.

### 2. "Port 80 is already in use"
* **Cause:** Another program on your Windows PC (like IIS or Skype) is using port 80.
* **Solution:** Open `docker-compose.yml`, change the frontend ports line from:
  ```yaml
  ports:
    - "80:80"
  ```
  to:
  ```yaml
  ports:
    - "3000:80"
  ```
  Then run `docker compose up -d` and open **[http://localhost:3000](http://localhost:3000)**.

### 3. "PowerShell script execution disabled (UnauthorizedAccess)"
* **Solution:** Prefix commands with `cmd.exe /c` (e.g. `cmd.exe /c npm run build`), or open PowerShell as Administrator and run:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```
