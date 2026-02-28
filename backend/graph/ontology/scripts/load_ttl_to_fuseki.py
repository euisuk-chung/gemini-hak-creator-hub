"""Load TTL into Apache Fuseki for langgraph_structure."""

from __future__ import annotations

import os
from pathlib import Path

import click
import requests


@click.command()
@click.option("--ttl-file", default=None, help="TTL 파일 경로")
@click.option("--fuseki-url", default="http://localhost:3030", help="Fuseki 서버 URL")
@click.option("--dataset", default="korean-history", help="Fuseki 데이터셋 이름")
@click.option("--fuseki-user", default="admin", help="Fuseki 사용자명")
@click.option("--fuseki-password", default=None, help="Fuseki 비밀번호")
def main(ttl_file, fuseki_url, dataset, fuseki_user, fuseki_password):
    base_dir = Path(__file__).resolve().parents[1]
    default_ttl = base_dir / "instances" / "nvc_instances.ttl"
    ttl_path = Path(ttl_file) if ttl_file else default_ttl

    if not ttl_path.exists():
        raise click.ClickException(f"TTL 파일이 없습니다: {ttl_path}")

    if not fuseki_password:
        fuseki_password = (
            os.getenv("FUSEKI_PASSWORD")
            or os.getenv("FUSEKI_ADMIN_PASSWORD")
            or "fuseki1234"
        )

    auth = (fuseki_user, fuseki_password)

    click.echo(f"[INFO] TTL: {ttl_path}")
    click.echo(f"[INFO] Fuseki: {fuseki_url}/{dataset}")

    # 1) Fuseki 연결 확인
    try:
        r = requests.get(fuseki_url, timeout=5)
        if r.status_code >= 500:
            raise click.ClickException("Fuseki 서버가 정상 응답하지 않습니다.")
    except requests.RequestException as exc:
        raise click.ClickException(f"Fuseki 연결 실패: {exc}")

    # 2) 데이터셋 생성 (없으면)
    ds_res = requests.get(f"{fuseki_url}/{dataset}", auth=auth, timeout=5)
    if ds_res.status_code == 404:
        create_res = requests.post(
            f"{fuseki_url}/$/datasets",
            auth=auth,
            data={"dbName": dataset, "dbType": "tdb2"},
            timeout=10,
        )
        if create_res.status_code not in (200, 201):
            raise click.ClickException(
                f"데이터셋 생성 실패: {create_res.status_code} {create_res.text[:200]}"
            )
        click.echo(f"[INFO] 데이터셋 생성 완료: {dataset}")

    # 3) 기존 데이터 삭제
    clear_res = requests.post(
        f"{fuseki_url}/{dataset}/update",
        auth=auth,
        headers={"Content-Type": "application/sparql-update"},
        data="DELETE WHERE { ?s ?p ?o }",
        timeout=20,
    )
    if clear_res.status_code not in (200, 204):
        raise click.ClickException(
            f"기존 데이터 삭제 실패: {clear_res.status_code} {clear_res.text[:200]}"
        )

    # 4) TTL 업로드
    with ttl_path.open("rb") as f:
        upload_res = requests.post(
            f"{fuseki_url}/{dataset}/data",
            auth=auth,
            headers={"Content-Type": "text/turtle"},
            data=f,
            timeout=60,
        )

    if upload_res.status_code not in (200, 201):
        raise click.ClickException(
            f"TTL 업로드 실패: {upload_res.status_code} {upload_res.text[:400]}"
        )

    # 5) 트리플 수 확인
    count_res = requests.post(
        f"{fuseki_url}/{dataset}/sparql",
        auth=auth,
        data={"query": "SELECT (COUNT(*) AS ?count) WHERE { ?s ?p ?o }"},
        headers={"Accept": "application/sparql-results+json"},
        timeout=20,
    )

    if count_res.status_code == 200:
        try:
            bindings = count_res.json().get("results", {}).get("bindings", [])
            count = bindings[0]["count"]["value"] if bindings else "unknown"
            click.echo(f"[OK] 업로드 완료. Triple count: {count}")
        except Exception:
            click.echo("[OK] 업로드 완료. Triple count 파싱 실패")
    else:
        click.echo("[OK] 업로드 완료. Triple count 조회 실패")


if __name__ == "__main__":
    main()
