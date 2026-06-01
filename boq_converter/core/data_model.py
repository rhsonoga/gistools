from collections import defaultdict


class MaterialRecord:
    def __init__(self):
        self.qty = 0
        self.total_route = 0.0

    def add(self, route=None):
        self.qty += 1
        if route is not None:
            self.total_route += route


class LineData:
    def __init__(self, name):
        self.name = name
        self.materials = defaultdict(MaterialRecord)

    def add_material(self, material_name, route=None):
        self.materials[material_name].add(route)


class ClusterData:
    def __init__(self):
        self.fdt_list = []  # list of dict {name, core}
        self.lines = {}     # key: line_name, value: LineData

    def add_fdt(self, name, core):
        self.fdt_list.append({
            "name": name,
            "core": core
        })

    def get_or_create_line(self, line_name):
        if line_name not in self.lines:
            self.lines[line_name] = LineData(line_name)
        return self.lines[line_name]