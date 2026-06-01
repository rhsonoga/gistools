from __future__ import annotations

import tempfile
import zipfile
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
  sys.path.insert(0, str(ROOT_DIR))

from app import app


def build_sample_kmz(target_path: Path) -> None:
    kml_content = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <Folder>
      <name>CABLE</name>
      <Placemark>
        <name>CABLE LINE A 24C/12T</name>
        <description>Total Route = 123 M</description>
        <Point><coordinates>106.8000,-6.2000,0</coordinates></Point>
      </Placemark>
    </Folder>
    <Folder>
      <name>HP COVER</name>
      <Placemark>
        <name>HP-001</name>
        <description>HP cover sample</description>
        <Point><coordinates>106.8001,-6.2001,0</coordinates></Point>
      </Placemark>
    </Folder>
    <Folder>
      <name>FAT</name>
      <Placemark>
        <name>FAT-001</name>
        <description>FAT sample</description>
        <Point><coordinates>106.8002,-6.2002,0</coordinates></Point>
      </Placemark>
    </Folder>
    <Folder>
      <name>POLE</name>
      <Placemark>
        <name>POLE-001</name>
        <description>Pole sample</description>
        <Point><coordinates>106.8002,-6.2002,0</coordinates></Point>
      </Placemark>
    </Folder>
  </Document>
</kml>
"""
    with zipfile.ZipFile(target_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("sample.kml", kml_content)


def main() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        sample_kmz = Path(temp_dir) / "sample_hpdb.kmz"
        build_sample_kmz(sample_kmz)

        client = app.test_client()

        with sample_kmz.open("rb") as handle:
            create_response = client.post(
                "/api/session",
                data={"kmz": (handle, sample_kmz.name)},
                content_type="multipart/form-data",
            )
        assert create_response.status_code == 200, create_response.data
        create_data = create_response.get_json()
        assert create_data["ok"] is True, create_data
        session_id = create_data["session_id"]

        step1_response = client.post(f"/api/session/{session_id}/step/1")
        assert step1_response.status_code == 200, step1_response.data
        step1_data = step1_response.get_json()
        assert step1_data["step1_done"] is True, step1_data

        step2_response = client.post(f"/api/session/{session_id}/step/2")
        assert step2_response.status_code == 200, step2_response.data
        step2_data = step2_response.get_json()
        assert step2_data["step2_done"] is True, step2_data

        step3_response = client.post(f"/api/session/{session_id}/step/3")
        assert step3_response.status_code == 200, step3_response.data
        step3_data = step3_response.get_json()
        assert step3_data["step3_done"] is True, step3_data

        download_step1 = client.get(f"/api/session/{session_id}/download/step1")
        assert download_step1.status_code == 200, download_step1.data
        assert "attachment" in download_step1.headers.get("Content-Disposition", "")

        download_final = client.get(f"/api/session/{session_id}/download/final")
        assert download_final.status_code == 200, download_final.data
        assert "attachment" in download_final.headers.get("Content-Disposition", "")

        reset_response = client.post(f"/api/session/{session_id}/reset")
        assert reset_response.status_code == 200, reset_response.data

        print("hpdb smoke test ok")


if __name__ == "__main__":
    main()
