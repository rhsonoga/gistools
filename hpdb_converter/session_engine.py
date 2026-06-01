import os
# REVISI: Menggunakan relative import agar konsisten dengan struktur sub-folder
from . import engine
from . import injector
from . import column_sync
from .template_loader import TemplateLoader
try:
    from path_utils import kmz_stem, make_session_temp_dir
except ImportError:  # fallback untuk running mandiri (debug)
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from path_utils import kmz_stem, make_session_temp_dir

class SessionEngine:
    """
    1 SessionEngine = 1 siklus proses KMZ
    Bertugas mengelola state agar tidak perlu restart aplikasi
    """

    def __init__(self, kmz_path):
        self.kmz_path = kmz_path
        self.parsed_data = None
        self.hpdb_file = None
        self.convert_file = None
        self._init_work_paths()

        # 🔑 PENTING: Tentukan path folder assets secara dinamis
        base_dir = os.path.dirname(__file__)
        assets_path = os.path.join(base_dir, "assets")

        # Inisialisasi loader
        loader = TemplateLoader(assets_dir=assets_path)
        
        # Cari lokasi folder template v1 secara internal
        template_dir = loader.resolve()
        
        # Simpan path template backend langsung ke file .bin 
        # (Agar engine & injector bisa baca tanpa harus copy file ke root)
        self.path_template_basic = os.path.join(template_dir, "template_basic.bin")
        self.path_template_hpdb = os.path.join(template_dir, "template_hpdb.bin")

        # loader.prepare_runtime_templates()  <-- BAGIAN INI DIHAPUS agar tidak muncul file di root

    def _init_work_paths(self):
        # Intermediate files disimpan di folder temp per-sesi (tidak tergantung CWD)
        self.work_dir = make_session_temp_dir(prefix="hpdb_session_")
        stem = kmz_stem(self.kmz_path, fallback="kmz")
        # Penamaan output (lebih ringkas):
        # - Step 1: <stem>_Convert.xlsx
        # - Final : <stem>_HPDB.xlsx
        self.convert_file = os.path.join(self.work_dir, f"{stem}_Convert.xlsx")
        self.hpdb_file = os.path.join(self.work_dir, f"{stem}_HPDB.xlsx")

    # ================= STEP 1 =================
    def step1_convert(self):
        # Oper path template dasar langsung ke engine
        self.parsed_data, self.convert_file = engine.run_conversion(
            self.kmz_path, self.path_template_basic, output_file=self.convert_file
        )
        return self.parsed_data

    # ================= STEP 2 =================
    def step2_inject_basic(self):
        if not self.parsed_data:
            raise Exception("STEP 1 belum dijalankan")
        
        # Oper path template HPDB langsung ke injector
        self.hpdb_file = injector.run_step2_basic(
            self.parsed_data, self.path_template_hpdb, output_path=self.hpdb_file
        )
        return self.hpdb_file

    # ================= STEP 3 =================
    def step3_sync_pole(self):
        if not self.hpdb_file:
            raise Exception("STEP 2 belum dijalankan")
        column_sync.run_step3_pole_sync(
            self.hpdb_file, self.parsed_data, source_file=self.convert_file
        )

    # ================= RESET =================
    def reset(self):
        self.parsed_data = None
        self._init_work_paths()
