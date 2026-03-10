#!/usr/bin/env python3
"""
Hellonoid Blender Export Script — Steg 13-14 + 17
Importerar GLB, snyggar till och exporterar proportionella webbbilder.

Användning:
  blender --background --python blender-export.py -- \
    --glb model.glb \
    --output-dir exports/ \
    --height-cm 170 \
    --slug figure-03 \
    --watermark
"""

import bpy
import sys
import os
import math
import mathutils
from pathlib import Path

# ── Argument-parsning ──────────────────────────────────────────

def parse_args():
    argv = sys.argv
    args = {}
    try:
        idx = argv.index("--") + 1
        while idx < len(argv):
            if argv[idx] == '--glb': args['glb'] = argv[idx+1]; idx += 2
            elif argv[idx] == '--output-dir': args['output_dir'] = argv[idx+1]; idx += 2
            elif argv[idx] == '--height-cm': args['height_cm'] = float(argv[idx+1]); idx += 2
            elif argv[idx] == '--slug': args['slug'] = argv[idx+1]; idx += 2
            elif argv[idx] == '--watermark': args['watermark'] = True; idx += 1
            elif argv[idx] == '--ref-height': args['ref_height'] = float(argv[idx+1]); idx += 2
            else: idx += 1
    except (ValueError, IndexError):
        pass
    return args

# ── Sceninställningar ──────────────────────────────────────────

REFERENCE_HEIGHT_CM = 180.0  # Standardhöjd = 100% av bildhöjd
RENDER_SIZES = {
    'thumbnail': (200, 200, 85),
    'card': (400, 400, 90),
    'full': (1024, 1024, 92),
}
EXPORT_VIEWS = ['front', 'left', 'three_quarter_front']

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def setup_render():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 256
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'

def setup_lighting():
    """Professionell 3-punkts ljussättning"""
    # Nyckelljus
    key = bpy.data.lights.new("KeyLight", 'AREA')
    key.energy = 300; key.size = 2
    obj = bpy.data.objects.new("KeyLight", key)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (-2, -3, 2.5)
    obj.rotation_euler = (0.6, 0, -0.5)

    # Fyllnadsljus
    fill = bpy.data.lights.new("FillLight", 'AREA')
    fill.energy = 150; fill.size = 3
    obj = bpy.data.objects.new("FillLight", fill)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (2, -1, 1.5)
    obj.rotation_euler = (0.4, 0, 0.5)

    # Kantljus
    rim = bpy.data.lights.new("RimLight", 'SPOT')
    rim.energy = 200; rim.spot_size = 1.2
    obj = bpy.data.objects.new("RimLight", rim)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (1, 2, 2)
    obj.rotation_euler = (-0.8, 0, 0.8)

def add_shadow_catcher():
    """Osynligt markplan för kontaktskuggor"""
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "GroundPlane"
    ground.is_shadow_catcher = True

def setup_world():
    world = bpy.context.scene.world
    if world.use_nodes:
        world.node_tree.nodes.clear()
    else:
        world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    bg = nodes.new('ShaderNodeBackground')
    out = nodes.new('ShaderNodeOutputWorld')
    bg.inputs['Color'].default_value = (1, 1, 1, 1)
    bg.inputs['Strength'].default_value = 1.0
    links.new(bg.outputs['Background'], out.inputs['Surface'])

# ── Modellhantering ────────────────────────────────────────────

def import_glb(path):
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.context.selected_objects if o.type == 'MESH']
    if not meshes:
        raise ValueError("Ingen mesh hittades i GLB-filen")
    return max(meshes, key=lambda o: len(o.data.vertices))

def auto_cleanup(obj):
    """Steg 14: Automatisk uppsnyggning"""
    bpy.context.view_layer.objects.active = obj

    # Smooth shading
    bpy.ops.object.shade_smooth()

    # Auto smooth normals (Blender 5.0)
    if hasattr(obj.data, 'use_auto_smooth'):
        obj.data.use_auto_smooth = True
        obj.data.auto_smooth_angle = math.radians(30)

    # Ta bort lösa vertices
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.delete_loose()
    bpy.ops.object.mode_set(mode='OBJECT')

