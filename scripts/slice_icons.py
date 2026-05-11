from PIL import Image
import os

# ── CONFIG ──────────────────────────────────────────────
INPUT_FILE = r"C:\path\to\your\icon_sheet.png"  # change this
OUTPUT_DIR = r"C:\Users\Oz\Desktop\nodejs\Grimor\assets\icons\sliced"

# How many columns and rows in the icon grid
COLS = 10   # adjust to match your sheet
ROWS = 10   # adjust to match your sheet

# Optional: give each icon a name
# If empty, files are named icon_row_col.png
# Fill this in order left-to-right, top-to-bottom
ICON_NAMES = [
    # "sword", "shield", "hat_wizard", ...
    # leave empty to use auto-naming
]

# Padding to trim from each icon edge (if icons have gaps)
PADDING = 2
# ────────────────────────────────────────────────────────

os.makedirs(OUTPUT_DIR, exist_ok=True)

sheet = Image.open(INPUT_FILE).convert("RGBA")
sheet_w, sheet_h = sheet.size

frame_w = sheet_w // COLS
frame_h = sheet_h // ROWS

print(f"Sheet: {sheet_w}x{sheet_h}")
print(f"Icon size: {frame_w}x{frame_h}")
print(f"Slicing {ROWS} rows x {COLS} cols = {ROWS*COLS} icons...")

count = 0
for row in range(ROWS):
    for col in range(COLS):
        x = col * frame_w + PADDING
        y = row * frame_h + PADDING
        w = frame_w - PADDING * 2
        h = frame_h - PADDING * 2
        icon = sheet.crop((x, y, x + w, y + h))
        
        # Skip completely transparent/empty frames
        if icon.getbbox() is None:
            continue
        
        idx = row * COLS + col
        if idx < len(ICON_NAMES) and ICON_NAMES[idx]:
            filename = f"{ICON_NAMES[idx]}.png"
        else:
            filename = f"icon_{row:02d}_{col:02d}.png"
        
        filepath = os.path.join(OUTPUT_DIR, filename)
        icon.save(filepath)
        count += 1

print(f"\nDone. {count} icons saved to: {OUTPUT_DIR}")