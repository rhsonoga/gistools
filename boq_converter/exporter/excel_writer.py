from openpyxl import Workbook

def export_to_excel(cluster, output_path, mode="CLUSTER"):
    """
    Fungsi ekspor dengan proteksi struktur kolom agar mesin injeksi tidak error.
    """
    wb = Workbook()

    # --- SHEET 1: BOQ_PER_LINE ---
    ws = wb.active
    ws.title = "BOQ_PER_LINE"

    # PENTING: Kolom "LINE" HARUS tetap ada sebagai header agar mesin tidak error 'LINE'
    # Struktur ini dijaga agar tetap kompatibel dengan bom_input.py
    ws.append(["LINE", "MATERIAL", "QTY", "TOTAL_ROUTE"])

    for line_name, line_data in cluster.lines.items():
        for material, record in line_data.materials.items():
            if mode == "CLUSTER":
                # Mode Cluster: Kolom LINE diisi nama Jalur (LINE A, LINE B, dst)
                ws.append([
                    line_name,
                    material,
                    record.qty,
                    record.total_route if record.total_route else "-"
                ])
            else:
                # Mode feeder/UPL: Kolom LINE dikosongkan ("")
                # Ini agar mesin injeksi tidak error tapi tampilan tetap bersih
                ws.append([
                    "", 
                    material,
                    record.qty,
                    record.total_route if record.total_route else "-"
                ])

    # --- SHEET 2: FDT_SUMMARY ---
    ws2 = wb.create_sheet("FDT_SUMMARY")
    
    # PENTING: Header HARUS tetap "FDT_NAME", "CORE", "QTY" agar tidak error 'CORE'
    ws2.append(["FDT_NAME", "CORE", "QTY"])

    # Menggunakan fdt_list dari objek cluster
    if hasattr(cluster, 'fdt_list'):
        for fdt in cluster.fdt_list:
            ws2.append([
                fdt["name"],
                fdt["core"], 
                1
            ])
    elif hasattr(cluster, 'fdts'):
        for fdt_name, fdt_info in cluster.fdts.items():
            ws2.append([
                fdt_name,
                fdt_info["core"],
                fdt_info["qty"]
            ])

    wb.save(output_path)