def scale_proportional(obj, height_cm, ref_height=REFERENCE_HEIGHT_CM):
    """Skalera roboten proportionellt baserat på verklig höjd"""
    bpy.context.view_layer.objects.active = obj

    # Nuvarande höjd i Blender-enheter
    current_h = obj.dimensions.z
    if current_h <= 0:
        return 1.0

    # Målhöjd i Blender-enheter (1 enhet = 1 meter)
    target_m = height_cm / 100.0
    scale = target_m / current_h
    obj.scale = (scale, scale, scale)
    bpy.ops.object.transform_apply(scale=True)

    # Placera på marken
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
    bbox = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    min_z = min(v.z for v in bbox)
    obj.location = (0, 0, -min_z)

    return height_cm / ref_height

# ── Kamera ─────────────────────────────────────────────────────

def setup_camera(view, robot_height_m):
    cam_data = bpy.data.cameras.new("ExportCam")
    cam_data.lens = 85
    cam_data.clip_end = 100
    cam = bpy.data.objects.new("ExportCam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    d = 4.5
    h = robot_height_m * 0.5

    positions = {
        'front': (0, -d, h),
        'left': (-d, 0, h),
        'three_quarter_front': (d * 0.7, -d * 0.7, h),
    }

    pos = positions.get(view, (0, -d, h))
    cam.location = pos
    look = mathutils.Vector((0, 0, h))
    direction = look - mathutils.Vector(cam.location)
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

# ── Vattenstämpel ──────────────────────────────────────────────

def add_watermark_compositor(text="hellonoid.com"):
    """Lägg till vattenstämpel via Blenders compositor"""
    scene = bpy.context.scene
    scene.use_nodes = True
    tree = scene.node_tree
    # Vattenstämpel hanteras bäst i efterbearbetning med PIL/Pillow
    # Här sätter vi bara en markör — faktisk stämpel läggs till med PIL
    pass

# ── Rendering ──────────────────────────────────────────────────

def render_view(output_path, width, height):
    scene = bpy.context.scene
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)

# ── Huvudflöde ─────────────────────────────────────────────────

def main():
    args = parse_args()
    glb = args.get('glb')
    output_dir = args.get('output_dir', 'exports')
    height_cm = args.get('height_cm', 170)
    slug = args.get('slug', 'robot')
    watermark = args.get('watermark', False)
    ref_height = args.get('ref_height', REFERENCE_HEIGHT_CM)

    if not glb:
        print("Användning: blender --background --python blender-export.py -- --glb model.glb --output-dir exports/")
        sys.exit(1)

    Path(output_dir).mkdir(parents=True, exist_ok=True)

    print(f"── Hellonoid Export Pipeline ──")
    print(f"Robot: {slug}")
    print(f"Höjd: {height_cm} cm (referens: {ref_height} cm)")
    print(f"Proportionell ratio: {(height_cm/ref_height)*100:.0f}%")

    # Steg 13: Import
    print("\n[13] Importerar GLB...")
    clear_scene()
    setup_render()
    setup_world()
    setup_lighting()
    add_shadow_catcher()
    robot = import_glb(glb)

    # Steg 14: Auto cleanup
    print("[14] Automatisk uppsnyggning...")
    auto_cleanup(robot)

    # Proportionell skalning
    print(f"[17] Skalerar proportionellt ({height_cm}cm)...")
    ratio = scale_proportional(robot, height_cm, ref_height)
    robot_height_m = height_cm / 100.0

    # Rendera alla vyer i alla storlekar
    total = len(EXPORT_VIEWS) * len(RENDER_SIZES)
    count = 0
    for view in EXPORT_VIEWS:
        # Ta bort gammal kamera
        if bpy.context.scene.camera:
            bpy.data.objects.remove(bpy.context.scene.camera)

        setup_camera(view, robot_height_m)

        for size_name, (w, h, q) in RENDER_SIZES.items():
            count += 1
            fname = f"{slug}_{view}_{size_name}.png"
            path = os.path.join(output_dir, fname)
            print(f"  [{count}/{total}] {fname} ({w}×{h})")
            render_view(path, w, h)

    print(f"\n✅ Exporterade {count} bilder till {output_dir}")
    print(f"   Proportionell ratio: {ratio*100:.0f}%")
    if watermark:
        print("   ⚠️  Vattenstämpel kräver efterbearbetning med PIL")

if __name__ == "__main__":
    main()
