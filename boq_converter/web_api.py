from __future__ import annotations

import shutil
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from uuid import uuid4

from flask import Blueprint, jsonify, request, send_file
from werkzeug.utils import secure_filename

from .main import convert


boq_bp = Blueprint("boq", __name__)

ALLOWED_EXTENSIONS = {".kmz", ".zip", ".kml"}


@dataclass
class BoqSessionRecord:
    session_id: str
    upload_dir: Path
    source_path: Path
    source_file_name: str
    logs: list[str] = field(default_factory=list)
    converted_path: Path | None = None
    final_path: Path | None = None


_sessions: dict[str, BoqSessionRecord] = {}


def _json_error(message: str, status_code: int = 400):
    return jsonify({"ok": False, "error": message}), status_code


def _allowed_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def _session_payload(session: BoqSessionRecord) -> dict[str, Any]:
    return {
        "ok": True,
        "session_id": session.session_id,
        "source_file_name": session.source_file_name,
        "has_converted": bool(session.converted_path and session.converted_path.exists()),
        "has_final": bool(session.final_path and session.final_path.exists()),
        "logs": session.logs,
    }


def _cleanup_session_files(session: BoqSessionRecord) -> None:
    paths_to_remove = [session.upload_dir]

    if session.converted_path:
        paths_to_remove.append(session.converted_path.parent)
    if session.final_path:
        paths_to_remove.append(session.final_path.parent)

    seen: set[str] = set()
    for path in paths_to_remove:
        path_str = str(path)
        if path_str in seen:
            continue
        seen.add(path_str)
        shutil.rmtree(path, ignore_errors=True)


@boq_bp.route("/session", methods=["POST"])
def create_session():
    uploaded = request.files.get("kmz")
    if uploaded is None:
        return _json_error("File KMZ wajib diunggah.", 400)

    raw_name = uploaded.filename or "source.kmz"
    source_name = secure_filename(raw_name) or "source.kmz"

    if not _allowed_file(source_name):
        return _json_error("File harus berformat KMZ, ZIP, atau KML.", 400)

    session_id = uuid4().hex
    upload_dir = Path(tempfile.gettempdir()) / "web_tools_boq_uploads" / session_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    source_path = upload_dir / source_name
    uploaded.save(source_path)

    session = BoqSessionRecord(
        session_id=session_id,
        upload_dir=upload_dir,
        source_path=source_path,
        source_file_name=source_name,
        logs=[f"File siap diproses: {source_name}"],
    )
    _sessions[session_id] = session

    return jsonify(_session_payload(session))


@boq_bp.route("/session/<session_id>/process", methods=["POST"])
def process_session(session_id: str):
    session = _sessions.get(session_id)
    if session is None:
        return _json_error("Session BOQ tidak ditemukan.", 404)

    mode = str(request.form.get("mode", "CLUSTER")).upper()
    if mode not in {"CLUSTER", "FEEDER"}:
        return _json_error("Mode tidak valid. Gunakan CLUSTER atau FEEDER.", 400)

    try:
        converted, final = convert(str(session.source_path), mode=mode)
    except Exception as exc:
        session.logs = [f"Gagal memproses BOQ: {exc}"]
        return _json_error(str(exc), 500)

    session.converted_path = Path(converted)
    session.final_path = Path(final)
    session.logs = [
        f"Mode dipilih: {mode}",
        "Memulai parsing KMZ...",
        "Proses selesai.",
        f"File konversi: {session.converted_path.name}",
        f"File BOQ final: {session.final_path.name}",
    ]

    return jsonify(_session_payload(session))


@boq_bp.route("/session/<session_id>/download/<kind>", methods=["GET"])
def download_session_file(session_id: str, kind: str):
    session = _sessions.get(session_id)
    if session is None:
        return _json_error("Session BOQ tidak ditemukan.", 404)

    if kind == "converted":
        target = session.converted_path
    elif kind == "final":
        target = session.final_path
    else:
        return _json_error("Jenis file tidak valid.", 400)

    if target is None or not target.exists():
        return _json_error("File hasil belum tersedia. Jalankan proses terlebih dahulu.", 404)

    return send_file(target, as_attachment=True, download_name=target.name)


@boq_bp.route("/session/<session_id>/reset", methods=["POST"])
def reset_session(session_id: str):
    session = _sessions.pop(session_id, None)
    if session is None:
        return jsonify({"ok": True, "removed": False})

    _cleanup_session_files(session)
    return jsonify({"ok": True, "removed": True})
