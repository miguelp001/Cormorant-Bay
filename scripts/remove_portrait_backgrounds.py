import os
import rembg
from PIL import Image

CHARACTERS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist', 'assets', 'images', 'characters'))

characters = ['vance', 'nora', 'toby', 'creel', 'kell', 'price']

print(f"Processing character portraits in: {CHARACTERS_DIR}")

session = rembg.new_session()

for char in characters:
    jpg_path = os.path.join(CHARACTERS_DIR, f"{char}.jpg")
    png_path = os.path.join(CHARACTERS_DIR, f"{char}.png")
    
    if not os.path.exists(jpg_path):
        print(f"Warning: {jpg_path} not found!")
        continue
    
    print(f"Removing background from {char}.jpg -> {char}.png...")
    inp = Image.open(jpg_path)
    out = rembg.remove(inp, session=session)
    
    # Ensure it's RGBA
    if out.mode != 'RGBA':
        out = out.convert('RGBA')
        
    out.save(png_path, format='PNG', optimize=True)
    
    # Calculate transparency stats
    alpha = out.split()[-1]
    hist = alpha.histogram()
    transparent_pixels = hist[0]
    total_pixels = out.width * out.height
    transparency_pct = (transparent_pixels / total_pixels) * 100
    
    print(f"  [OK] {char}.png saved: {out.size[0]}x{out.size[1]} | {transparency_pct:.1f}% transparent pixels")

# Clean up test file if exists
test_path = os.path.join(CHARACTERS_DIR, "toby_test.png")
if os.path.exists(test_path):
    os.remove(test_path)

print("All character portraits successfully processed to transparent PNGs!")
