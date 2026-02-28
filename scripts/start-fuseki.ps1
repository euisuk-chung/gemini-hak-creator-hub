param(
    [string]$FusekiHome = $(if ($env:FUSEKI_HOME) { $env:FUSEKI_HOME } else { "C:\Windows\apache-jena-fuseki-6.0.0" }),
    [string]$DatasetName = $(if ($env:FUSEKI_DATASET) { $env:FUSEKI_DATASET } else { "hackathon_nvc_dataset" }),
    [string]$DatasetDir = $(if ($env:FUSEKI_DATA_DIR) { $env:FUSEKI_DATA_DIR } else { ".\data\hackathon_nvc_dataset" }),
    [int]$Port = $(if ($env:FUSEKI_PORT) { [int]$env:FUSEKI_PORT } else { 3030 }),
    [switch]$Detached
)

$ErrorActionPreference = "Stop"

$serverBat = Join-Path $FusekiHome "fuseki-server.bat"
if (-not (Test-Path $serverBat)) {
    throw "fuseki-server.bat not found: $serverBat"
}

$args = @(
    "--port=$Port"
    "--update"
    "--tdb2"
    "--loc=$DatasetDir"
    "/$DatasetName"
)

Write-Host "Starting Fuseki..."
Write-Host "  Home: $FusekiHome"
Write-Host "  Port: $Port"
Write-Host "  Dataset: /$DatasetName"
Write-Host "  TDB2 path: $DatasetDir"

if ($Detached) {
    Start-Process -FilePath $serverBat -ArgumentList $args -WorkingDirectory $FusekiHome | Out-Null
    Write-Host "Fuseki started in background."
}
else {
    Push-Location $FusekiHome
    try {
        & $serverBat @args
    }
    finally {
        Pop-Location
    }
}
