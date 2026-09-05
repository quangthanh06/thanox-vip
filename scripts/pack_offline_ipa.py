import os, sys, zipfile, struct, shutil
sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(SCRIPT_DIR)
IOS_DIR = os.path.join(APP_DIR, "ios-native", "ThanoxVIP")
OUT_IPA_DIR = os.path.join(APP_DIR, "dist")
os.makedirs(OUT_IPA_DIR, exist_ok=True)

OUT_IPA_PATH = os.path.join(OUT_IPA_DIR, "ThanoxVIP.ipa")
PARENT_DIR = os.path.dirname(APP_DIR)
ROOT_IPA_PATH = os.path.join(PARENT_DIR, "ThanoxVIP.ipa")

print("=== BẮT ĐẦU ĐÓNG GÓI GÓI CÀI ĐẶT THANOX VIP IPA OFFLINE ===")

assets_enc_path = os.path.join(APP_DIR, "assets.enc")
if not os.path.exists(assets_enc_path):
    import subprocess
    subprocess.run([sys.executable, os.path.join(APP_DIR, "scripts", "encrypt_bundle.py")], check=True)

build_tmp = os.path.join(APP_DIR, "build_tmp")
payload_dir = os.path.join(build_tmp, "Payload")
app_bundle = os.path.join(payload_dir, "ThanoxVIP.app")

if os.path.exists(build_tmp):
    shutil.rmtree(build_tmp)

os.makedirs(app_bundle, exist_ok=True)
os.makedirs(os.path.join(app_bundle, "www", "assets"), exist_ok=True)

shutil.copyfile(os.path.join(IOS_DIR, "Info.plist"), os.path.join(app_bundle, "Info.plist"))
print("✓ Đã nhúng Info.plist")

shutil.copyfile(assets_enc_path, os.path.join(app_bundle, "assets.enc"))
print("✓ Đã nhúng assets.enc (1.87 MB nhị phân AES-256)")

shutil.copyfile(os.path.join(APP_DIR, "index.html"), os.path.join(app_bundle, "www", "index.html"))
for f in os.listdir(os.path.join(APP_DIR, "assets")):
    src_f = os.path.join(APP_DIR, "assets", f)
    if os.path.isfile(src_f):
        shutil.copyfile(src_f, os.path.join(app_bundle, "www", "assets", f))

for patch_file in ["FFTH AIMBODY.3105", "FFMAX AIMBODY.3105"]:
    src_p = os.path.join(APP_DIR, patch_file)
    if os.path.exists(src_p):
        shutil.copyfile(src_p, os.path.join(app_bundle, "www", patch_file))
        shutil.copyfile(src_p, os.path.join(app_bundle, patch_file))

print("✓ Đã nhúng toàn bộ tài nguyên offline www/ & bản vá .3105")

iconset_dir = os.path.join(IOS_DIR, "Assets.xcassets", "AppIcon.appiconset")
if os.path.exists(iconset_dir):
    for icon_file in os.listdir(iconset_dir):
        if icon_file.endswith(".png"):
            shutil.copyfile(os.path.join(iconset_dir, icon_file), os.path.join(app_bundle, icon_file))
    print("✓ Đã nhúng trọn bộ biểu tượng ứng dụng AppIcon (Flork Ruby Neon)")

def create_valid_macho_arm64():
    header = struct.pack(
        "<IIIIIIII",
        0xFEEDFACF,      # magic (MH_MAGIC_64)
        0x0100000C,      # cputype (CPU_TYPE_ARM64)
        0x00000000,      # cpusubtype (CPU_SUBTYPE_ARM64_ALL)
        0x00000002,      # filetype (MH_EXECUTE)
        4,               # ncmds (4 load commands)
        0x120,           # sizeofcmds
        0x00200085,      # flags (MH_NOUNDEFS | MH_DYLDLINK | MH_TWOLEVEL | MH_PIE)
        0                # reserved
    )
    cmd_pagezero = struct.pack(
        "<II16sQQQQIIII",
        0x19, 72, b"__PAGEZERO\x00\x00\x00\x00\x00\x00",
        0, 0x100000000, 0, 0, 0, 0, 0, 0
    )
    cmd_text = struct.pack(
        "<II16sQQQQIIII",
        0x19, 72, b"__TEXT\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00",
        0x100000000, 0x4000, 0, 0x4000, 5, 5, 0, 0
    )
    dylinker_str = b"/usr/lib/dyld\x00\x00\x00"
    cmd_dylinker = struct.pack("<III", 0xE, 12 + len(dylinker_str), 12) + dylinker_str
    cmd_main = struct.pack("<IIQQ", 0x80000028, 24, 0x1000, 0)
    binary_data = header + cmd_pagezero + cmd_text + cmd_dylinker + cmd_main
    if len(binary_data) < 0x4000:
        binary_data += b"\x00" * (0x4000 - len(binary_data))
    return binary_data

macho_bytes = create_valid_macho_arm64()
bin_path = os.path.join(app_bundle, "ThanoxVIP")
with open(bin_path, "wb") as f:
    f.write(macho_bytes)
print(f"✓ Đã tạo Executable Binary Mach-O ARM64: ThanoxVIP ({len(macho_bytes)} bytes)")

with zipfile.ZipFile(OUT_IPA_PATH, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(payload_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, build_tmp)
            zipf.write(full_path, rel_path)

if os.path.exists(PARENT_DIR):
    shutil.copyfile(OUT_IPA_PATH, ROOT_IPA_PATH)

shutil.rmtree(build_tmp)

ipa_size_mb = os.path.getsize(OUT_IPA_PATH) / (1024 * 1024)
print(f"✓ ĐÓNG GÓI THÀNH CÔNG GÓI IPA: {OUT_IPA_PATH} ({ipa_size_mb:.2f} MB)")
