import struct
import json
import math
import io
from PIL import Image, ImageDraw, ImageFilter

def create_glb(nodes_info, filename):
    """
    nodes_info: list of dicts:
      {
        'name': str,
        'positions': list of floats,
        'normals': list of floats,
        'uvs': list of floats,
        'indices': list of ints,
        'texture_image': PIL.Image, # optional
        'roughness': float,
        'metalness': float
      }
    """
    bin_data = bytearray()
    
    def pad4_bytes(b):
        pad = (4 - len(b) % 4) % 4
        return b + b'\x00' * pad

    buffer_views = []
    accessors = []
    meshes = []
    materials = []
    textures = []
    images = []
    samplers = []
    nodes = []

    for i, item in enumerate(nodes_info):
        positions = item['positions']
        normals = item['normals']
        uvs = item['uvs']
        indices = item['indices']
        tex_img = item.get('texture_image', None)
        roughness = item.get('roughness', 0.5)
        metalness = item.get('metalness', 0.05)

        # Min / max for position
        min_x = min(positions[0::3])
        max_x = max(positions[0::3])
        min_y = min(positions[1::3])
        max_y = max(positions[1::3])
        min_z = min(positions[2::3])
        max_z = max(positions[2::3])

        # Pack binary data
        pos_bytes = struct.pack(f'<{len(positions)}f', *positions)
        norm_bytes = struct.pack(f'<{len(normals)}f', *normals)
        uv_bytes = struct.pack(f'<{len(uvs)}f', *uvs)
        
        # Determine index format (uint16 vs uint32)
        use_uint32 = max(indices) > 65534
        if use_uint32:
            idx_bytes = struct.pack(f'<{len(indices)}I', *indices)
            idx_comp_type = 5125 # UNSIGNED_INT
        else:
            idx_bytes = struct.pack(f'<{len(indices)}H', *indices)
            idx_comp_type = 5123 # UNSIGNED_SHORT

        # Position View & Accessor
        pos_offset = len(bin_data)
        bin_data.extend(pad4_bytes(pos_bytes))
        bv_pos_idx = len(buffer_views)
        buffer_views.append({
            'buffer': 0,
            'byteOffset': pos_offset,
            'byteLength': len(pos_bytes),
            'target': 34962 # ARRAY_BUFFER
        })
        acc_pos_idx = len(accessors)
        accessors.append({
            'bufferView': bv_pos_idx,
            'byteOffset': 0,
            'componentType': 5126, # FLOAT
            'count': len(positions) // 3,
            'type': 'VEC3',
            'min': [min_x, min_y, min_z],
            'max': [max_x, max_y, max_z]
        })

        # Normal View & Accessor
        norm_offset = len(bin_data)
        bin_data.extend(pad4_bytes(norm_bytes))
        bv_norm_idx = len(buffer_views)
        buffer_views.append({
            'buffer': 0,
            'byteOffset': norm_offset,
            'byteLength': len(norm_bytes),
            'target': 34962
        })
        acc_norm_idx = len(accessors)
        accessors.append({
            'bufferView': bv_norm_idx,
            'byteOffset': 0,
            'componentType': 5126,
            'count': len(normals) // 3,
            'type': 'VEC3'
        })

        # UV View & Accessor
        uv_offset = len(bin_data)
        bin_data.extend(pad4_bytes(uv_bytes))
        bv_uv_idx = len(buffer_views)
        buffer_views.append({
            'buffer': 0,
            'byteOffset': uv_offset,
            'byteLength': len(uv_bytes),
            'target': 34962
        })
        acc_uv_idx = len(accessors)
        accessors.append({
            'bufferView': bv_uv_idx,
            'byteOffset': 0,
            'componentType': 5126,
            'count': len(uvs) // 2,
            'type': 'VEC2'
        })

        # Index View & Accessor
        idx_offset = len(bin_data)
        bin_data.extend(pad4_bytes(idx_bytes))
        bv_idx_idx = len(buffer_views)
        buffer_views.append({
            'buffer': 0,
            'byteOffset': idx_offset,
            'byteLength': len(idx_bytes),
            'target': 34963 # ELEMENT_ARRAY_BUFFER
        })
        acc_idx_idx = len(accessors)
        accessors.append({
            'bufferView': bv_idx_idx,
            'byteOffset': 0,
            'componentType': idx_comp_type,
            'count': len(indices),
            'type': 'SCALAR'
        })

        # Material & Texture
        mat_idx = len(materials)
        material_def = {
            'name': f'Mat_{item["name"]}',
            'pbrMetallicRoughness': {
                'roughnessFactor': roughness,
                'metalnessFactor': metalness
            },
            'doubleSided': False
        }

        if tex_img:
            # Compress to JPEG
            img_io = io.BytesIO()
            tex_img.save(img_io, format='JPEG', quality=90)
            img_bytes = img_io.getvalue()
            
            img_offset = len(bin_data)
            bin_data.extend(pad4_bytes(img_bytes))
            
            bv_img_idx = len(buffer_views)
            buffer_views.append({
                'buffer': 0,
                'byteOffset': img_offset,
                'byteLength': len(img_bytes)
            })

            img_idx = len(images)
            images.append({
                'bufferView': bv_img_idx,
                'mimeType': 'image/jpeg'
            })

            if not samplers:
                samplers.append({
                    'magFilter': 9729, # LINEAR
                    'minFilter': 9987, # LINEAR_MIPMAP_LINEAR
                    'wrapS': 10497,    # REPEAT
                    'wrapT': 10497
                })

            tex_idx = len(textures)
            textures.append({
                'sampler': 0,
                'source': img_idx
            })

            material_def['pbrMetallicRoughness']['baseColorTexture'] = {
                'index': tex_idx
            }

        materials.append(material_def)

        # Mesh
        mesh_idx = len(meshes)
        meshes.append({
            'name': item['name'],
            'primitives': [{
                'attributes': {
                    'POSITION': acc_pos_idx,
                    'NORMAL': acc_norm_idx,
                    'TEXCOORD_0': acc_uv_idx
                },
                'indices': acc_idx_idx,
                'material': mat_idx,
                'mode': 4 # TRIANGLES
            }]
        })

        # Node
        node_idx = len(nodes)
        nodes.append({
            'name': item['name'],
            'mesh': mesh_idx
        })

    gltf_json = {
        'asset': {'version': '2.0', 'generator': 'ElShaddayGourmet3D'},
        'scene': 0,
        'scenes': [{'nodes': list(range(len(nodes)))}],
        'nodes': nodes,
        'meshes': meshes,
        'materials': materials,
        'accessors': accessors,
        'bufferViews': buffer_views,
        'buffers': [{'byteLength': len(bin_data)}]
    }

    if textures:
        gltf_json['textures'] = textures
    if images:
        gltf_json['images'] = images
    if samplers:
        gltf_json['samplers'] = samplers

    json_str = json.dumps(gltf_json)
    json_bytes = json_str.encode('utf-8')
    json_pad = (4 - len(json_bytes) % 4) % 4
    json_bytes += b' ' * json_pad

    bin_pad = (4 - len(bin_data) % 4) % 4
    bin_data.extend(b'\x00' * bin_pad)

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_data)
    header = struct.pack('<4sII', b'glTF', 2, total_len)
    json_chunk_hdr = struct.pack('<I4s', len(json_bytes), b'JSON')
    bin_chunk_hdr = struct.pack('<I4s', len(bin_data), b'BIN\x00')

    with open(filename, 'wb') as f:
        f.write(header)
        f.write(json_chunk_hdr)
        f.write(json_bytes)
        f.write(bin_chunk_hdr)
        f.write(bin_data)

    print(f'Saved {filename} ({total_len} bytes)')


