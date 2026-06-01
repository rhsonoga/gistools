from __future__ import annotations

import shutil
import zipfile
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from uuid import uuid4

from flask import Flask, jsonify, request, send_file, send_from_directory
from werkzeug.utils import secure_filename

from hpdb_converter.session_engine import SessionEngine
try:
    from boq_converter.web_api import boq_bp
except Exception as exc:
    boq_bp = None
    print(f"BOQ web API tidak aktif: {exc}")


ROOT_DIR = Path(__file__).resolve().parent
ALLOWED_EXTENSIONS = {".kmz", ".zip", ".kml"}


@dataclass
class SessionRecord:
    session_id: str
    upload_dir: Path
    engine: SessionEngine
    source_file_name: str
    engine_source_name: str
    logs: list[str] = field(default_factory=list)
    step1_done: bool = False
    step2_done: bool = False
    step3_done: bool = False


app = Flask(__name__, static_folder=str(ROOT_DIR), static_url_path="")
_sessions: dict[str, SessionRecord] = {}

if boq_bp is not None:
    app.register_blueprint(boq_bp, url_prefix="/api/boq")


def _json_error(message: str, status_code: int = 400):
    return jsonify({"ok": False, "error": message}), status_code


def _allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def _get_session(session_id: str) -> SessionRecord | None:
    return _sessions.get(session_id)


def _session_payload(session: SessionRecord) -> dict[str, Any]:
    engine = session.engine
    return {
        "session_id": session.session_id,
        "source_file_name": session.source_file_name,
        "engine_source_name": session.engine_source_name,
        "convert_file": str(engine.convert_file),
        "hpdb_file": str(engine.hpdb_file),
        "step1_done": session.step1_done,
        "step2_done": session.step2_done,
        "step3_done": session.step3_done,
        "logs": session.logs,
    }


def _create_session(uploaded_file) -> SessionRecord:
    original_name = secure_filename(uploaded_file.filename or "source.kmz") or "source.kmz"
    if not _allowed_file(original_name):
        raise ValueError("File harus berformat KMZ, ZIP, atau KML.")

    session_id = uuid4().hex
    upload_dir = Path(tempfile.gettempdir()) / "web_tools_hpdb_uploads" / session_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    source_path = upload_dir / original_name
    uploaded_file.save(source_path)

    engine_source_name = original_name
    source_for_engine = source_path

    if source_path.suffix.lower() == ".kml":
        engine_source_name = f"{source_path.stem}.kmz"
        source_for_engine = upload_dir / engine_source_name
        with zipfile.ZipFile(source_for_engine, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.write(source_path, arcname=source_path.name)

    engine = SessionEngine(str(source_for_engine))
    engine_source_path = Path(engine.work_dir) / engine_source_name
    shutil.copy2(source_for_engine, engine_source_path)
    engine.kmz_path = str(engine_source_path)

    record = SessionRecord(
        session_id=session_id,
        upload_dir=upload_dir,
        engine=engine,
        source_file_name=original_name,
        engine_source_name=engine_source_name,
    )
    record.logs.append(f"File siap: {original_name}")
    _sessions[session_id] = record
    return record


def _cleanup_session(session: SessionRecord) -> None:
    shutil.rmtree(session.upload_dir, ignore_errors=True)
    shutil.rmtree(Path(session.engine.work_dir), ignore_errors=True)


@app.get("/")
def home():
    return send_from_directory(ROOT_DIR, "index.html")


@app.get("/boq")
def boq_home():
    return send_from_directory(ROOT_DIR / "boq_converter", "boq_page.html")


@app.post("/api/session")
def create_session():
    uploaded_file = request.files.get("kmz")
    if not uploaded_file or not uploaded_file.filename:
        return _json_error("File KMZ belum dipilih.")

    try:
        session = _create_session(uploaded_file)
    except ValueError as exc:
        return _json_error(str(exc))
    except Exception as exc:
        return _json_error(f"Gagal membuat sesi: {exc}", 500)

    return jsonify({"ok": True, **_session_payload(session)})


@app.post("/api/session/<session_id>/step/1")
def run_step1(session_id: str):
    session = _get_session(session_id)
    if not session:
        return _json_error("Session tidak ditemukan.", 404)

    try:
        session.engine.step1_convert()
        session.step1_done = True
        message = f"Step 1 selesai: {Path(session.engine.convert_file).name}"
        session.logs.append(message)
        return jsonify({"ok": True, "message": message, **_session_payload(session)})
    except Exception as exc:
        session.logs.append(f"Error Step 1: {exc}")
        return _json_error(f"Step 1 gagal: {exc}", 500)


@app.post("/api/session/<session_id>/step/2")
def run_step2(session_id: str):
    session = _get_session(session_id)
    if not session:
        return _json_error("Session tidak ditemukan.", 404)
    if not session.step1_done:
        return _json_error("Step 1 harus dijalankan dulu.", 400)

    try:
        hpdb_path = session.engine.step2_inject_basic()
        session.step2_done = True
        message = f"Step 2 selesai: {Path(hpdb_path).name}"
        session.logs.append(message)
        return jsonify({"ok": True, "message": message, "hpdb_file": hpdb_path, **_session_payload(session)})
    except Exception as exc:
        session.logs.append(f"Error Step 2: {exc}")
        return _json_error(f"Step 2 gagal: {exc}", 500)


@app.post("/api/session/<session_id>/step/3")
def run_step3(session_id: str):
    session = _get_session(session_id)
    if not session:
        return _json_error("Session tidak ditemukan.", 404)
    if not session.step2_done:
        return _json_error("Step 2 harus dijalankan dulu.", 400)

    try:
        session.engine.step3_sync_pole()
        session.step3_done = True
        message = f"Step 3 selesai: {Path(session.engine.hpdb_file).name}"
        session.logs.append(message)
        return jsonify({"ok": True, "message": message, **_session_payload(session)})
    except Exception as exc:
        session.logs.append(f"Error Step 3: {exc}")
        return _json_error(f"Step 3 gagal: {exc}", 500)


@app.get("/api/session/<session_id>/download/<kind>")
def download_result(session_id: str, kind: str):
    session = _get_session(session_id)
    if not session:
        return _json_error("Session tidak ditemukan.", 404)

    if kind == "step1":
        file_path = Path(session.engine.convert_file)
    elif kind in {"final", "step2"}:
        file_path = Path(session.engine.hpdb_file)
    else:
        return _json_error("Jenis download tidak dikenal.", 400)

    if not file_path.exists():
        return _json_error("File hasil belum tersedia.", 404)

    return send_file(file_path, as_attachment=True, download_name=file_path.name)


@app.post("/api/session/<session_id>/reset")
def reset_session(session_id: str):
    session = _get_session(session_id)
    if not session:
        return jsonify({"ok": True, "message": "Session sudah tidak aktif."})

    _cleanup_session(session)
    _sessions.pop(session_id, None)
    return jsonify({"ok": True, "message": "Session di-reset."})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
