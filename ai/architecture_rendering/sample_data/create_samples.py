from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def create_sample_images():
    output_dir = Path(__file__).parent
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Sample Interior 3D View (Wireframe / Shaded Revit style)
    w, h = 1024, 768
    interior = Image.new("RGB", (w, h), color=(240, 242, 245))
    draw = ImageDraw.Draw(interior)

    # Back wall
    draw.polygon([(200, 150), (824, 150), (824, 600), (200, 600)], fill=(225, 228, 232), outline=(120, 130, 140), width=2)
    # Floor perspective
    draw.polygon([(0, 768), (200, 600), (824, 600), (1024, 768)], fill=(210, 205, 195), outline=(100, 110, 120), width=2)
    # Ceiling perspective
    draw.polygon([(0, 0), (200, 150), (824, 150), (1024, 0)], fill=(248, 249, 250), outline=(140, 150, 160), width=2)
    # Left wall
    draw.polygon([(0, 0), (200, 150), (200, 600), (0, 768)], fill=(230, 233, 238), outline=(120, 130, 140), width=2)
    # Right wall with large window
    draw.polygon([(824, 150), (1024, 0), (1024, 768), (824, 600)], fill=(235, 238, 242), outline=(120, 130, 140), width=2)
    draw.polygon([(860, 200), (1000, 80), (1000, 680), (860, 560)], fill=(200, 220, 240), outline=(50, 70, 90), width=3)
    # Window mullions
    draw.line([(930, 140), (930, 620)], fill=(50, 70, 90), width=2)
    draw.line([(860, 380), (1000, 380)], fill=(50, 70, 90), width=2)
    # Furniture block (Sofa outline)
    draw.rectangle([(320, 480), (700, 580)], fill=(180, 185, 190), outline=(80, 90, 100), width=2)
    draw.rectangle([(300, 450), (720, 510)], fill=(160, 165, 172), outline=(70, 80, 90), width=2)
    # Floor grid lines (tiles/timber floor hint)
    for x in range(100, 1024, 120):
        draw.line([(x, 768), (400 + (x-512)//3, 600)], fill=(185, 180, 170), width=1)
    # Text label
    draw.text((30, 30), "AUTODESK REVIT - 3D INTERIOR VIEW {3D - LIVING ROOM}", fill=(60, 70, 80))

    interior_path = output_dir / "sample_interior_view.png"
    interior.save(interior_path)
    print(f"Created: {interior_path}")

    # 2. Sample Exterior 3D View (Modern Villa wireframe/shaded)
    exterior = Image.new("RGB", (w, h), color=(220, 235, 250))
    draw = ImageDraw.Draw(exterior)

    # Ground plane
    draw.rectangle([(0, 550), (1024, 768)], fill=(190, 215, 170), outline=(100, 130, 90), width=2)
    # Main building massing (lower block)
    draw.polygon([(250, 350), (750, 350), (820, 300), (820, 560), (750, 620), (250, 620)], fill=(235, 235, 235), outline=(60, 60, 70), width=2)
    # Cantilevered upper block
    draw.polygon([(180, 220), (680, 220), (760, 170), (760, 370), (680, 420), (180, 420)], fill=(215, 218, 222), outline=(40, 40, 50), width=3)
    # Large glass curtain wall on upper block
    draw.polygon([(220, 260), (640, 260), (640, 390), (220, 390)], fill=(160, 200, 230), outline=(30, 50, 80), width=2)
    # Mullions on glass
    for mx in [320, 420, 520]:
        draw.line([(mx, 260), (mx, 390)], fill=(30, 50, 80), width=2)
    # Entrance canopy & steps
    draw.polygon([(300, 620), (500, 620), (550, 660), (250, 660)], fill=(180, 180, 185), outline=(70, 70, 80), width=2)
    # Text label
    draw.text((30, 30), "AUTODESK REVIT - 3D EXTERIOR PERSPECTIVE {VILLA FACADE}", fill=(50, 60, 70))

    exterior_path = output_dir / "sample_exterior_view.png"
    exterior.save(exterior_path)
    print(f"Created: {exterior_path}")

if __name__ == "__main__":
    create_sample_images()
