//
//  PatchPackageValidator.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation
import CryptoKit

public enum PatchPackageValidator {
    /// Xác thực tính hợp lệ của metadata và danh sách tệp
    public static func validate(package: PatchPackage) throws {
        // 1. Kiểm tra Metadata
        let meta = package.metadata
        guard !meta.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw PatchEngineError.invalidPackage("Tên gói (name) không được để trống")
        }
        guard !meta.version.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw PatchEngineError.invalidPackage("Phiên bản (version) không được để trống")
        }
        guard !meta.targetIdentifier.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw PatchEngineError.invalidPackage("Target Identifier không được để trống")
        }

        // 2. Kiểm tra danh sách files
        guard !package.files.isEmpty else {
            throw PatchEngineError.invalidPackage("Danh sách tệp trong gói không được để trống")
        }

        var pathSet = Set<String>()

        for file in package.files {
            let relPath = file.relativePath.trimmingCharacters(in: .whitespacesAndNewlines)

            // Kiểm tra Path Traversal
            if relPath.contains("..") || relPath.hasPrefix("/") || relPath.hasPrefix("file://") {
                throw PatchEngineError.invalidPath("Phát hiện ký tự đường dẫn không hợp lệ hoặc traversal: \(relPath)")
            }

            // Kiểm tra trùng lặp
            let standardized = (relPath as NSString).standardizingPath
            if pathSet.contains(standardized) {
                throw PatchEngineError.invalidPackage("Tệp bị trùng lặp trong gói: \(relPath)")
            }
            pathSet.insert(standardized)

            // Kiểm tra độ dài mã SHA-256
            guard file.sha256.count == 64 else {
                throw PatchEngineError.invalidPackage("Mã SHA-256 không đúng định dạng (64 hex characters): \(file.sha256)")
            }
        }
    }

    /// Xác thực tính toàn vẹn của tệp thực tế trên đĩa so với mã băm kỳ vọng
    public static func verifyFilePayload(at fileURL: URL, expectedSHA256: String) throws {
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            throw PatchEngineError.fileNotFound(fileURL.path)
        }

        let actualSHA256 = try calculateSHA256(of: fileURL)
        guard actualSHA256.lowercased() == expectedSHA256.lowercased() else {
            throw PatchEngineError.checksumMismatch(expected: expectedSHA256, actual: actualSHA256)
        }
    }

    /// Tính mã băm SHA-256 bằng CryptoKit
    public static func calculateSHA256(of fileURL: URL) throws -> String {
        let fileHandle = try FileHandle(forReadingFrom: fileURL)
        defer { try? fileHandle.close() }

        var hasher = SHA256()
        let bufferSize = 64 * 1024

        while autoreleasepool(invoking: {
            let data = fileHandle.readData(ofLength: bufferSize)
            guard !data.isEmpty else { return false }
            hasher.update(data: data)
            return true
        }) {}

        let digest = hasher.finalize()
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
