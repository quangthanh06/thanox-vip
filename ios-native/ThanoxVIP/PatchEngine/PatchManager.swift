//
//  PatchManager.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class PatchManager {
    public static let shared = PatchManager()

    public let baseDirectoryURL: URL
    public let packagesDirectoryURL: URL
    public let workspacesDirectoryURL: URL
    public let backupsDirectoryURL: URL
    public let journalsDirectoryURL: URL

    public let importer: PatchPackageImporter
    public let exporter: PatchExporter
    public let recoveryManager: PatchJournalRecoveryManager
    public let executor: PatchTransactionExecutor
    public let providerFactory: PatchProviderFactory

    public init() {
        let fileManager = FileManager.default
        let docsURL = (try? fileManager.url(
            for: .documentDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )) ?? URL(fileURLWithPath: NSTemporaryDirectory())

        let base = docsURL.appendingPathComponent("PortablePatches", isDirectory: true)
        self.baseDirectoryURL = base

        let pkgDir = base.appendingPathComponent("Packages", isDirectory: true)
        let wsDir = base.appendingPathComponent("Workspaces", isDirectory: true)
        let bkDir = base.appendingPathComponent("Backups", isDirectory: true)
        let jnDir = base.appendingPathComponent("Journals", isDirectory: true)

        self.packagesDirectoryURL = pkgDir
        self.workspacesDirectoryURL = wsDir
        self.backupsDirectoryURL = bkDir
        self.journalsDirectoryURL = jnDir

        [base, pkgDir, wsDir, bkDir, jnDir].forEach { dir in
            if !fileManager.fileExists(atPath: dir.path) {
                try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
            }
        }

        self.importer = PatchPackageImporter(packagesDirectoryURL: pkgDir)
        self.exporter = PatchExporter()
        self.recoveryManager = PatchJournalRecoveryManager(journalsDirectoryURL: jnDir)
        self.executor = PatchTransactionExecutor(backupsBaseURL: bkDir)
        self.providerFactory = PatchProviderFactory.shared
    }

    /// API chính: Thực hiện áp dụng bản vá cho target đã chọn
    public func apply(
        package: PatchPackage,
        target: PatchTarget,
        progress: PatchProgressHandler? = nil
    ) async throws -> PatchTransactionResult {
        let startTime = Date()
        PatchLogger.shared.log(
            transactionID: UUID(),
            stage: "REQUEST_START",
            targetIdentifier: target.targetIdentifier,
            filename: target.filename,
            sha256: package.metadata.payloadSHA256,
            result: "INITIATED"
        )

        // 1. Lấy provider từ Factory
        let provider = try providerFactory.provider(for: target)

        // 2. Chạy giao dịch thông qua executor
        let result = try await executor.execute(
            package: package,
            target: target,
            fileProvider: provider,
            journalsDirectoryURL: journalsDirectoryURL,
            progress: progress
        )

        PatchLogger.shared.log(
            transactionID: result.transactionID,
            stage: "REQUEST_FINISHED",
            targetIdentifier: target.targetIdentifier,
            filename: target.filename,
            sha256: result.finalChecksum,
            duration: Date().timeIntervalSince(startTime),
            result: result.isSuccess ? "SUCCESS" : "FAILED"
        )

        return result
    }

    /// Khôi phục giao dịch từ Journal ID
    public func restore(transactionID: UUID, target: PatchTarget) throws {
        let journalURL = journalsDirectoryURL.appendingPathComponent("\(transactionID.uuidString).journal")
        guard FileManager.default.fileExists(atPath: journalURL.path) else {
            throw PatchEngineError.fileNotFound("Không tìm thấy tệp Journal: \(journalURL.path)")
        }

        var manifest = try PatchJournalManifest.load(from: journalURL)
        let provider = try providerFactory.provider(for: target)
        let backupDir = URL(fileURLWithPath: manifest.backupDirectoryPath)

        let rollbackManager = PatchRollbackManager()
        try rollbackManager.rollback(
            entries: manifest.entries,
            backupDirectoryURL: backupDir,
            targetRootURL: provider.rootURL,
            fileProvider: provider
        )

        manifest.state = .restored
        manifest.updatedAt = Date()
        try manifest.writeAtomically(to: journalURL)
    }

    /// Chạy Self-Test end-to-end trên sandbox thiết bị thật
    public func runDiagnosticsSelfTest() async throws -> Bool {
        let testTarget = PatchTarget.localSandboxTarget
        let mockDir = baseDirectoryURL.appendingPathComponent("DiagnosticsTest_\(UUID().uuidString)")
        let fileManager = FileManager.default

        try fileManager.createDirectory(at: mockDir, withIntermediateDirectories: true, attributes: nil)
        defer { try? fileManager.removeItem(at: mockDir) }

        // Tạo file gốc
        let originalContent = "Original Content Before Patch: \(Date())".data(using: .utf8)!
        let sourceContent = "Patched Content From Package: \(Date())".data(using: .utf8)!

        let originalFileURL = mockDir.appendingPathComponent("original.txt")
        let sourceFileURL = mockDir.appendingPathComponent("payload.txt")

        try originalContent.write(to: originalFileURL)
        try sourceContent.write(to: sourceFileURL)

        let payloadSHA = try PatchPackageValidator.calculateSHA256(of: sourceFileURL)

        let testPackage = PatchPackage(
            identifier: "self-test-pkg",
            version: "1.0.0",
            metadata: PatchMetadata(
                name: "Diagnostics Self-Test Package",
                version: "1.0.0",
                targetIdentifier: testTarget.targetIdentifier,
                payloadSHA256: payloadSHA
            ),
            payloadURL: mockDir,
            files: [
                PatchFile(relativePath: "payload.txt", sha256: payloadSHA, size: Int64(sourceContent.count))
            ]
        )

        let provider = try SandboxPatchFileProvider(rootURL: mockDir)
        let executor = PatchTransactionExecutor(backupsBaseURL: backupsDirectoryURL)

        // Thực thi Apply
        let result = try await executor.execute(
            package: testPackage,
            target: testTarget,
            fileProvider: provider,
            journalsDirectoryURL: journalsDirectoryURL
        )

        guard result.isSuccess else { return false }

        // Khôi phục (Restore)
        let journalURL = journalsDirectoryURL.appendingPathComponent("\(result.transactionID.uuidString).journal")
        let manifest = try PatchJournalManifest.load(from: journalURL)
        let rollback = PatchRollbackManager()
        try rollback.rollback(
            entries: manifest.entries,
            backupDirectoryURL: URL(fileURLWithPath: manifest.backupDirectoryPath),
            targetRootURL: provider.rootURL,
            fileProvider: provider
        )

        return true
    }
}
