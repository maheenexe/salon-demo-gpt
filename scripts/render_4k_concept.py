"""4K Blender Cycles concept assets for BHANU'S cinematic website.
Usage:
  blender -b --python scripts/render_4k_concept.py
  blender -b --python scripts/render_4k_concept.py -- --frames 96 --samples 96
Outputs to ./renders/. Rendering requires Blender 4.x and significant CPU/GPU resources.
This builds an imagined salon for a client demo, not a survey of the real shop.
"""
import bpy
import math
import sys
import os
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
def option(flag, default):
    return int(args[args.index(flag) + 1]) if flag in args else default
samples = max(16, min(512, option("--samples", 128)))
frames = max(0, min(900, option("--frames", 0)))
shot = args[args.index("--shot") + 1] if "--shot" in args else "both"
output = os.path.abspath(os.path.join(os.getcwd(), "renders"))
os.makedirs(output, exist_ok=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = samples
# The Ubuntu Blender package may be compiled without OpenImageDenoise.
# Use regular Cycles sampling; do not require that optional external library.
scene.cycles.use_denoising = False
try:
    bpy.context.view_layer.cycles.use_denoising = False
except Exception:
    pass
scene.render.resolution_x = 3840
scene.render.resolution_y = 2160
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
try:
    scene.view_settings.view_transform = "AgX"
except Exception:
    pass
world = bpy.data.worlds.new("Warm night studio")
scene.world = world
world.use_nodes = True
world.node_tree.nodes.get("Background").inputs["Color"].default_value = (0.012, 0.008, 0.006, 1)
world.node_tree.nodes.get("Background").inputs["Strength"].default_value = 0.23

def mat(name, color, metallic=0, roughness=0.42, emission=0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    if emission:
        shader.inputs["Emission Color"].default_value = (*color, 1)
        shader.inputs["Emission Strength"].default_value = emission
    return material

gold = mat("Champagne gold", (0.62,0.35,0.12), 1, 0.16)
gold_bright = mat("Polished brass", (0.83,0.6,0.27), 1, 0.12)
black = mat("Graphite stone", (0.021,0.017,0.017), 0.2, 0.29)
stone = mat("Glossy basalt", (0.075,0.065,0.060), 0.2, 0.20)
leather = mat("Cream upholstery", (0.61,0.49,0.36), 0.0, 0.61)
mirror = mat("Smoked reflective glass", (0.2,0.22,0.21), 0.92, 0.07)
glow = mat("Warm luminous strips", (1,0.65,0.3), 0, 0.3, 8.0)

portal_objects, salon_objects = [], []
def remember(obj, target):
    target.append(obj)
    return obj
def cube(name, loc, scale, material, target, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = remember(bpy.context.object, target)
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel:
        modifier = obj.modifiers.new("Soft polished edges", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj
def cylinder(name, loc, radius, depth, material, target, vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = remember(bpy.context.object, target)
    obj.name = name
    obj.data.materials.append(material)
    obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj
def arch(name, center, radius, material, target, thickness=0.07, start=0, end=math.tau):
    crv = bpy.data.curves.new(name, "CURVE")
    crv.dimensions = "3D"
    crv.bevel_depth = thickness
    crv.bevel_resolution = 4
    path = crv.splines.new("POLY")
    segments = 160
    path.points.add(segments)
    for i, point in enumerate(path.points):
        t = start + (end - start) * i / segments
        point.co = (center[0] + radius*math.cos(t),
                    center[1] + radius*math.sin(t),
                    center[2], 1)
    obj = bpy.data.objects.new(name, crv)
    bpy.context.collection.objects.link(obj)
    crv.materials.append(material)
    remember(obj, target)
    return obj
def area(name, loc, power, size, color, target):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = loc
    obj.rotation_euler = (0, 0, 0)
    remember(obj, target)
    return obj

# Scene A — a monumental brushed-gold portal in an abstract black environment.
cube("Black reflective stage", (0,-1.7,0), (26,.2,25), black, portal_objects)
for i in range(7):
    ring = arch("Brass architectural orbit %d" % i, (0,1.65,-i*.25),
                2.5 + i*.22, gold if i%2 else gold_bright, portal_objects,
                .065 + i*.003, -.38, math.tau-.38)
    ring.rotation_euler[1] = (i%3-1)*.15
for x in (-4.2,4.2):
    cube("Portal vertical pylon", (x,1.6,-.6), (.25,6.4,.6), gold, portal_objects, .06)
for x in (-1,1):
    area("Portal studio softbox", (x*3.2,5.8,4), 2100, 6,
         (1.0,.72,.46), portal_objects)
area("Backlight on sculpture", (0,4,-4), 3200, 8,
     (.95,.65,.35), portal_objects)

# Scene B — imagined luxury salon with styling islands and reflective interior.
cube("Basalt mirror-polished floor", (0,-.08,-1.5), (19,.16,24), stone, salon_objects)
cube("Rear charcoal feature wall", (0,4,-7), (19,8,.4), black, salon_objects)
for x in (-9.5,9.5):
    cube("Side architectural wall", (x,4,-.5), (.4,8,15), black, salon_objects)
for x in [v*.4 for v in range(-20,21)]:
    cube("Fluted wall texture", (x,4,-6.72), (.052,7.6,.065), stone, salon_objects)
for x in (-6.5,-2.2,2.2,6.5):
    cube("Brass vertical inlay", (x,4,-6.59), (.03,7.5,.085), gold, salon_objects)
for zz in [-5,-2,1,4]:
    cube("Recessed ceiling truss", (0,6,zz), (19,.22,.24), black, salon_objects)
    cube("Warm linear downlight", (0,5.86,zz), (16,.02,.045), glow, salon_objects)
for x in (-4.7,0,4.7):
    cube("Smoked mirror", (x,3,-6.48), (1.55,2.95,.06), mirror, salon_objects, .05)
    for side in (-.85,.85):
        cube("Arched mirror sides", (x+side,3,-6.38), (.08,3.4,.12), gold, salon_objects,.03)
    arch("Arch mirror crown", (x,4.68,-6.38),.85,gold_bright,salon_objects,.06,0,math.pi)
    cube("Vanity counter", (x,1.12,-5.65), (2.4,.1,.75),gold_bright,salon_objects,.025)
    cube("Vanity base", (x,.52,-5.65), (2.35,.94,.63),black,salon_objects,.04)
    cylinder("Salon chair base", (x,.10,-4.15),.43,.13,gold,salon_objects)
    cylinder("Chair pedestal", (x,.44,-4.15),.085,.63,gold_bright,salon_objects)
    cube("Upholstered salon seat", (x,.89,-4.15),(.95,.22,.88),leather,salon_objects,.1)
    cube("Upholstered chair back",(x,1.45,-4.55),(.98,1.05,.18),leather,salon_objects,.12)
    for side in (-.52,.52):
        cube("Chair arm", (x+side,1.15,-4.13),(.10,.13,.74),gold,salon_objects,.035)
    for i in range(5):
        cylinder("Haircare display vessel", (x-.72+i*.3,1.30,-5.55),.065,.22+i*.035,
                 gold if i%2 else black,salon_objects,20)
    area("Station softbox", (x,5.4,-3.5), 1100, 3.4, (1.0,.78,.54), salon_objects)
# Reception occupies side of room so central sightline stays open.
cube("Reception charcoal body", (7,.68,2.1), (2.4,1.3,1.0), black, salon_objects,.13)
cube("Reception brass top", (7,1.35,2.1), (2.65,.1,1.15),gold_bright,salon_objects,.035)
for x in (-5,5):
    area("Wide interior fill", (x,5.4,4), 1750, 6, (1,.80,.58), salon_objects)

# Film camera: 4K stills by default, or optional PNG frame sequence.
bpy.ops.object.camera_add(location=(0,1.7,10))
camera = bpy.context.object
camera.name = "Cinematic camera"
camera.data.lens = 32
scene.camera = camera
def look_at(target):
    camera.rotation_euler = (Vector(target)-camera.location).to_track_quat("-Z","Y").to_euler()
def use_shot(portal):
    for obj in portal_objects:
        obj.hide_render = not portal
    for obj in salon_objects:
        obj.hide_render = portal
def render_file(name):
    scene.render.filepath = os.path.join(output,name)
    bpy.ops.render.render(write_still=True)

if frames:
    for n in range(frames):
        t = n/max(1,frames-1)
        if t < .52:
            use_shot(True)
            camera.location = (0,1.7,10-8*(t/.52))
            look_at((0,1.7,0))
        else:
            use_shot(False)
            u = (t-.52)/.48
            camera.location = (0,2.05,10-5.5*u)
            look_at((0,2.1,-5.6))
        render_file("frame_%04d.png" % (n+1))
else:
    if shot in ("both", "portal"):
        use_shot(True)
        camera.location = (0,1.7,10)
        look_at((0,1.7,0))
        render_file("portal_4k.png")
    if shot in ("both", "salon"):
        use_shot(False)
        camera.location = (0,2.1,8)
        look_at((0,2.2,-5.4))
        render_file("salon_4k.png")
