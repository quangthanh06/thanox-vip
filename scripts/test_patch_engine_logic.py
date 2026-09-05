#!/usr/bin/env python3
import os, sys, hashlib, tempfile, shutil, plistlib, uuid

def calculate_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def test_security_path_resolver():
    print("Testing Security Path Resolver...")
    # Test cases for path traversal
    malicious = [
        "../escape.txt",
        "../../etc/passwd",
        "/absolute/path",
        "file:///root",
        "safe/../../outside",
        "safe/../..",
    ]
    
    with tempfile.TemporaryDirectory() as root:
        root_canon = os.path.realpath(root)
        for path in malicious:
            # Replicate SecurePathResolver logic
            trimmed = path.strip()
            rejected = False
            if trimmed.startswith("file://") or trimmed.startswith("/"):
                rejected = True
            elif ".." in trimmed.split("/"):
                rejected = True
            else:
                target = os.path.realpath(os.path.join(root_canon, trimmed))
                if not (target == root_canon or target.startswith(root_canon + os.sep)):
                    rejected = True
            
            assert rejected, f"Failed to reject malicious path: {path}"
            print(f"  [PASS] Rejected: {path}")

def test_atomic_transaction_simulation():
    print("\nTesting Atomic Transaction & Rollback Simulation...")
    with tempfile.TemporaryDirectory() as temp_dir:
        workspace_dir = os.path.join(temp_dir, "Workspace")
        backup_dir = os.path.join(temp_dir, "Backups", str(uuid.uuid4()))
        payload_dir = os.path.join(temp_dir, "Payload")
        os.makedirs(workspace_dir, exist_ok=True)
        os.makedirs(backup_dir, exist_ok=True)
        os.makedirs(payload_dir, exist_ok=True)
        
        # 1. Existing file in workspace
        target_file = os.path.join(workspace_dir, "asset.bin")
        original_data = b"ORIGINAL_DATA_V1"
        with open(target_file, "wb") as f:
            f.write(original_data)
        original_sha = calculate_sha256(original_data)
        
        # 2. Payload file
        payload_file = os.path.join(payload_dir, "asset.bin")
        new_data = b"NEW_PATCH_DATA_V2"
        with open(payload_file, "wb") as f:
            f.write(new_data)
        new_sha = calculate_sha256(new_data)
        
        # 3. Step: Backup
        backup_file = os.path.join(backup_dir, "asset.bin")
        shutil.copy2(target_file, backup_file)
        assert os.path.exists(backup_file)
        print("  [PASS] Backup created successfully.")
        
        # 4. Step: Apply
        shutil.copy2(payload_file, target_file)
        with open(target_file, "rb") as f:
            applied_sha = calculate_sha256(f.read())
        assert applied_sha == new_sha
        print("  [PASS] Patch applied, SHA matches.")
        
        # 5. Step: Rollback
        shutil.copy2(backup_file, target_file)
        with open(target_file, "rb") as f:
            restored_sha = calculate_sha256(f.read())
        assert restored_sha == original_sha
        print("  [PASS] Rollback restores original data perfectly.")

def test_package_codec_envelope():
    print("\nTesting Package Codec Envelope...")
    magic = b"3105PATCH\x00"
    payload = {
        "schema": 1,
        "identifier": "TEST-UUID",
        "metadata": {
            "name": "AimBody Patch",
            "version": "1.0.0",
            "targetIdentifier": "com.example.test",
            "payloadSHA256": "abcdef1234567890" * 4
        },
        "files": [
            {"relativePath": "cache.bin", "sha256": "abcdef1234567890" * 4, "size": 1024}
        ]
    }
    plist_bytes = plistlib.dumps(payload, fmt=plistlib.FMT_BINARY)
    packet = magic + plist_bytes
    
    # Verify magic
    assert packet.startswith(magic)
    decoded = plistlib.loads(packet[len(magic):])
    assert decoded["identifier"] == "TEST-UUID"
    assert decoded["metadata"]["name"] == "AimBody Patch"
    print("  [PASS] Package Codec Envelope encodes and decodes properly.")

if __name__ == "__main__":
    test_security_path_resolver()
    test_atomic_transaction_simulation()
    test_package_codec_envelope()
    print("\nALL LOGICAL TESTS PASSED SUCCESSFULLY! (3/3)")
