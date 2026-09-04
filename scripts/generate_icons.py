from PIL import Image
import os, sys
sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(SCRIPT_DIR)
SRC_ICON = os.path.join(APP_DIR, "assets", "AppIcon.png")
ICONSET_DIR = os.path.join(APP_DIR, "ios-native", "ThanoxVIP", "Assets.xcassets", "AppIcon.appiconset")
os.makedirs(ICONSET_DIR, exist_ok=True)

img = Image.open(SRC_ICON).convert("RGBA")

sizes = [
    ("AppIcon-20@2x.png", 40),
    ("AppIcon-20@3x.png", 60),
    ("AppIcon-29@2x.png", 58),
    ("AppIcon-29@3x.png", 87),
    ("AppIcon-40@2x.png", 80),
    ("AppIcon-40@3x.png", 120),
    ("AppIcon-60@2x.png", 120),
    ("AppIcon-60@3x.png", 180),
    ("AppIcon-76@2x.png", 152),
    ("AppIcon-83.5@2x.png", 167),
    ("AppIcon-1024.png", 1024),
    ("AppIcon60x60@2x.png", 120),
    ("AppIcon60x60@3x.png", 180),
]

for filename, px in sizes:
    resized = img.resize((px, px), Image.Resampling.LANCZOS)
    out_path = os.path.join(ICONSET_DIR, filename)
    resized.save(out_path, "PNG")

# Contents.json for xcassets
contents_json = """{
  "images" : [
    { "idiom" : "iphone", "scale" : "2x", "size" : "20x20", "filename" : "AppIcon-20@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "20x20", "filename" : "AppIcon-20@3x.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "29x29", "filename" : "AppIcon-29@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "29x29", "filename" : "AppIcon-29@3x.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "40x40", "filename" : "AppIcon-40@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "40x40", "filename" : "AppIcon-40@3x.png" },
    { "idiom" : "iphone", "scale" : "2x", "size" : "60x60", "filename" : "AppIcon-60@2x.png" },
    { "idiom" : "iphone", "scale" : "3x", "size" : "60x60", "filename" : "AppIcon-60@3x.png" },
    { "idiom" : "ios-marketing", "scale" : "1x", "size" : "1024x1024", "filename" : "AppIcon-1024.png" }
  ],
  "info" : { "author" : "xcode", "version" : 1 }
}"""

with open(os.path.join(ICONSET_DIR, "Contents.json"), "w", encoding="utf-8") as f:
    f.write(contents_json)

xcassets_root = os.path.dirname(ICONSET_DIR)
with open(os.path.join(xcassets_root, "Contents.json"), "w", encoding="utf-8") as f:
    f.write('{"info" : {"author" : "xcode", "version" : 1}}')

print("Generated all app icons successfully!")
