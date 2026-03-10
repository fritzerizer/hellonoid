#!/usr/bin/env python3
"""
Hellonoid Blender Automation Script
Renders standardized views of robot GLB files
Usage: blender --background --python blender-render.py -- model.glb output_dir
"""

import bpy
import bmesh
import sys
import os
import mathutils
from pathlib import Path

def setup_scene():
    """Set up Blender scene with standardized environment"""
    # Clear default scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Set render engine to Cycles for quality
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.samples = 256  # Higher quality
    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024
    bpy.context.scene.render.film_transparent = True
    
    # Add professional lighting setup
    setup_three_point_lighting()
    
    # Add ground plane for contact shadows
    add_ground_plane()
    
    # Set up world shader for cleaner background
    setup_world_shader()

def setup_world_shader():
    """Set up clean white background with subtle gradient"""
    world = bpy.context.scene.world
    if world.use_nodes:
        world.node_tree.nodes.clear()
    else:
        world.use_nodes = True
        
    world_nodes = world.node_tree.nodes
    world_links = world.node_tree.links
    
    # Create gradient background (white to light grey)
    background_node = world_nodes.new('ShaderNodeBackground')
    output_node = world_nodes.new('ShaderNodeOutputWorld')
    
    # Subtle gradient for more professional look
    background_node.inputs['Color'].default_value = (1.0, 1.0, 1.0, 1.0)  # Pure white
    background_node.inputs['Strength'].default_value = 1.0
    
    world_links.new(background_node.outputs['Background'], output_node.inputs['Surface'])

def add_ground_plane():
    """Add invisible ground plane for contact shadows"""
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.1))
    ground = bpy.context.active_object
    ground.name = "GroundPlane"
    
    # Create shadow catcher material
    mat = bpy.data.materials.new(name="ShadowCatcher")
    mat.use_nodes = True
    ground.data.materials.append(mat)
    
    # Make it a shadow catcher (invisible but catches shadows)
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    shader = nodes.new('ShaderNodeBsdfTransparent')
    light_path = nodes.new('ShaderNodeLightPath')
    
    # Only visible to shadow rays
    links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    
    # Make ground plane a shadow catcher
    ground.is_shadow_catcher = True

def setup_three_point_lighting():
    """Set up professional 3-point lighting system"""
    # Key light (main light from front-left)
    key_light_data = bpy.data.lights.new(name="KeyLight", type='AREA')
    key_light_data.energy = 300
    key_light_data.size = 2
    key_light_obj = bpy.data.objects.new("KeyLight", key_light_data)
    bpy.context.scene.collection.objects.link(key_light_obj)
    key_light_obj.location = (-2, -3, 2.5)
    key_light_obj.rotation_euler = (0.6, 0, -0.5)
    
    # Fill light (softer, from right side)
    fill_light_data = bpy.data.lights.new(name="FillLight", type='AREA') 
    fill_light_data.energy = 150
    fill_light_data.size = 3
    fill_light_obj = bpy.data.objects.new("FillLight", fill_light_data)
    bpy.context.scene.collection.objects.link(fill_light_obj)
    fill_light_obj.location = (2, -1, 1.5)
    fill_light_obj.rotation_euler = (0.4, 0, 0.5)
    
    # Rim light (from behind for edge definition)
    rim_light_data = bpy.data.lights.new(name="RimLight", type='SPOT')
    rim_light_data.energy = 200
    rim_light_data.spot_size = 1.2
    rim_light_obj = bpy.data.objects.new("RimLight", rim_light_data)
    bpy.context.scene.collection.objects.link(rim_light_obj)
    rim_light_obj.location = (1, 2, 2)
    rim_light_obj.rotation_euler = (-0.8, 0, 0.8)

def load_robot_model(glb_path):
    """Load GLB model and return the imported object"""
    if not os.path.exists(glb_path):
        raise FileNotFoundError(f"GLB file not found: {glb_path}")
    
    # Import GLB
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    # Get the imported object(s)
    imported_objects = [obj for obj in bpy.context.selected_objects]
    if not imported_objects:
        raise ValueError("No objects imported from GLB")
    
    # Find the main robot object (usually the largest mesh)
    robot_obj = None
    max_vertices = 0
    
    for obj in imported_objects:
        if obj.type == 'MESH' and obj.data and len(obj.data.vertices) > max_vertices:
            max_vertices = len(obj.data.vertices)
            robot_obj = obj
    
    if not robot_obj:
        raise ValueError("No mesh object found in GLB")
    
    return robot_obj

