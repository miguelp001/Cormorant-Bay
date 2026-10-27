import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SRC = r'C:\Users\migue\.gemini\antigravity\brain\b771fbee-1f05-49d9-849d-96c60e5eb747\ui_title_screen_1793120079694.jpg'
DEST_UI = r'dist\assets\images\ui\ui_title_screen.jpg'
DEST_UI_CLEAN = r'dist\assets\images\ui\ui_title_clean.jpg'
DEST_BG = r'dist\assets\images\backgrounds\bg_title_drop.jpg'

os.makedirs('dist/assets/images/ui', exist_ok=True)
os.makedirs('dist/assets/images/backgrounds', exist_ok=True)

base_im = Image.open(SRC).convert('RGBA')

# Save clean version
base_im.convert('RGB').save(DEST_UI_CLEAN, quality=92)
print("Saved clean version to:", DEST_UI_CLEAN)

# Create high-end cinematic title drop composite
W, H = base_im.size

# Overlay subtle dark vignette gradient on top third to ensure title pops dramatically
vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
v_draw = ImageDraw.Draw(vignette)

# Draw subtle top-to-center dark fog gradient
for y in range(int(H * 0.65)):
    alpha = int(95 * (1.0 - (y / (H * 0.65)) ** 1.3))
    v_draw.line([(0, y), (W, y)], fill=(12, 16, 20, alpha))

comp = Image.alpha_composite(base_im, vignette)

# Fonts
font_path_bold = r'C:\Windows\Fonts\georgiab.ttf'
font_path_reg = r'C:\Windows\Fonts\georgia.ttf'

title_text = "C O R M O R A N T   B A Y"
sub_text = "A   S T A T - D R I V E N   F O L K   H O R R O R   M Y S T E R Y"

title_size = 54
sub_size = 15

title_font = ImageFont.truetype(font_path_bold, title_size)
sub_font = ImageFont.truetype(font_path_reg, sub_size)

# Create text layer
text_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
t_draw = ImageDraw.Draw(text_layer)

# Measure title
title_bbox = t_draw.textbbox((0, 0), title_text, font=title_font)
title_w = title_bbox[2] - title_bbox[0]
title_h = title_bbox[3] - title_bbox[1]

sub_bbox = t_draw.textbbox((0, 0), sub_text, font=sub_font)
sub_w = sub_bbox[2] - sub_bbox[0]
sub_h = sub_bbox[3] - sub_bbox[1]

# Position in upper 30% of frame
center_x = W // 2
title_y = int(H * 0.22)
sub_y = title_y + title_h + 24

title_x = center_x - (title_w // 2)
sub_x = center_x - (sub_w // 2)

# Shadow layer for cinematic depth
shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
s_draw = ImageDraw.Draw(shadow_layer)

# Draw soft shadows
for offset in [(0, 3), (0, 4), (1, 3), (-1, 3), (0, 2)]:
    s_draw.text((title_x + offset[0], title_y + offset[1]), title_text, font=title_font, fill=(0, 0, 0, 180))
    s_draw.text((sub_x + offset[0], sub_y + offset[1]), sub_text, font=sub_font, fill=(0, 0, 0, 160))

# Blur shadow
shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=3))

# Draw crisp foreground text
# Off-white weathered antique paper color: #F1EBD9
text_color = (241, 235, 217, 245)
sub_color = (194, 155, 98, 230) # Accent gold tone

t_draw.text((title_x, title_y), title_text, font=title_font, fill=text_color)
t_draw.text((sub_x, sub_y), sub_text, font=sub_font, fill=sub_color)

# Decorative rule line between or under
line_y = sub_y + sub_h + 16
line_w = 120
t_draw.line([(center_x - line_w // 2, line_y), (center_x + line_w // 2, line_y)], fill=(194, 155, 98, 180), width=1)

# Composite all layers
final = Image.alpha_composite(comp, shadow_layer)
final = Image.alpha_composite(final, text_layer)

# Save to destination paths
final_rgb = final.convert('RGB')
final_rgb.save(DEST_UI, quality=94)
final_rgb.save(DEST_BG, quality=94)

print("Title drop image created successfully!")
print("Saved UI title to:", DEST_UI)
print("Saved BG title drop to:", DEST_BG)
