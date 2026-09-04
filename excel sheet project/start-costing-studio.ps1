$ErrorActionPreference = 'Stop'

$projectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$applicationUrl = 'http://127.0.0.1:5173/'

try {
    Invoke-WebRequest -UseBasicParsing -Uri $applicationUrl -TimeoutSec 1 | Out-Null
} catch {
    Start-Process -FilePath 'cmd.exe' `
        -ArgumentList '/c', 'npm run dev -- --host 127.0.0.1' `
        -WorkingDirectory $projectDirectory `
        -WindowStyle Hidden

    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        Start-Sleep -Milliseconds 500
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $applicationUrl -TimeoutSec 1 | Out-Null
            $ready = $true
            break
        } catch {
            # The development server is still starting.
        }
    }

    if (-not $ready) {
        Add-Type -AssemblyName PresentationFramework
        [System.Windows.MessageBox]::Show(
            'Costing Studio could not start. Run npm install in the project folder and try again.',
            'Costing Studio'
        ) | Out-Null
        exit 1
    }
}

Start-Process $applicationUrl
