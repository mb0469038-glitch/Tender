$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$viteScript = Join-Path $projectRoot "node_modules\vite\bin\vite.js"
$appPath = Join-Path $projectRoot "src-tauri\target\debug\tauri-app.exe"
$nodePath = (Get-Command node -ErrorAction Stop).Source

if (!(Test-Path $viteScript) -or !(Test-Path $appPath)) {
  throw "AMA is not ready to launch. Run npm install and npm run tauri dev from the project folder first."
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