# ---------------------------------------------------------------------------
# Procedural Realistic Textures
# ---------------------------------------------------------------------------
def generate_pizza_texture():
    """Generates an appetizing, high-res texture for pizza slice."""
    w, h = 1024, 1024
    img = Image.new('RGB', (w, h), (232, 172, 102)) # Warm golden dough
    draw = ImageDraw.Draw(img)

    # 1. Flour dusting and dough surface variation
    for y in range(0, h, 6):
        for x in range(0, w, 6):
            noise = math.sin(x * 0.04) * math.cos(y * 0.04) + math.sin(x * 0.09 + y * 0.07) * 0.5
            val = int(220 + 28 * noise)
            draw.point((x, y), fill=(val, val - 32, val - 85))

    # 2. Rich melted mozzarella cheese base with tomato sauce peeking through
    for r in range(420, 0, -2):
        t = r / 420.0
        # Cheese yellow-gold with warm orange/red sauce tones near edges
        cr = int(255 - 20 * t)
        cg = int(225 - 45 * t)
        cb = int(120 - 40 * t)
        draw.ellipse([512 - r, 512 - r, 512 + r, 512 + r], fill=(cr, cg, cb))

    # Caramelized cheese spots (gourmet oven blistering)
    import random
    random.seed(42)
    for _ in range(120):
        bx = random.randint(260, 760)
        by = random.randint(260, 760)
        if (bx - 512)**2 + (by - 512)**2 < 380**2:
            br = random.randint(8, 26)
            b_shade = random.randint(110, 175)
            draw.ellipse([bx - br, by - br, bx + br, by + br], fill=(b_shade, b_shade - 45, 25))

    # Pepperoni discs on texture
    pep_coords = [(430, 430), (590, 470), (512, 620)]
    for px, py in pep_coords:
        pr = 76
        # Deep savory cured red
        draw.ellipse([px - pr, py - pr, px + pr, py + pr], fill=(182, 32, 18))
        # Crispy toasted outer rim
        draw.ellipse([px - pr, py - pr, px + pr, py + pr], outline=(105, 16, 10), width=6)
        # Marbled white fat flecks & paprika grain
        for _ in range(35):
            fx = px + random.randint(-48, 48)
            fy = py + random.randint(-48, 48)
            if (fx - px)**2 + (fy - py)**2 < (pr - 8)**2:
                draw.ellipse([fx-3, fy-3, fx+3, fy+3], fill=(235, 195, 185))

    # Black olive rings
    for ox, oy in [(480, 520), (570, 580)]:
        draw.ellipse([ox - 24, oy - 24, ox + 24, oy + 24], fill=(22, 22, 25))
        draw.ellipse([ox - 10, oy - 10, ox + 10, oy + 10], fill=(245, 210, 115))

    # Sprinkled green oregano herbs
    for _ in range(450):
        hx = random.randint(220, 804)
        hy = random.randint(220, 804)
        if (hx - 512)**2 + (hy - 512)**2 < 400**2:
            draw.line([hx, hy, hx + random.randint(-4, 4), hy + random.randint(-4, 4)], fill=(42, 72, 28), width=2)

    img = img.filter(ImageFilter.SMOOTH)
    return img


