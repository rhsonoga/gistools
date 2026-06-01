from .data_model import ClusterData
from .material_classifier import classify_folder
from ..utils.text_utils import (
    normalize_spaces,
    extract_cable_type,
    extract_total_route
)
import re

def aggregate_kml_structure(kml_tree, mode="CLUSTER"):
    cluster = ClusterData()

    # ==========================================================
    # 1. LOGIKA MODE CLUSTER (KEMBALI KE STABIL / ORIGINAL)
    # ==========================================================
    def process_cluster(folders):
        for folder in folders:
            folder_name = normalize_spaces(folder["folder_name"])

            # Cluster hanya fokus pada folder FDT dan folder yang berawalan LINE
            if folder_name.upper() == "FDT":
                for ent in folder.get("entities", []):
                    name = normalize_spaces(ent["name"])
                    desc = ent.get("description", "")
                    core = extract_first_number(desc)
                    cluster.add_fdt(name, core)

            elif folder_name.upper().startswith("LINE"):
                line = cluster.get_or_create_line(folder["folder_name"])
                for sub in folder.get("subfolders", []):
                    material_type = classify_folder(sub["folder_name"])
                    if material_type == "IGNORE": continue

                    for ent in sub.get("entities", []):
                        if material_type == "CABLE":
                            cable_type = extract_cable_type(ent["name"])
                            route = extract_total_route(ent.get("description", ""))
                            material_name = cable_type if cable_type else "UNKNOWN CABLE"
                            line.add_material(material_name, route)
                        elif material_type == "SLING WIRE":
                            route = extract_numeric_value(ent["name"])
                            line.add_material("SLING WIRE", route)
                        else:
                            line.add_material(material_type)
            
            # Rekursi hanya dilakukan jika folder tersebut BUKAN folder LINE 
            # (untuk menghindari pengulangan item di dalam folder material)
            if not folder_name.upper().startswith("LINE"):
                process_cluster(folder.get("subfolders", []))

    # ==========================================================
    # 2. LOGIKA MODE feeder (REVISI SLACK EXTRACTOR)
    # ==========================================================
    def process_feeder(folders):
        global_line = cluster.get_or_create_line("feeder")

        for folder in folders:
            folder_name = normalize_spaces(folder["folder_name"]).upper()

            # ===============================
            # DETEKSI MATERIAL
            # ===============================

            # A. CABLE & EXTRACT SLACK
            if "CABLE" in folder_name:
                for ent in folder.get("entities", []):
                    desc = ent.get("description", "")
                    c_type = extract_cable_type(ent["name"])
                    route = extract_total_route(desc)
                    mat_name = c_type if c_type else "UNKNOWN CABLE"
                    
                    # 1. Injeksi Data Kabel
                    global_line.add_material(mat_name, route)

                    # 2. Tarik Data Slack dari Deskripsi Kabel (Khusus feeder)
                    if c_type: # Pastikan nama kabel valid
                        slack_match = re.search(r"Total\s*Slack\s*[:=]?\s*(\d+)", str(desc), re.IGNORECASE)
                        if slack_match:
                            slack_qty = int(slack_match.group(1))
                            slack_name = f"SLACK {c_type}" # Hasilnya: SLACK 48C/4T
                            
                            # Menambah QTY sebanyak angka slack yang ditemukan
                            for _ in range(slack_qty):
                                global_line.add_material(slack_name)

            # B. SLACK (DIABAIKAN)
            elif "SLACK" in folder_name:
                # Folder ini dilewati (skip) 100% karena Slack sudah diambil dari Deskripsi Kabel
                pass

            # C. JOINT CLOSURE
            elif "JOINT" in folder_name:
                for _ in folder.get("entities", []):
                    global_line.add_material("JOINT CLOSURE")

            # D. NEW POLE
            elif "NEW POLE" in folder_name:
                for _ in folder.get("entities", []):
                    global_line.add_material(folder_name)

            # E. EXISTING POLE
            elif "EXISTING POLE" in folder_name:
                for _ in folder.get("entities", []):
                    global_line.add_material("EXISTING POLE")

            # ===============================
            # REKURSIF KE SEMUA SUBFOLDER
            # ===============================
            process_feeder(folder.get("subfolders", []))

    # --- EKSEKUSI UTAMA ---
    if mode == "CLUSTER":
        process_cluster(kml_tree)
    else:
        process_feeder(kml_tree)
    
    return cluster

# --- FUNGSI HELPER ---
def extract_first_number(text):
    if not text: return None
    match = re.search(r"(\d+)", str(text))
    return int(match.group(1)) if match else None

def extract_numeric_value(text):
    try:
        clean_name = re.sub(r"[^\d.,]", "", str(text)).replace(",", ".")
        return float(clean_name) if clean_name else 0.0
    except:
        return 0.0