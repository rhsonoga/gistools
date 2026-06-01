import re


def normalize_spaces(text):
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip())


def extract_cable_type(name):
    """
    Ambil pola seperti 24C/2T, 36C/3T, dst.
    """
    match = re.search(r"(\d+C/\d+T)", name, re.IGNORECASE)
    return match.group(1).upper() if match else None


def extract_total_route(description):
    """
    Ambil angka dari kalimat yang mengandung 'total route'
    """
    if not description:
        return None

    match = re.search(
        r"total\s*route\s*[:=]?\s*(\d+\.?\d*)",
        description,
        re.IGNORECASE
    )

    if match:
        return float(match.group(1))

    return None