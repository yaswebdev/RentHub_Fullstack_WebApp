$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $root 'backend\.env'

if (-not (Test-Path $envFile)) {
  Write-Error ".env not found at $envFile"
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if (-not $line -or $line.StartsWith('#')) { return }

  $parts = $line -split '=', 2
  if ($parts.Length -ne 2) { return }

  $key = $parts[0].Trim()
  $value = $parts[1].Trim()

  if ($value.StartsWith('"') -and $value.EndsWith('"')) {
    $value = $value.Substring(1, $value.Length - 2)
  }

  [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
}

Set-Location (Join-Path $root 'backend\\com.renthub')
.\mvnw.cmd spring-boot:run
