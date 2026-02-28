## Fuseki quick start

### Windows

프로젝트 루트에서:

```powershell
.\scripts\start-fuseki.cmd
```

위 명령은 자동으로 아래를 수행합니다.
1. Fuseki 미실행 시 백그라운드 실행
2. `/hackathon_nvc_dataset` 데이터셋으로 TTL 적재

Fuseki만 직접 실행하려면:

```powershell
.\scripts\start-fuseki.ps1
```

### macOS / Linux

Fuseki 수동 실행:

```bash
cd /path/to/apache-jena-fuseki
./fuseki-server --port=3030 --update --tdb2 --loc=./data/hackathon_nvc_dataset /hackathon_nvc_dataset
```

다른 터미널에서 TTL 적재:

```bash
python -m backend.graph.ontology.scripts.load_ttl_to_fuseki \
  --ttl-file backend/graph/ontology/instances/nvc_instances.ttl \
  --fuseki-url http://localhost:3030 \
  --dataset hackathon_nvc_dataset \
  --fuseki-user admin \
  --fuseki-password hackathon1234
```

### Optional env vars (Windows)

```powershell
$env:FUSEKI_HOME="C:\Windows\apache-jena-fuseki-6.0.0"
$env:FUSEKI_DATASET="hackathon_nvc_dataset"
$env:FUSEKI_DATA_DIR=".\data\hackathon_nvc_dataset"
$env:FUSEKI_PORT="3030"
$env:FUSEKI_URL="http://localhost:3030"
$env:FUSEKI_USER="admin"
$env:FUSEKI_PASSWORD="hackathon1234"
$env:FUSEKI_TTL_FILE="backend\graph\ontology\instances\nvc_instances.ttl"
.\scripts\start-fuseki.cmd
```
