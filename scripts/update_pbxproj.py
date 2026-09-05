#!/usr/bin/env python3
import os, sys

pbx_path = r"c:\Users\Admin\Downloads\ANTIGRAVITY VIP\Thanox_iOS_App\ios-native\ThanoxVIP.xcodeproj\project.pbxproj"
patch_engine_dir = r"c:\Users\Admin\Downloads\ANTIGRAVITY VIP\Thanox_iOS_App\ios-native\ThanoxVIP\PatchEngine"

with open(pbx_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Collect all swift files in PatchEngine
swift_files = []
for root, _, files in os.walk(patch_engine_dir):
    for file in files:
        if file.endswith(".swift"):
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, r"c:\Users\Admin\Downloads\ANTIGRAVITY VIP\Thanox_iOS_App\ios-native\ThanoxVIP").replace("\\", "/")
            swift_files.append((file, rel_path))

# Also add bridging header
bridging_header = ("ThanoxVIP-Bridging-Header.h", "ThanoxVIP-Bridging-Header.h")

print(f"Found {len(swift_files)} Swift files to add.")

# Generate unique IDs
# We will use prefixes:
# Build file: A200...
# File ref:   B200...

build_files = []
file_refs = []
group_children = []
sources_entries = []

for i, (fname, rpath) in enumerate(swift_files):
    hex_id = f"{i+1:04X}"
    bf_id = f"A200{hex_id}2C85000100000001"
    fr_id = f"B200{hex_id}2C85000100000001"
    
    build_files.append(f"\t\t{bf_id} /* {fname} in Sources */ = {{isa = PBXBuildFile; fileRef = {fr_id} /* {fname} */; }};")
    file_refs.append(f"\t\t{fr_id} /* {fname} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = \"{rpath}\"; sourceTree = \"<group>\"; }};")
    group_children.append(f"\t\t\t\t{fr_id} /* {fname} */,")
    sources_entries.append(f"\t\t\t\t{bf_id} /* {fname} in Sources */,")

# Bridging header ref (not in sources)
bh_fr_id = "B200FFF02C85000100000001"
file_refs.append(f"\t\t{bh_fr_id} /* ThanoxVIP-Bridging-Header.h */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.c.h; path = \"ThanoxVIP-Bridging-Header.h\"; sourceTree = \"<group>\"; }};")
group_children.append(f"\t\t\t\t{bh_fr_id} /* ThanoxVIP-Bridging-Header.h */,")

# 1. Insert into PBXBuildFile section
build_file_anchor = "/* End PBXBuildFile section */"
new_build_files_str = "\n".join(build_files) + "\n" + build_file_anchor
content = content.replace(build_file_anchor, new_build_files_str, 1)

# 2. Insert into PBXFileReference section
file_ref_anchor = "/* End PBXFileReference section */"
new_file_refs_str = "\n".join(file_refs) + "\n" + file_ref_anchor
content = content.replace(file_ref_anchor, new_file_refs_str, 1)

# 3. Insert into ThanoxVIP PBXGroup
group_anchor = "B10000172C85000100000001 /* ThanoxVIP.entitlements */,"
new_group_str = group_anchor + "\n" + "\n".join(group_children)
content = content.replace(group_anchor, new_group_str, 1)

# 4. Insert into PBXSourcesBuildPhase
sources_anchor = "/* End PBXSourcesBuildPhase section */"
sources_insert_anchor = "A10000052C85000100000001 /* LocalSchemeHandler.m in Sources */,"
new_sources_str = sources_insert_anchor + "\n" + "\n".join(sources_entries)
content = content.replace(sources_insert_anchor, new_sources_str, 1)

# 5. Add Swift build settings to all XCBuildConfiguration
swift_settings = """				SWIFT_VERSION = 5.0;
				SWIFT_OBJC_BRIDGING_HEADER = "ThanoxVIP/ThanoxVIP-Bridging-Header.h";
				CLANG_ENABLE_MODULES = YES;"""

# Add to target Debug (M10000012C85000100000001) and Release (M10000022C85000100000001)
content = content.replace(
    'PRODUCT_NAME = "$(TARGET_NAME)";',
    'PRODUCT_NAME = "$(TARGET_NAME)";\n' + swift_settings
)

# Also add SWIFT_VERSION = 5.0 to project configurations (L10000012C85000100000001 and L10000022C85000100000001)
content = content.replace(
    'SDKROOT = iphoneos;',
    'SDKROOT = iphoneos;\n\t\t\t\tSWIFT_VERSION = 5.0;'
)

with open(pbx_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully updated project.pbxproj! New length: {len(content)}")
