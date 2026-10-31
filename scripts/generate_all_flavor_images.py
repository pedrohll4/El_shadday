import os
import io
import urllib.request
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

OUTPUT_DIR = os.path.join("public", "flavors")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Sources from El Shadday Olaclick high-res products
SOURCES = {
    "calabresa": "https://assets.olaclick.app/companies/products/images/800/b9859011-b627-4250-90de-a92a3a3d6177.jpeg",
    "mucarela": "https://assets.olaclick.app/companies/products/images/800/7fb03255-1d3f-4380-ba54-30742703bb5d.jpeg",
    "dois-queijos": "https://assets.olaclick.app/companies/products/images/800/7fb03255-1d3f-4380-ba54-30742703bb5d.jpeg",
    "frango-catupiry": "https://assets.olaclick.app/companies/products/images/800/9a4dc97a-a4ce-4279-82d4-7a51325d1648.jpeg",
    "frango-cheddar": "https://assets.olaclick.app/companies/products/images/800/f94c32f0-ca2f-4e20-b276-d512eae188db.jpeg",
    "vegetariana": "https://assets.olaclick.app/companies/products/images/800/14995c2c-18e7-4330-9ce8-b0f6ef75d6ff.jpeg",
    "calabresa-picadinha": "https://assets.olaclick.app/companies/products/images/800/90c1a95b-0544-4c87-bc28-457a7d50d999.jpeg",
    "bacon-crocante": "https://assets.olaclick.app/companies/products/images/800/d4a84c53-79c6-47dd-a0ef-4bb7f8316a87.jpeg",
    "romanesca": "https://assets.olaclick.app/companies/products/images/800/80ee539a-0a44-44f7-abf5-5e02b4c2f34b.png",
    "hot-dog": "https://assets.olaclick.app/companies/products/images/800/ef45a3ef-d4ee-4dc0-a243-c7770c8d909f.jpeg",
    "baiana-apimentada": "https://assets.olaclick.app/companies/products/images/800/b9859011-b627-4250-90de-a92a3a3d6177.jpeg",
    "frango-milho": "https://assets.olaclick.app/companies/products/images/800/af8569cc-1a77-4fe1-a837-f134533522ec.jpeg",
    "milho": "https://assets.olaclick.app/companies/products/images/800/ef45a3ef-d4ee-4dc0-a243-c7770c8d909f.jpeg",
    "calabresa-catupiry": "https://assets.olaclick.app/companies/products/images/800/9a4dc97a-a4ce-4279-82d4-7a51325d1648.jpeg",
    "carne-seca": "https://assets.olaclick.app/companies/products/images/800/34932ad4-8ab9-4f03-b2b8-94b83324232b.jpeg",
    "strogonoff-frango": "https://assets.olaclick.app/companies/products/images/800/af8569cc-1a77-4fe1-a837-f134533522ec.jpeg",
    "lombo-abacaxi": "https://assets.olaclick.app/companies/products/images/800/80ee539a-0a44-44f7-abf5-5e02b4c2f34b.png",
    "lombo-portuguesa": "https://assets.olaclick.app/companies/products/images/800/80ee539a-0a44-44f7-abf5-5e02b4c2f34b.png",
    "brigadeiro-gourmet": "https://assets.olaclick.app/companies/products/images/800/d03d6a99-9d23-455c-b1da-7cb643d6a34b.jpeg",
    "banana-canela": "https://assets.olaclick.app/companies/products/images/800/06fd1e23-74ce-4a87-a31b-6867664e718b.jpeg",
    "romeu-julieta": "https://assets.olaclick.app/companies/products/images/800/3d9bce96-b41f-4b69-92da-d8614427dfd4.jpeg",
    "prestigio-gourmet": "https://assets.olaclick.app/companies/products/images/800/cb651694-adab-468b-8404-2be34d3c4b76.jpeg",
    "chocolate-morango": "https://assets.olaclick.app/companies/products/images/800/aac6df81-fb06-4e5a-ac4b-31d0abd31534.jpeg",
    "chocolate-branco": "https://assets.olaclick.app/companies/products/images/800/2243d4f5-19ae-4e4a-905f-a73d5fd09840.jpeg",
    "banana-nevada": "https://assets.olaclick.app/companies/products/images/800/5517e7e7-9d37-4653-a654-e15e54faeaf1.jpeg",
    "confete-mm": "https://assets.olaclick.app/companies/products/images/800/06b09d11-16fd-4524-a73d-58472a052bb5.jpeg",
    "doce-leite-pacoca": "https://assets.olaclick.app/companies/products/images/800/a2499912-d1b7-457d-b65a-1105d69d214a.jpeg",
}

# Download cache
cache = {}