def generate_esfirra_texture():
    """Generates an authentic Brazilian round open esfirra texture."""
    w, h = 1024, 1024
    img = Image.new('RGB', (w, h), (232, 175, 108)) # Golden dough
    draw = ImageDraw.Draw(img)

    # 1. Puffy toasted crust rim
    import random
    random.seed(99)
    for r in range(490, 310, -3):
        t = (490 - r) / 180.0
        cr = int(218 + 32 * math.sin(t * math.pi))
        cg = int(145 + 28 * math.sin(t * math.pi))
        cb = int(72 + 18 * math.sin(t * math.pi))
        draw.ellipse([512 - r, 512 - r, 512 + r, 512 + r], outline=(cr, cg, cb), width=4)

    # Charred oven spots on the rim (artisan wood-fired look)
    for _ in range(55):
        angle = random.uniform(0, 2 * math.pi)
        dist = random.uniform(360, 460)
        sx = int(512 + dist * math.cos(angle))
        sy = int(512 + dist * math.sin(angle))
        sr = random.randint(6, 20)
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(120, 58, 20))

    # 2. Savory seasoned minced beef filling (*carne moída temperada com cebola e especiarias*)
    for r in range(320, 0, -3):
        mr = random.randint(92, 120)
        mg = random.randint(48, 68)
        mb = random.randint(28, 42)
        draw.ellipse([512 - r, 512 - r, 512 + r, 512 + r], fill=(mr, mg, mb))

    # Meat crumbles & juicy specks
    for _ in range(950):
        mx = random.randint(210, 814)
        my = random.randint(210, 814)
        if (mx - 512)**2 + (my - 512)**2 < 305**2:
            shade = random.randint(55, 105)
            draw.ellipse([mx-4, my-4, mx+4, my+4], fill=(shade, shade - 28, shade - 42))

    # Melted golden mozzarella threads in center
    for _ in range(160):
        cx = random.randint(230, 794)
        cy = random.randint(230, 794)
        if (cx - 512)**2 + (cy - 512)**2 < 275**2:
            length = random.randint(14, 38)
            ang = random.uniform(0, math.pi)
            draw.line([cx, cy, cx + int(length * math.cos(ang)), cy + int(length * math.sin(ang))], fill=(250, 220, 118), width=random.randint(3, 7))

    # Diced fresh red tomato bits
    for _ in range(55):
        tx = random.randint(250, 774)
        ty = random.randint(250, 774)
        if (tx - 512)**2 + (ty - 512)**2 < 265**2:
            tr = random.randint(4, 10)
            draw.rectangle([tx-tr, ty-tr, tx+tr, ty+tr], fill=(205, 32, 18))

    # Sprinkled dried oregano leaves
    for _ in range(320):
        ox = random.randint(220, 804)
        oy = random.randint(220, 804)
        if (ox - 512)**2 + (oy - 512)**2 < 295**2:
            draw.line([ox, oy, ox + random.randint(-3, 3), oy + random.randint(-3, 3)], fill=(38, 68, 22), width=2)

    img = img.filter(ImageFilter.SMOOTH)
    return img



