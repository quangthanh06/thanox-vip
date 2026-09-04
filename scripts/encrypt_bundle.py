import os, struct, hashlib, sys
sys.stdout.reconfigure(encoding="utf-8")
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(SCRIPT_DIR)
IOS_DIR = os.path.join(APP_DIR, "ios-native", "ThanoxVIP")

# Obfuscated Key & IV matching SecurityShield.m
OBFUSCATED_KEY = bytes([
    0x6E, 0x38, 0x1F, 0x72, 0x05, 0x6A, 0x24, 0x4D,
    0x3B, 0x12, 0x7E, 0x55, 0x09, 0x3C, 0x61, 0x2A,
    0x78, 0x0F, 0x42, 0x19, 0x5D, 0x66, 0x33, 0x7C,
    0x21, 0x48, 0x0B, 0x63, 0x1A, 0x7F, 0x54, 0x36
])

OBFUSCATED_IV = bytes([
    0x1C, 0x4F, 0x72, 0x29, 0x5A, 0x03, 0x3E, 0x61,
    0x48, 0x15, 0x7C, 0x23, 0x5D, 0x0B, 0x34, 0x67
])

KEY_MASK = 0x5A

AES_KEY = bytes([b ^ KEY_MASK for b in OBFUSCATED_KEY])
AES_IV = bytes([b ^ KEY_MASK for b in OBFUSCATED_IV])

# Files to package
files_to_pack = [
    ("index.html", os.path.join(APP_DIR, "index.html")),
    ("assets/tailwind.js", os.path.join(APP_DIR, "assets", "tailwind.js")),
    ("assets/lucide.js", os.path.join(APP_DIR, "assets", "lucide.js")),
    ("assets/AppIcon.png", os.path.join(APP_DIR, "assets", "AppIcon.png")),
    ("FFTH AIMBODY.3105", os.path.join(APP_DIR, "FFTH AIMBODY.3105")),
    ("FFMAX AIMBODY.3105", os.path.join(APP_DIR, "FFMAX AIMBODY.3105")),
]

# Pack into custom binary archive
archive_bytes = bytearray()
archive_bytes.extend(struct.pack("<I", len(files_to_pack)))

for rel_path, full_path in files_to_pack:
    assert os.path.exists(full_path), f"Missing file: {full_path}"
    with open(full_path, "rb") as f:
        data = f.read()
    
    path_bytes = rel_path.encode("utf-8")
    archive_bytes.extend(struct.pack("<H", len(path_bytes)))
    archive_bytes.extend(path_bytes)
    archive_bytes.extend(struct.pack("<I", len(data)))
    archive_bytes.extend(data)
    print(f"Packed: {rel_path} ({len(data)} bytes)")

raw_archive = bytes(archive_bytes)
print(f"Total raw archive size: {len(raw_archive)} bytes")

# PKCS7 Padding for AES-256-CBC
padder = padding.PKCS7(128).padder()
padded_data = padder.update(raw_archive) + padder.finalize()

cipher = Cipher(algorithms.AES(AES_KEY), modes.CBC(AES_IV))
encryptor = cipher.encryptor()
encrypted_data = encryptor.update(padded_data) + encryptor.finalize()

print(f"Encrypted data size: {len(encrypted_data)} bytes")
sha256_hash = hashlib.sha256(encrypted_data).hexdigest()
print("Encrypted assets.enc SHA-256:", sha256_hash)

# Save to destination paths
os.makedirs(IOS_DIR, exist_ok=True)
out_ios = os.path.join(IOS_DIR, "assets.enc")
with open(out_ios, "wb") as f:
    f.write(encrypted_data)

out_app = os.path.join(APP_DIR, "assets.enc")
with open(out_app, "wb") as f:
    f.write(encrypted_data)

print("Written assets.enc successfully!")
