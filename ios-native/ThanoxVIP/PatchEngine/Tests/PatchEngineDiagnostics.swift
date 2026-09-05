//
//  PatchEngineDiagnostics.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework Diagnostics and Self-Test.
//

import Foundation

public final class PatchEngineDiagnostics {
    public struct TestReport {
        public let totalPassed: Int
        public let totalFailed: Int
        public let logs: [String]
        public var isSuccess: Bool { totalFailed == 0 }
    }

    /// Chạy toàn bộ các kịch bản kiểm thử trực tiếp trên thiết bị (Self-Test)
    public static func runSelfTest() async -> TestReport {
        var passed = 0
        var failed = 0
        var logs: [String] = []

        func record(name: String, success: Bool, detail: String = "") {
            if success {
                passed += 1
                logs.append("  [PASS] \(name) \(detail)")
            } else {
                failed += 1
                logs.append("  [FAIL] \(name) \(detail)")
            }
        }

        logs.append("⚡ BẮT ĐẦU CHẠY PATCH ENGINE SELF-TEST (100% NATIVE)")

        // 1. Kiểm tra SecurePathResolver
        let tempRoot = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("DiagTest_\(UUID().uuidString)")
        try? FileManager.default.createDirectory(at: tempRoot, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: tempRoot) }

        let resolver = SecurePathResolver.shared

        do {
            _ = try resolver.resolve(root: tempRoot, relativePath: "../escape.txt")
            record(name: "Path Traversal (../) Rejection", success: false, detail: "Không chặn được ../")
        } catch {
            record(name: "Path Traversal (../) Rejection", success: true)
        }

        do {
            _ = try resolver.resolve(root: tempRoot, relativePath: "/var/mobile/private")
            record(name: "Absolute Path Rejection", success: false, detail: "Không chặn được /absolute")
        } catch {
            record(name: "Absolute Path Rejection", success: true)
        }

        do {
            let valid = try resolver.resolve(root: tempRoot, relativePath: "safe/config.json")
            let isInside = valid.path.hasPrefix(tempRoot.path)
            record(name: "Valid Path Resolution", success: isInside)
        } catch {
            record(name: "Valid Path Resolution", success: false, detail: error.localizedDescription)
        }

        // 2. Kiểm tra Package Codec
        do {
            let sampleFile = tempRoot.appendingPathComponent("test.bin")
            let sampleData = "SAMPLE_DIAG_DATA".data(using: .utf8)!
            try sampleData.write(to: sampleFile)

            let sha = try PatchPackageValidator.calculateSHA256(of: sampleFile)
            let pkg = PatchPackage(
                identifier: "DIAG-01",
                version: "1.0.0",
                metadata: PatchMetadata(name: "DiagPkg", version: "1.0.0", targetIdentifier: "local-sandbox", payloadSHA256: sha),
                payloadURL: tempRoot,
                files: [PatchFile(relativePath: "test.bin", sha256: sha, size: Int64(sampleData.count))]
            )

            let encoded = try PatchPackageCodec.encode(package: pkg)
            let decoded = try PatchPackageCodec.decode(data: encoded, payloadURL: tempRoot)
            record(name: "Package Codec (Encode/Decode)", success: decoded.identifier == "DIAG-01")
        } catch {
            record(name: "Package Codec (Encode/Decode)", success: false, detail: error.localizedDescription)
        }

        // 3. Kiểm tra Transaction Pipeline & Rollback
        do {
            let mockProvider = MockPatchFileProvider()
            let executor = PatchTransactionExecutor(backupsBaseURL: tempRoot.appendingPathComponent("Backups"))
            let journalsDir = tempRoot.appendingPathComponent("Journals")
            try FileManager.default.createDirectory(at: journalsDir, withIntermediateDirectories: true)

            let sourceFile = tempRoot.appendingPathComponent("source.bin")
            let sourceData = "NEW_PATCH_CONTENT".data(using: .utf8)!
            try sourceData.write(to: sourceFile)

            let sha = try PatchPackageValidator.calculateSHA256(of: sourceFile)
            let pkg = PatchPackage(
                identifier: "TX-TEST",
                version: "1.0.0",
                metadata: PatchMetadata(name: "TxPkg", version: "1.0.0", targetIdentifier: "test-game-a", payloadSHA256: sha),
                payloadURL: tempRoot,
                files: [PatchFile(relativePath: "source.bin", sha256: sha, size: Int64(sourceData.count))]
            )

            let result = try await executor.execute(
                package: pkg,
                target: .testTargetA,
                fileProvider: mockProvider,
                journalsDirectoryURL: journalsDir
            )

            record(name: "Atomic Transaction Execution", success: result.isSuccess)
        } catch {
            record(name: "Atomic Transaction Execution", success: false, detail: error.localizedDescription)
        }

        logs.append("\nKẾT QUẢ: \(passed) PASS / \(failed) FAIL")
        return TestReport(totalPassed: passed, totalFailed: failed, logs: logs)
    }
}
