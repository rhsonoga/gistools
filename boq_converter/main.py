import os
from .core.parser import parse_kmz           # Tambah titik
from .core.aggregator import aggregate_kml_structure # Tambah titik
from .exporter.excel_writer import export_to_excel   # Tambah titik
from .bom_input import run_injection         # Tambah titik
try:
    from path_utils import kmz_stem, make_session_temp_dir
except ImportError:  # fallback untuk running mandiri (debug)
    import sys
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    from path_utils import kmz_stem, make_session_temp_dir

def convert(kmz_path, output_name=None, mode="CLUSTER"):
    """
    Fungsi Utama Konversi BOQ
    REVISI: Penanganan path assets secara dinamis (Backend Template)
    """
    
    # 1. Tentukan Path Folder Assets secara internal di dalam modul boq_converter
    base_dir = os.path.dirname(__file__)
    assets_dir = os.path.join(base_dir, "assets")

    # 2. Penentuan Nama File Output & Template Backend
    # Mode diseragamkan ke Upper Case untuk menghindari typo
    current_mode = mode.upper()

    # Intermediate + hasil final dibuat di folder temp per-run,
    # lalu GUI akan meminta user memilih lokasi penyimpanan (Download/Save As).
    work_dir = make_session_temp_dir(prefix="boq_session_")
    stem = kmz_stem(kmz_path, fallback="kmz")

    if current_mode == "CLUSTER":
        template_name = "cluster.xlsx"
    elif current_mode == "FEEDER":
        template_name = "feeder.xlsx"
    else:
        # Menangani mode tambahan atau error mode
        template_name = "feeder.xlsx"  # Default fallback ke feeder jika mode asing

    # Penamaan output dibuat ringkas sesuai permintaan:
    # - Mid  : <stem>_converted.xlsx
    # - Final: <stem>_BOQ.xlsx
    mid_output = os.path.join(work_dir, f"{stem}_converted.xlsx")
    final_output = os.path.join(work_dir, f"{stem}_BOQ.xlsx")

    template_path = os.path.join(assets_dir, template_name)

    # Validasi keberadaan template di backend sebelum proses berat dimulai
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"❌ Template {template_name} tidak ditemukan di folder backend: {assets_dir}")

    # --- LANGKAH 1: KONVERSI (KMZ ke File Sementara 1) ---
    print(f"[{current_mode}] Memulai Parsing KMZ...")
    structure = parse_kmz(kmz_path)

    print(f"[{current_mode}] Mengagregasi data struktur KML...")
    project_data = aggregate_kml_structure(structure, mode=current_mode)

    print(f"[{current_mode}] Membuat file konversi sementara: {mid_output}")
    export_to_excel(project_data, mid_output, mode=current_mode)

    # --- LANGKAH 2: INJEKSI (File 1 ke Template BOQ Final) ---
    print(f"[{current_mode}] Memulai Injeksi data ke Template Backend...")
    # Template dibaca dari backend (assets), hasil disimpan ke root agar bisa di-download GUI
    run_injection(template_path, mid_output, final_output, mode=current_mode)

    print(f"\n✅ PROSES SELESAI!")
    print(f"1. File Konversi: {mid_output}")
    print(f"2. File BOQ Final: {final_output}")
    
    return mid_output, final_output

if __name__ == "__main__":
    # Fungsi main hanya untuk testing mandiri (CLI)
    print("=== KMZ TO BOQ SYSTEM (DEBUG MODE) ===")
    kmz_file = input("Masukkan path file KMZ: ")
    project_mode = input("Pilih Mode (CLUSTER/FEEDER): ").upper() or "CLUSTER"
    
    if os.path.exists(kmz_file):
        try:
            convert(kmz_file, mode=project_mode)
        except Exception as e:
            print(f"Terjadi Kesalahan: {e}")
    else:
        print("File KMZ tidak ditemukan.")