# ---------------------------------------------------------------------------
# 3D Mesh Builders
# ---------------------------------------------------------------------------
def build_pizza_mesh():
    """Builds a complete, solid 3D pizza slice with crust, cut walls and underside."""
    positions = []
    normals = []
    uvs = []
    indices = []

    angle_half = math.pi / 8.0 # 22.5 deg each side (45 deg slice)
    nr = 28 # radial segments
    nt = 24 # angular segments
    r_max = 2.1
    r_crust_start = 1.65

    # Helper to calculate top surface height
    def top_height(r, theta):
        u = r / r_max
        if u < 0.78:
            # Cheese waves
            return 0.02 + 0.025 * math.sin(r * 6.0) * math.cos(theta * 8.0)
        else:
            # Puffed crust roll
            t = (u - 0.78) / 0.22
            return 0.02 + 0.24 * math.sin(t * math.pi) - 0.04 * t

    # 1. Top Surface (Cheese & Crust)
    top_grid = []
    for ir in range(nr + 1):
        r = (ir / nr) * r_max
        row = []
        for it in range(nt + 1):
            theta = -angle_half + (it / nt) * (2 * angle_half)
            x = r * math.sin(theta)
            z = -r * math.cos(theta)
            y = top_height(r, theta)
            
            # UV mapping centered in texture
            u = 0.5 + (x / 2.5) * 0.45
            v = 0.5 + (z / 2.5) * 0.45
            
            idx = len(positions) // 3
            positions.extend([x, y, z])
            # Initial normal roughly pointing up
            normals.extend([0.0, 1.0, 0.0])
            uvs.extend([u, v])
            row.append(idx)
        top_grid.append(row)

    # Top Triangles
    for ir in range(nr):
        for it in range(nt):
            p00 = top_grid[ir][it]
            p01 = top_grid[ir][it + 1]
            p10 = top_grid[ir + 1][it]
            p11 = top_grid[ir + 1][it + 1]
            indices.extend([p00, p10, p01])
            indices.extend([p01, p10, p11])

    # 2. Bottom Surface (Underbelly Crust)
    bot_grid = []
    for ir in range(nr + 1):
        r = (ir / nr) * r_max
        row = []
        for it in range(nt + 1):
            theta = -angle_half + (it / nt) * (2 * angle_half)
            x = r * math.sin(theta)
            z = -r * math.cos(theta)
            y = -0.09 # bottom level
            
            u = 0.5 + (x / 2.5) * 0.45
            v = 0.5 + (z / 2.5) * 0.45
            
            idx = len(positions) // 3
            positions.extend([x, y, z])
            normals.extend([0.0, -1.0, 0.0])
            uvs.extend([u, v])
            row.append(idx)
        bot_grid.append(row)

    # Bottom Triangles (reverse winding for downward face)
    for ir in range(nr):
        for it in range(nt):
            p00 = bot_grid[ir][it]
            p01 = bot_grid[ir][it + 1]
            p10 = bot_grid[ir + 1][it]
            p11 = bot_grid[ir + 1][it + 1]
            indices.extend([p00, p01, p10])
            indices.extend([p01, p11, p10])

    # 3. Left Cut Face (it = 0)
    for ir in range(nr):
        top_a = top_grid[ir][0]
        top_b = top_grid[ir + 1][0]
        bot_a = bot_grid[ir][0]
        bot_b = bot_grid[ir + 1][0]
        indices.extend([top_a, bot_a, top_b])
        indices.extend([top_b, bot_a, bot_b])

    # 4. Right Cut Face (it = nt)
    for ir in range(nr):
        top_a = top_grid[ir][nt]
        top_b = top_grid[ir + 1][nt]
        bot_a = bot_grid[ir][nt]
        bot_b = bot_grid[ir + 1][nt]
        indices.extend([top_a, top_b, bot_a])
        indices.extend([top_b, bot_b, bot_a])

    # 5. Back Crust Wall (ir = nr)
    for it in range(nt):
        top_a = top_grid[nr][it]
        top_b = top_grid[nr][it + 1]
        bot_a = bot_grid[nr][it]
        bot_b = bot_grid[nr][it + 1]
        indices.extend([top_a, top_b, bot_a])
        indices.extend([top_b, bot_b, bot_a])

    # 6. Physical 3D Pepperoni Slices (Embedded onto cheese with thickness & cupping)
    pep_specs = [
        (0.85, 0.0, 0.28, (430/1024, 430/1024)),
        (1.35, -0.09, 0.29, (590/1024, 470/1024)),
        (1.42, 0.10, 0.30, (512/1024, 620/1024)),
    ]
    for pr, ptheta, prad, (p_uc, p_vc) in pep_specs:
        cx = pr * math.sin(ptheta)
        cz = -pr * math.cos(ptheta)
        cy = top_height(pr, ptheta) + 0.015

        n_pep_segs = 16
        center_idx = len(positions) // 3
        positions.extend([cx, cy, cz])
        normals.extend([0.0, 1.0, 0.0])
        uvs.extend([p_uc, p_vc])

        rim_indices = []
        for iseg in range(n_pep_segs):
            ang = (iseg / n_pep_segs) * 2.0 * math.pi
            px = cx + prad * math.cos(ang)
            pz = cz + prad * math.sin(ang)
            py = cy + 0.018 # subtle cupped oven curling
            
            u = p_uc + (math.cos(ang) * 0.07)
            v = p_vc + (math.sin(ang) * 0.07)
            
            idx = len(positions) // 3
            positions.extend([px, py, pz])
            normals.extend([0.0, 1.0, 0.0])
            uvs.extend([u, v])
            rim_indices.append(idx)

        # Pepperoni top disc triangles
        for iseg in range(n_pep_segs):
            next_seg = (iseg + 1) % n_pep_segs
            indices.extend([center_idx, rim_indices[iseg], rim_indices[next_seg]])

        # Pepperoni side rim (thickness)
        base_indices = []
        for iseg in range(n_pep_segs):
            ang = (iseg / n_pep_segs) * 2.0 * math.pi
            px = cx + prad * math.cos(ang)
            pz = cz + prad * math.sin(ang)
            py = cy - 0.015 # embedded into cheese
            
            idx = len(positions) // 3
            positions.extend([px, py, pz])
            normals.extend([math.cos(ang), 0.0, math.sin(ang)])
            uvs.extend([p_uc, p_vc])
            base_indices.append(idx)

        for iseg in range(n_pep_segs):
            next_seg = (iseg + 1) % n_pep_segs
            ra = rim_indices[iseg]
            rb = rim_indices[next_seg]
            ba = base_indices[iseg]
            bb = base_indices[next_seg]
            indices.extend([ra, rb, ba])
            indices.extend([rb, bb, ba])

    # Recalculate smooth normals
    normals = [0.0] * len(positions)

    for i in range(0, len(indices), 3):
        i0, i1, i2 = indices[i], indices[i + 1], indices[i + 2]
        p0 = [positions[i0*3], positions[i0*3+1], positions[i0*3+2]]
        p1 = [positions[i1*3], positions[i1*3+1], positions[i1*3+2]]
        p2 = [positions[i2*3], positions[i2*3+1], positions[i2*3+2]]

        v0 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]
        v1 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]]

        fn = [
            v0[1] * v1[2] - v0[2] * v1[1],
            v0[2] * v1[0] - v0[0] * v1[2],
            v0[0] * v1[1] - v0[1] * v1[0]
        ]
        mag = math.sqrt(fn[0]**2 + fn[1]**2 + fn[2]**2)
        if mag > 1e-6:
            fn = [fn[0]/mag, fn[1]/mag, fn[2]/mag]
            for idx in [i0, i1, i2]:
                normals[idx*3] += fn[0]
                normals[idx*3+1] += fn[1]
                normals[idx*3+2] += fn[2]

    for idx in range(len(positions) // 3):
        nx, ny, nz = normals[idx*3], normals[idx*3+1], normals[idx*3+2]
        mag = math.sqrt(nx**2 + ny**2 + nz**2)
        if mag > 1e-6:
            normals[idx*3] = nx / mag
            normals[idx*3+1] = ny / mag
            normals[idx*3+2] = nz / mag

    return {
        'name': 'PizzaSlice',
        'positions': positions,
        'normals': normals,
        'uvs': uvs,
        'indices': indices,
        'texture_image': generate_pizza_texture(),
        'roughness': 0.38,
        'metalness': 0.05
    }


def build_esfirra_mesh():
    """Builds a complete, solid 3D round Brazilian open esfirra."""
    positions = []
    normals = []
    uvs = []
    indices = []

    n_rings = 26
    n_segs = 36
    r_max = 1.35
    r_filling_max = 0.95

    def esfirra_top_y(r, phi):
        if r < r_filling_max:
            # Cavity with savory minced beef & cheese
            u = r / r_filling_max
            base = 0.01 + 0.03 * math.cos(u * math.pi * 0.5)
            noise = 0.015 * math.sin(r * 12.0 + phi * 4.0)
            return base + noise
        else:
            # Puffed dough rim (borda)
            t = (r - r_filling_max) / (r_max - r_filling_max)
            arch = 0.22 * math.sin(t * math.pi)
            organic_waver = 0.02 * math.sin(6.0 * phi) * math.sin(t * math.pi)
            return 0.03 + arch - 0.08 * t + organic_waver

    # 1. Top Surface (Filling & Raised Rim)
    top_grid = []
    for ir in range(n_rings + 1):
        r = (ir / n_rings) * r_max
        row = []
        for iseg in range(n_segs):
            phi = (iseg / n_segs) * 2.0 * math.pi
            x = r * math.cos(phi)
            z = r * math.sin(phi)
            y = esfirra_top_y(r, phi)

            u = 0.5 + (x / (2.0 * r_max)) * 0.92
            v = 0.5 + (z / (2.0 * r_max)) * 0.92

            idx = len(positions) // 3
            positions.extend([x, y, z])
            normals.extend([0.0, 1.0, 0.0])
            uvs.extend([u, v])
            row.append(idx)
        top_grid.append(row)

    # Top Triangles
    for ir in range(n_rings):
        for iseg in range(n_segs):
            next_seg = (iseg + 1) % n_segs
            p00 = top_grid[ir][iseg]
            p01 = top_grid[ir][next_seg]
            p10 = top_grid[ir + 1][iseg]
            p11 = top_grid[ir + 1][next_seg]
            indices.extend([p00, p10, p01])
            indices.extend([p01, p10, p11])

    # 2. Bottom Surface (Baked Dough Base)
    bot_grid = []
    for ir in range(n_rings + 1):
        r = (ir / n_rings) * r_max
        row = []
        for iseg in range(n_segs):
            phi = (iseg / n_segs) * 2.0 * math.pi
            x = r * math.cos(phi)
            z = r * math.sin(phi)
            y = -0.08 # bottom level

            u = 0.5 + (x / (2.0 * r_max)) * 0.92
            v = 0.5 + (z / (2.0 * r_max)) * 0.92

            idx = len(positions) // 3
            positions.extend([x, y, z])
            normals.extend([0.0, -1.0, 0.0])
            uvs.extend([u, v])
            row.append(idx)
        bot_grid.append(row)

    # Bottom Triangles (downward facing)
    for ir in range(n_rings):
        for iseg in range(n_segs):
            next_seg = (iseg + 1) % n_segs
            p00 = bot_grid[ir][iseg]
            p01 = bot_grid[ir][next_seg]
            p10 = bot_grid[ir + 1][iseg]
            p11 = bot_grid[ir + 1][next_seg]
            indices.extend([p00, p01, p10])
            indices.extend([p01, p11, p10])

    # 3. Outer Edge Wall (connecting top rim edge to bottom edge)
    for iseg in range(n_segs):
        next_seg = (iseg + 1) % n_segs
        top_a = top_grid[n_rings][iseg]
        top_b = top_grid[n_rings][next_seg]
        bot_a = bot_grid[n_rings][iseg]
        bot_b = bot_grid[n_rings][next_seg]
        indices.extend([top_a, top_b, bot_a])
        indices.extend([top_b, bot_b, bot_a])

    # Recalculate smooth normals
    normals = [0.0] * len(positions)
    for i in range(0, len(indices), 3):
        i0, i1, i2 = indices[i], indices[i + 1], indices[i + 2]
        p0 = [positions[i0*3], positions[i0*3+1], positions[i0*3+2]]
        p1 = [positions[i1*3], positions[i1*3+1], positions[i1*3+2]]
        p2 = [positions[i2*3], positions[i2*3+1], positions[i2*3+2]]

        v0 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]]
        v1 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]]

        fn = [
            v0[1] * v1[2] - v0[2] * v1[1],
            v0[2] * v1[0] - v0[0] * v1[2],
            v0[0] * v1[1] - v0[1] * v1[0]
        ]
        mag = math.sqrt(fn[0]**2 + fn[1]**2 + fn[2]**2)
        if mag > 1e-6:
            fn = [fn[0]/mag, fn[1]/mag, fn[2]/mag]
            for idx in [i0, i1, i2]:
                normals[idx*3] += fn[0]
                normals[idx*3+1] += fn[1]
                normals[idx*3+2] += fn[2]

    for idx in range(len(positions) // 3):
        nx, ny, nz = normals[idx*3], normals[idx*3+1], normals[idx*3+2]
        mag = math.sqrt(nx**2 + ny**2 + nz**2)
        if mag > 1e-6:
            normals[idx*3] = nx / mag
            normals[idx*3+1] = ny / mag
            normals[idx*3+2] = nz / mag

    return {
        'name': 'EsfirraAberta',
        'positions': positions,
        'normals': normals,
        'uvs': uvs,
        'indices': indices,
        'texture_image': generate_esfirra_texture(),
        'roughness': 0.45,
        'metalness': 0.03
    }


if __name__ == '__main__':
    print('Generating 3D models...')
    pizza_data = build_pizza_mesh()
    create_glb([pizza_data], 'public/models/pizza.glb')

    esfirra_data = build_esfirra_mesh()
    create_glb([esfirra_data], 'public/models/esfirra.glb')
    print('All 3D models generated successfully in public/models/!')
