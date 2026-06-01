def classify_folder(folder_name):
    name = folder_name.upper()

    if "BOUNDARY FAT" in name:
        return "IGNORE"

    if "HP COVER" in name:
        return "IGNORE"

    if "HP UNCOVER" in name:
        return "IGNORE"

    if "SLACK HANGER" in name:
        return "IGNORE"

    if "FAT" in name and "BOUNDARY" not in name:
        return "FAT"

    if "EXISTING POLE" in name:
        return "EXISTING POLE"

    if "NEW POLE" in name:
        return folder_name.strip().upper()  # dipisah sesuai tipe

    if "CABLE" in name:
        return "CABLE"

    if "SLING WIRE" in name:
        return "SLING WIRE"

    return "UNKNOWN"