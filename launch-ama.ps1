$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$viteScript = Join-Path $projectRoot "node_modules\vite\bin\vite.js"
$appPath = Join-Path $projectRoot "src-tauri\target\debug\tauri-app.exe"
$nodePath = (Get-Command node -ErrorAction Stop).Source

if (!(Test-Path $viteScript)) {
  throw "AMA dependencies are missing. Run npm install from the project folder first."
}

# A frontend build or cargo check does not update the desktop executable.
# Cargo rebuilds changed native commands and does nothing when already current.
$runningApp = Get-Process -Name 'tauri-app' -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $appPath }
if ($runningApp) {
  throw "AMA is already open. Save your work and close it before launching again."
}
Push-Location $projectRoot
try {
  & cargo build --manifest-path (Join-Path $projectRoot 'src-tauri\Cargo.toml')
  if ($LASTEXITCODE -ne 0) {
    throw "AMA could not be rebuilt. The previous executable has not been launched."
  }
} finally {
  Pop-Location
}

$vite = Start-Process -FilePath $nodePath -ArgumentList $viteScript -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru
try {
  for ($attempt = 0; $attempt -lt 15; $attempt++) {
    try {
      Invoke-WebRequest -Uri "http://localhost:1420" -UseBasicParsing -TimeoutSec 1 | Out-Null
      break
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  $app = Start-Process -FilePath $appPath -WorkingDirectory $projectRoot -PassThru
  $app.WaitForExit()
} finally {
  if (!$vite.HasExited) {
    Stop-Process -Id $vite.Id -Force
  }
}
