from PIL import Image
import os

INPUT_FILE = r"C:\Users\Oz\Desktop\AssetSwap\characters\YeOldyNecroGuy.png"
OUTPUT_DIR = r"C:\Users\Oz\Desktop\nodejs\Grimor\assets\characters\witch"

COLS = 9
ROWS = 3
ROW_NAMES = ["idle", "walk", "attack"]

os.makedirs(OUTPUT_DIR, exist_ok=True)

sheet = Image.open(INPUT_FILE).convert("RGBA")
sheet_w, sheet_h = sheet.size
frame_w = sheet_w // COLS
frame_h = sheet_h // ROWS

print(f"Sheet: {sheet_w}x{sheet_h}, Frame: {frame_w}x{frame_h}")

for row in range(ROWS):
    row_name = ROW_NAMES[row]
    saved = 0
    for col in range(COLS):
        x = col * frame_w
        y = row * frame_h
        frame = sheet.crop((x, y, x + frame_w, y + frame_h))
        if frame.getbbox() is None:
            continue
        filename = f"{row_name}_{col:02d}.png"
        frame.save(os.path.join(OUTPUT_DIR, filename))
        saved += 1
    print(f"  {row_name}: {saved} frames saved")

print(f"\nDone. Files in: {OUTPUT_DIR}")