import json
import os
import shutil

class TemplateLoader:
    def __init__(self, assets_dir="assets"):
        self.assets_dir = assets_dir
        self.manifest_path = os.path.join(assets_dir, "manifest.json")
        self.manifest = self._load_manifest()

    def _load_manifest(self):
        try:
            with open(self.manifest_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            # fallback super aman
            return {
                "active_version": "v1",
                "fallback_chain": [],
                "required_files": [
                    "template_basic.bin",
                    "template_hpdb.bin"
                ]
            }

    def _version_sequence(self):
        return [self.manifest["active_version"]] + self.manifest.get("fallback_chain", [])

    def _is_valid_version(self, version):
        base = os.path.join(self.assets_dir, version)
        if not os.path.isdir(base):
            return False

        for fname in self.manifest["required_files"]:
            if not os.path.isfile(os.path.join(base, fname)):
                return False

        return True

    def resolve(self):
        for version in self._version_sequence():
            if self._is_valid_version(version):
                return os.path.join(self.assets_dir, version)

        raise RuntimeError("❌ Tidak ada template version yang valid!")

    def prepare_runtime_templates(self):
        """
        Copy template ke root project
        dengan nama yang dipakai engine & injector
        """
        src = self.resolve()

        mapping = {
            "template_basic.bin": "TEMPLATES.xlsx",
            "template_hpdb.bin": "TEMPLATES_HPDB.xlsx"
        }

        for src_name, dst_name in mapping.items():
            src_path = os.path.join(src, src_name)
            dst_path = dst_name

            # Kurangi I/O: kalau file tujuan sudah ada dan tidak lebih tua dari sumber,
            # skip copy (tetap aman karena konten template tidak berubah).
            try:
                if os.path.exists(dst_path):
                    src_stat = os.stat(src_path)
                    dst_stat = os.stat(dst_path)
                    if dst_stat.st_size == src_stat.st_size and dst_stat.st_mtime >= src_stat.st_mtime:
                        continue
            except Exception:
                # Jika stat gagal, lanjut copy seperti biasa.
                pass

            shutil.copy2(src_path, dst_path)