def get_image(url):
    if url in cache:
        return cache[url].copy()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            img = Image.open(io.BytesIO(r.read())).convert("RGBA")
            cache[url] = img
            return img.copy()
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def process_flavor(flavor_id, url):
    img = get_image(url)
    if not img:
        print(f"Failed to process {flavor_id}")
        return

    w, h = img.size
    cx, cy = w // 2, h // 2
    radius = int(min(w, h) * 0.44)

    # Clean circular mask with anti-aliasing / slight feather
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=3))
    img.putalpha(mask)

    # Optional toppings customization / flavor embellishments
    if flavor_id == "carne-seca":
        # Add Catupiry spiral overlay on Carne Seca
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        o_draw = ImageDraw.Draw(overlay)
        # Elegant Catupiry cream swirl
        swirl_coords = [
            (cx - radius * 0.6, cy - radius * 0.2),
            (cx - radius * 0.2, cy - radius * 0.6),
            (cx + radius * 0.5, cy - radius * 0.3),
            (cx + radius * 0.4, cy + radius * 0.4),
            (cx - radius * 0.3, cy + radius * 0.5),
            (cx - radius * 0.1, cy + radius * 0.1),
            (cx + radius * 0.1, cy - radius * 0.1),
        ]
        for i in range(len(swirl_coords) - 1):
            o_draw.line([swirl_coords[i], swirl_coords[i+1]], fill=(255, 253, 240, 220), width=int(radius * 0.12))
        overlay = overlay.filter(ImageFilter.GaussianBlur(radius=2))
        img = Image.alpha_composite(img, overlay)

    elif flavor_id == "strogonoff-frango":
        # Shoestring potato sprinkles (batata palha)
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        o_draw = ImageDraw.Draw(overlay)
        import random
        random.seed(42)
        for _ in range(35):
            px = cx + random.randint(-int(radius*0.6), int(radius*0.6))
            py = cy + random.randint(-int(radius*0.6), int(radius*0.6))
            length = random.randint(15, 30)
            angle = random.randint(0, 360)
            import math
            rad = math.radians(angle)
            dx = int(math.cos(rad) * length)
            dy = int(math.sin(rad) * length)
            o_draw.line([(px, py), (px + dx, py + dy)], fill=(245, 200, 70, 230), width=4)
        overlay = overlay.filter(ImageFilter.GaussianBlur(radius=1))
        img = Image.alpha_composite(img, overlay)

    elif flavor_id == "baiana-apimentada":
        # Pepper flakes garnish
        overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        o_draw = ImageDraw.Draw(overlay)
        import random
        random.seed(99)
        for _ in range(40):
            px = cx + random.randint(-int(radius*0.7), int(radius*0.7))
            py = cy + random.randint(-int(radius*0.7), int(radius*0.7))
            r_flake = random.randint(3, 6)
            o_draw.ellipse([px-r_flake, py-r_flake, px+r_flake, py+r_flake], fill=(220, 30, 20, 210))
        img = Image.alpha_composite(img, overlay)

    # Re-apply circular alpha mask to prevent overlays spilling
    curr_alpha = img.split()[3]
    final_alpha = Image.new("L", (w, h), 0)
    for y in range(h):
        for x in range(w):
            pass # Pillow handles with mask directly
    img.putalpha(Image.composite(curr_alpha, Image.new("L", (w, h), 0), mask))

    # Add subtle realistic transparent drop shadow
    pad = int(min(w, h) * 0.08)
    canvas = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(canvas)
    
    # Soft drop shadow
    shadow_box = [
        cx - radius + pad, 
        cy - radius + pad + int(pad * 0.35), 
        cx + radius + pad, 
        cy + radius + pad + int(pad * 0.35)
    ]
    s_draw.ellipse(shadow_box, fill=(0, 0, 0, 140))
    canvas = canvas.filter(ImageFilter.GaussianBlur(radius=int(pad * 0.35)))

    # Composite pizza on top of drop shadow
    canvas.alpha_composite(img, (pad, pad))

    # Auto-crop transparent boundaries
    bbox = canvas.getbbox()
    if bbox:
        canvas = canvas.crop(bbox)

    # Resize to crisp 260x260 for web
    canvas.thumbnail((260, 260), Image.Resampling.LANCZOS)
    
    out_path = os.path.join(OUTPUT_DIR, f"{flavor_id}.png")
    canvas.save(out_path, "PNG", optimize=True)
    print(f"Generated: {out_path} ({canvas.size[0]}x{canvas.size[1]})")

print("Generating all 27 flavor images...")
for fid, url in SOURCES.items():
    process_flavor(fid, url)
print("All flavor cutouts created successfully!")
