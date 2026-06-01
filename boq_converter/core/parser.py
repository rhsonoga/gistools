import zipfile
import xml.etree.ElementTree as ET
import os
import tempfile


def parse_kmz(kmz_path):
    """
    Extract KMZ, parse KML, return structured tree
    """

    if not kmz_path.lower().endswith(".kmz"):
        raise ValueError("File must be KMZ")

    with zipfile.ZipFile(kmz_path, 'r') as z:
        kml_file = None
        for file in z.namelist():
            if file.endswith(".kml"):
                kml_file = file
                break

        if not kml_file:
            raise ValueError("No KML file inside KMZ")

        with z.open(kml_file) as f:
            tree = ET.parse(f)
            root = tree.getroot()

    return build_structure(root)


def build_structure(root):
    """
    Convert XML into simplified dict structure
    """

    namespace = {'kml': 'http://www.opengis.net/kml/2.2'}

    result = []

    document = root.find('kml:Document', namespace)

    for folder in document.findall('kml:Folder', namespace):
        folder_name = get_text(folder, 'kml:name', namespace)

        folder_data = {
            "folder_name": folder_name,
            "entities": [],
            "subfolders": []
        }

        # entities langsung di dalam folder
        for placemark in folder.findall('kml:Placemark', namespace):
            folder_data["entities"].append({
                "name": get_text(placemark, 'kml:name', namespace),
                "description": get_text(placemark, 'kml:description', namespace)
            })

        # subfolders
        for sub in folder.findall('kml:Folder', namespace):
            sub_name = get_text(sub, 'kml:name', namespace)

            sub_data = {
                "folder_name": sub_name,
                "entities": []
            }

            for placemark in sub.findall('kml:Placemark', namespace):
                sub_data["entities"].append({
                    "name": get_text(placemark, 'kml:name', namespace),
                    "description": get_text(placemark, 'kml:description', namespace)
                })

            folder_data["subfolders"].append(sub_data)

        result.append(folder_data)

    return result


def get_text(element, tag, ns):
    found = element.find(tag, ns)
    return found.text.strip() if found is not None and found.text else ""