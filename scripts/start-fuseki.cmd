@echo off
setlocal

REM Defaults (override with env vars if needed)
if "%FUSEKI_HOME%"=="" set "FUSEKI_HOME=C:\Windows\apache-jena-fuseki-6.0.0"
if "%FUSEKI_DATASET%"=="" set "FUSEKI_DATASET=hackathon_nvc_dataset"
if "%FUSEKI_DATA_DIR%"=="" set "FUSEKI_DATA_DIR=.\data\hackathon_nvc_dataset"
if "%FUSEKI_PORT%"=="" set "FUSEKI_PORT=3030"
if "%FUSEKI_URL%"=="" set "FUSEKI_URL=http://localhost:%FUSEKI_PORT%"
if "%FUSEKI_USER%"=="" set "FUSEKI_USER=admin"
if "%FUSEKI_PASSWORD%"=="" set "FUSEKI_PASSWORD=hackathon1234"
if "%FUSEKI_TTL_FILE%"=="" set "FUSEKI_TTL_FILE=backend\graph\ontology\instances\nvc_instances.ttl"

set "ROOT_DIR=%~dp0.."
pushd "%ROOT_DIR%"

echo [1/3] Checking Fuseki on port %FUSEKI_PORT%...
netstat -ano | findstr ":%FUSEKI_PORT%" >nul
if %ERRORLEVEL% EQU 0 (
  echo Fuseki already running. Skip start.
) else (
  echo [2/3] Starting Fuseki in background...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-fuseki.ps1" -FusekiHome "%FUSEKI_HOME%" -DatasetName "%FUSEKI_DATASET%" -DatasetDir "%FUSEKI_DATA_DIR%" -Port %FUSEKI_PORT% -Detached
  if %ERRORLEVEL% NEQ 0 (
    echo Failed to start Fuseki.
    popd
    exit /b 1
  )

  echo Waiting for Fuseki to be ready...
  powershell -NoProfile -Command "$deadline=(Get-Date).AddSeconds(30); while((Get-Date)-lt $deadline){ try{ $r=Invoke-WebRequest -UseBasicParsing -Uri '%FUSEKI_URL%'; if($r.StatusCode -ge 200){ exit 0 } } catch {}; Start-Sleep -Milliseconds 500 }; exit 1"
  if %ERRORLEVEL% NEQ 0 (
    echo Fuseki readiness check timed out.
    popd
    exit /b 1
  )
)

echo [3/3] Loading TTL into /%FUSEKI_DATASET%...
python -m backend.graph.ontology.scripts.load_ttl_to_fuseki --ttl-file "%FUSEKI_TTL_FILE%" --fuseki-url "%FUSEKI_URL%" --dataset "%FUSEKI_DATASET%" --fuseki-user "%FUSEKI_USER%" --fuseki-password "%FUSEKI_PASSWORD%"
if %ERRORLEVEL% NEQ 0 (
  echo TTL load failed.
  popd
  exit /b 1
)

echo Done. Fuseki is running and TTL is loaded.
popd
exit /b 0
