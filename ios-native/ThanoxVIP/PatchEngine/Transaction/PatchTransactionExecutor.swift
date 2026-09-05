//
//  PatchTransactionExecutor.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public typealias PatchProgressHandler = (PatchTransactionState, String) -> Void

public final class PatchTransactionExecutor {
    private let backupManager: PatchBackupManager
    private let rollbackManager: PatchRollbackManager
    private let secureResolver: SecurePathResolver
    private let fileManager = FileManager.default

    public init(
        backupsBaseURL: URL,
        rollbackManager: PatchRollbackManager = PatchRollbackManager(),
        secureResolver: SecurePathResolver = .shared
    ) {
        self.backupManager = PatchBackupManager(backupsBaseURL: backupsBaseURL)
        self.rollbackManager = rollbackManager
        self.secureResolver = secureResolver
    }

    /// Thực hiện giao dịch bản vá với quy trình 6 bước nguyên tử
    public func execute(
        package: PatchPackage,
        target: PatchTarget,
        fileProvider: PatchFileProvider,
        journalsDirectoryURL: URL,
        progress: PatchProgressHandler? = nil
    ) async throws -> PatchTransactionResult {
        let startTime = Date()
        let transactionID = UUID()

        let journalFileURL = journalsDirectoryURL.appendingPathComponent("\(transactionID.uuidString).journal")
        let backupDirURL = try backupManager.backupDirectoryURL(for: transactionID)

        var manifest = PatchJournalManifest(
            transactionID: transactionID,
            targetIdentifier: target.targetIdentifier,
            packageID: package.identifier,
            state: .preparing,
            backupDirectoryPath: backupDirURL.path
        )

        // 1. PRECHECK
        progress?(.preparing, "Đang kiểm tra gói và cấu hình mục tiêu...")
        try PatchPackageValidator.validate(package: package)
        try manifest.writeAtomically(to: journalFileURL)

        var completedEntries: [PatchJournalEntry] = []
        var lastChecksum = ""

        do {
            // 2. BACKING UP
            progress?(.backingUp, "Đang sao lưu các tệp hiện có...")
            manifest.state = .backingUp
            try manifest.writeAtomically(to: journalFileURL)

            var backupRecords: [BackupRecord] = []

            for file in package.files {
                let destRelativePath = (target.relativeDirectory as NSString).appendingPathComponent(file.relativePath)
                let destinationFileURL = try secureResolver.resolve(root: fileProvider.rootURL, relativePath: destRelativePath)

                let record = try backupManager.backupFile(
                    at: destinationFileURL,
                    relativePath: destRelativePath,
                    transactionID: transactionID,
                    fileProvider: fileProvider
                )
                backupRecords.append(record)
            }

            // 3. APPLYING
            progress?(.applying, "Đang áp dụng các tệp bản vá...")
            manifest.state = .applying
            try manifest.writeAtomically(to: journalFileURL)

            for (index, file) in package.files.enumerated() {
                let sourceFileURL = package.payloadURL.appendingPathComponent(file.relativePath)
                guard fileManager.fileExists(atPath: sourceFileURL.path) else {
                    throw PatchEngineError.fileNotFound("Không tìm thấy tệp nguồn: \(sourceFileURL.path)")
                }

                // Kiểm tra SHA-256 nguồn
                let sourceSHA = try PatchPackageValidator.calculateSHA256(of: sourceFileURL)
                guard sourceSHA.lowercased() == file.sha256.lowercased() else {
                    throw PatchEngineError.checksumMismatch(expected: file.sha256, actual: sourceSHA)
                }

                let destRelativePath = (target.relativeDirectory as NSString).appendingPathComponent(file.relativePath)
                let destinationFileURL = try secureResolver.resolve(root: fileProvider.rootURL, relativePath: destRelativePath)

                // Sao chép tệp mới vào đích
                try fileProvider.copy(from: sourceFileURL, to: destinationFileURL)

                // 4. VERIFYING
                progress?(.verifying, "Đang kiểm tra tính toàn vẹn (SHA-256)...")
                let verifiedSHA = try PatchPackageValidator.calculateSHA256(of: destinationFileURL)
                guard verifiedSHA.lowercased() == file.sha256.lowercased() else {
                    throw PatchEngineError.verificationFailed("Mã SHA-256 tệp đích không khớp sau khi ghi: \(verifiedSHA)")
                }

                lastChecksum = verifiedSHA
                let backupRecord = backupRecords[index]

                let entry = PatchJournalEntry(
                    transactionID: transactionID,
                    targetIdentifier: target.targetIdentifier,
                    destinationRelativePath: destRelativePath,
                    originalSHA256: backupRecord.originalSHA256,
                    patchedSHA256: verifiedSHA,
                    backupPath: backupRecord.backupPath,
                    state: "applied",
                    wasNewlyCreated: backupRecord.wasNewlyCreated
                )
                completedEntries.append(entry)
            }

            // 5. COMMIT
            manifest.state = .committed
            manifest.entries = completedEntries
            manifest.updatedAt = Date()
            try manifest.writeAtomically(to: journalFileURL)

            progress?(.committed, "Áp dụng bản vá hoàn tất thành công!")

            let duration = Date().timeIntervalSince(startTime)
            return PatchTransactionResult(
                transactionID: transactionID,
                isSuccess: true,
                targetIdentifier: target.targetIdentifier,
                executionDuration: duration,
                finalChecksum: lastChecksum,
                backupPath: backupDirURL.path,
                message: "Bản vá đã được áp dụng thành công cho \(target.displayName)"
            )

        } catch {
            // ROLLBACK KHI THẤT BẠI
            progress?(.rollingBack, "Gặp lỗi, đang tiến hành hoàn tác (Rollback)...")
            manifest.state = .rollingBack
            manifest.errorDescription = error.localizedDescription
            manifest.entries = completedEntries
            try? manifest.writeAtomically(to: journalFileURL)

            do {
                try rollbackManager.rollback(
                    entries: completedEntries,
                    backupDirectoryURL: backupDirURL,
                    targetRootURL: fileProvider.rootURL,
                    fileProvider: fileProvider
                )
                manifest.state = .rolledBack
                progress?(.rolledBack, "Đã hoàn tác toàn bộ thay đổi thành công.")
            } catch let rollbackErr {
                manifest.state = .failed
                manifest.errorDescription = "Rollback thất bại: \(rollbackErr.localizedDescription)"
                progress?(.failed, "Lỗi nghiêm trọng trong quá trình hoàn tác: \(rollbackErr.localizedDescription)")
            }

            manifest.updatedAt = Date()
            try? manifest.writeAtomically(to: journalFileURL)

            let duration = Date().timeIntervalSince(startTime)
            return PatchTransactionResult(
                transactionID: transactionID,
                isSuccess: false,
                targetIdentifier: target.targetIdentifier,
                executionDuration: duration,
                finalChecksum: lastChecksum,
                backupPath: backupDirURL.path,
                message: "Thao tác thất bại: \(error.localizedDescription)",
                errorDescription: error.localizedDescription
            )
        }
    }
}
