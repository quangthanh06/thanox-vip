//
//  PatchJournalRecoveryManager.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class PatchJournalRecoveryManager {
    public let journalsDirectoryURL: URL
    private let fileManager = FileManager.default
    private let rollbackManager = PatchRollbackManager()

    public init(journalsDirectoryURL: URL) {
        self.journalsDirectoryURL = journalsDirectoryURL
    }

    /// Quét các transaction dở dang (chưa committed hoặc chưa rolledBack sạch sẽ)
    public func scanIncompleteTransactions() -> [PatchJournalManifest] {
        guard let files = try? fileManager.contentsOfDirectory(at: journalsDirectoryURL, includingPropertiesForKeys: nil) else {
            return []
        }

        var incomplete: [PatchJournalManifest] = []

        for fileURL in files where fileURL.pathExtension == "journal" {
            if let manifest = try? PatchJournalManifest.load(from: fileURL) {
                switch manifest.state {
                case .preparing, .backingUp, .applying, .verifying, .rollingBack:
                    incomplete.append(manifest)
                case .committed, .rolledBack, .restored, .failed:
                    break
                }
            }
        }
        return incomplete
    }

    /// Khôi phục một transaction bị dở dang (Crash Recovery)
    public func recover(manifest: PatchJournalManifest, fileProvider: PatchFileProvider) throws {
        let backupDirURL = URL(fileURLWithPath: manifest.backupDirectoryPath)
        let journalURL = journalsDirectoryURL.appendingPathComponent("\(manifest.transactionID.uuidString).journal")

        var updated = manifest
        updated.state = .rollingBack
        try? updated.writeAtomically(to: journalURL)

        do {
            try rollbackManager.rollback(
                entries: manifest.entries,
                backupDirectoryURL: backupDirURL,
                targetRootURL: fileProvider.rootURL,
                fileProvider: fileProvider
            )
            updated.state = .rolledBack
            updated.updatedAt = Date()
            try updated.writeAtomically(to: journalURL)
        } catch {
            updated.state = .failed
            updated.errorDescription = "Khôi phục sau sự cố thất bại: \(error.localizedDescription)"
            updated.updatedAt = Date()
            try? updated.writeAtomically(to: journalURL)
            throw error
        }
    }
}
