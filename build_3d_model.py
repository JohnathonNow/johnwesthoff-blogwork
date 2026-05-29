import json
import argparse
import sys
import numpy as np
import trimesh
import manifold3d
from manifold3d import Manifold, CrossSection

def parse_args():
    parser = argparse.ArgumentParser(description="Create 3D model STL files from a list of primitive operations")
    parser.add_argument("input", help="JSON file containing operations")
    parser.add_argument("output", help="Output STL file path")
    return parser.parse_args()

def main():
    args = parse_args()

    with open(args.input, 'r') as f:
        data = json.load(f)

    # Variables storage for objects
    variables = {}

    for op in data:
        op_type = op.get("type")
        name = op.get("name")

        if op_type == "prism":
            size = op.get("size", [1.0, 1.0, 1.0])
            center = op.get("center", False)
            variables[name] = Manifold.cube(size, center)

        elif op_type == "sphere":
            radius = op.get("radius", 1.0)
            segments = op.get("segments", 0)
            variables[name] = Manifold.sphere(radius, segments)

        elif op_type == "cylinder":
            height = op.get("height", 1.0)
            radius_low = op.get("radius_low", 1.0)
            radius_high = op.get("radius_high", -1.0)
            segments = op.get("segments", 0)
            center = op.get("center", False)
            variables[name] = Manifold.cylinder(height, radius_low, radius_high, segments, center)

        elif op_type == "circle":
            radius = op.get("radius", 1.0)
            segments = op.get("segments", 0)
            variables[name] = CrossSection.circle(radius, segments)

        elif op_type == "square":
            size = op.get("size", [1.0, 1.0])
            center = op.get("center", False)
            variables[name] = CrossSection.square(size, center)

        elif op_type == "polygon":
            contours = op.get("contours", [])
            variables[name] = CrossSection(contours)

        elif op_type == "union":
            objs = [variables[n] for n in op.get("objects", [])]
            if not objs: continue
            res = objs[0]
            for o in objs[1:]:
                if isinstance(res, Manifold):
                    res = res + o
                else:
                    res = res + o # CrossSection union? Wait manifold handles it with +
            variables[name] = res

        elif op_type == "intersection":
            objs = [variables[n] for n in op.get("objects", [])]
            if not objs: continue
            res = objs[0]
            for o in objs[1:]:
                res = res ^ o
            variables[name] = res

        elif op_type == "subtraction":
            base = variables[op.get("base")]
            subtract = [variables[n] for n in op.get("subtract", [])]
            res = base
            for o in subtract:
                res = res - o
            variables[name] = res

        elif op_type == "split_by_plane":
            obj = variables[op.get("object")]
            normal = op.get("normal", [0.0, 0.0, 1.0])
            origin_offset = op.get("origin_offset", 0.0)
            res1, res2 = obj.split_by_plane(normal, origin_offset)
            variables[name] = res1
            variables[name + "_split"] = res2

        elif op_type == "translate":
            obj = variables[op.get("object")]
            vector = op.get("vector", [0.0, 0.0, 0.0])
            variables[name] = obj.translate(vector)

        elif op_type == "rotate":
            obj = variables[op.get("object")]
            if isinstance(obj, Manifold):
                angles = op.get("angles", [0.0, 0.0, 0.0])
                variables[name] = obj.rotate(angles) # manifold rotate? Wait
            else:
                degrees = op.get("degrees", 0.0)
                variables[name] = obj.rotate(degrees)

        elif op_type == "scale":
            obj = variables[op.get("object")]
            factor = op.get("factor", [1.0, 1.0, 1.0] if isinstance(obj, Manifold) else [1.0, 1.0])
            variables[name] = obj.scale(factor)

        elif op_type == "translational_extrusion":
            obj = variables[op.get("object")]
            height = op.get("height", 1.0)
            n_divisions = op.get("n_divisions", 0)
            twist = op.get("twist_degrees", 0.0)
            scale_top = op.get("scale_top", [1.0, 1.0])
            variables[name] = Manifold.extrude(obj, height, n_divisions, twist, scale_top)

        elif op_type == "rotational_extrusion":
            obj = variables[op.get("object")]
            segments = op.get("segments", 0)
            revolve_degrees = op.get("revolve_degrees", 360.0)
            variables[name] = Manifold.revolve(obj, segments, revolve_degrees)

        elif op_type == "export":
            obj = variables[op.get("object")]
            if isinstance(obj, Manifold):
                mesh = obj.to_mesh()
                t = trimesh.Trimesh(vertices=mesh.vert_properties, faces=mesh.tri_verts)
                t.export(args.output)
            else:
                print(f"Error: {name} is not a 3D manifold object and cannot be exported.")

if __name__ == "__main__":
    main()