def normalize_robot_size(robot_obj, target_height=1.8):
    """Scale robot to standardized height and position on ground"""
    bpy.context.view_layer.objects.active = robot_obj
    
    # Get object dimensions
    dimensions = robot_obj.dimensions
    current_height = dimensions.z  # Use Z-height specifically
    
    if current_height > 0:
        scale_factor = target_height / current_height
        robot_obj.scale = (scale_factor, scale_factor, scale_factor)
        
        # Apply scale
        bpy.ops.object.transform_apply(scale=True)
    
    # Center horizontally but place on ground
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
    
    # Get bounding box to position feet on ground
    bbox = [robot_obj.matrix_world @ mathutils.Vector(corner) for corner in robot_obj.bound_box]
    min_z = min(corner.z for corner in bbox)
    
    # Position robot so lowest point touches ground (z=0)
    robot_obj.location = (0, 0, -min_z)
    
    return target_height  # Return actual height for camera setup

def setup_camera(view_name, robot_height=1.8):
    """Set up camera for different views with proper framing"""
    camera_data = bpy.data.cameras.new(name="RobotCamera")
    camera_obj = bpy.data.objects.new("RobotCamera", camera_data)
    bpy.context.scene.collection.objects.link(camera_obj)
    bpy.context.scene.camera = camera_obj
    
    # Camera settings for better framing
    camera_data.lens = 85  # Longer lens for less distortion
    camera_data.clip_end = 100
    
    # Position camera to show full robot with proper framing
    distance = 4.5  # Further back to show full body
    height = robot_height * 0.5  # Look at center of robot
    
    positions = {
        'front': (0, -distance, height),
        'back': (0, distance, height),
        'left': (-distance, 0, height),
        'right': (distance, 0, height),
        'three_quarter': (distance * 0.7, -distance * 0.7, height),
        'full_body': (0, -distance * 1.2, height * 0.7),  # Slightly higher and further for full body
    }
    
    if view_name in positions:
        camera_obj.location = positions[view_name]
        
        # Look at robot center (slightly above ground for better framing)
        look_at = mathutils.Vector((0, 0, height))
        direction = look_at - mathutils.Vector(camera_obj.location)
        camera_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

def render_view(output_path, view_name):
    """Render current view to file"""
    bpy.context.scene.render.filepath = output_path
    bpy.context.scene.render.image_settings.file_format = 'PNG'
    bpy.context.scene.render.image_settings.color_mode = 'RGBA'
    
    print(f"Rendering {view_name} view to {output_path}")
    bpy.ops.render.render(write_still=True)

def main():
    """Main rendering pipeline"""
    # Parse command line arguments
    argv = sys.argv
    try:
        index = argv.index("--") + 1
        glb_path = argv[index]
        output_dir = argv[index + 1]
    except (ValueError, IndexError):
        print("Usage: blender --background --python blender-render.py -- model.glb output_dir")
        sys.exit(1)
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Setup scene
    print("Setting up Blender scene...")
    setup_scene()
    
    # Load robot model
    print(f"Loading robot model: {glb_path}")
    robot_obj = load_robot_model(glb_path)
    
    # Normalize size and get robot height for camera setup
    print("Normalizing robot size...")
    robot_height = normalize_robot_size(robot_obj)
    
    # Render all views
    views = ['front', 'back', 'left', 'right', 'three_quarter', 'full_body']
    
    for view in views:
        # Remove existing camera
        if bpy.context.scene.camera:
            bpy.data.objects.remove(bpy.context.scene.camera)
        
        # Setup camera for this view with proper robot height
        setup_camera(view, robot_height)
        
        # Render
        output_path = os.path.join(output_dir, f"robot_{view}.png")
        render_view(output_path, view)
    
    print(f"✅ Rendered {len(views)} views to {output_dir}")

if __name__ == "__main__":
    main()