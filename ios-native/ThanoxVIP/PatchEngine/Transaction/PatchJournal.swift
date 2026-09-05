//
//  PatchJournal.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public struct PatchJournalEntry: Codable, Equatable {
    public let transactionID: UUID
    public let timestamp: Date
    public let targetIdentifier: String
    public let destinationRelativePath: String
    public let originalSHA256: String?
    public let patchedSHA256: String
    public let backupPath: String?
    public let state: String
    public let wasNewlyCreated: Bool

    public init(
        transactionID: UUID,
        timestamp: Date = Date(),
        targetIdentifier: String,
        destinationRelativePath: String,
        originalSHA256: String?,
        patchedSHA256: String,
        backupPath: String?,
        state: String,
        wasNewlyCreated: Bool
    ) {
        self.transactionID = transactionID
        self.timestamp = timestamp
        self.targetIdentifier = targetIdentifier
        self.destinationRelativePath = destinationRelativePath
        self.originalSHA256 = originalSHA256
        self.patchedSHA256 = patchedSHA256
        self.backupPath = backupPath
        self.state = state
        self.wasNewlyCreated = wasNewlyCreated
    }
}

public struct PatchJournalManifest: Codable {
    public let transactionID: UUID
    public let createdAt: Date
    public var updatedAt: Date
    public let targetIdentifier: String
    public let packageID: String
    public var state: PatchTransactionState
    public var entries: [PatchJournalEntry]
    public var backupDirectoryPath: String
    public var errorDescription: String?

    public init(
        transactionID: UUID,
        createdAt: Date = Date(),
        targetIdentifier: String,
        packageID: String,
        state: PatchTransactionState,
        entries: [PatchJournalEntry] = [],
        backupDirectoryPath: String,
        errorDescription: String? = nil
    ) {
        self.transactionID = transactionID
        self.createdAt = createdAt
        self.updatedAt = createdAt
        self.targetIdentifier = targetIdentifier
        self.packageID = packageID
        self.state = state
        self.entries = entries
        self.backupDirectoryPath = backupDirectoryPath
        self.errorDescription = errorDescription
    }

    /// Ghi nhật ký Journal nguyên tử bằng tệp tạm thời rồi ghi đè (Atomic Write)
    public func writeAtomically(to destinationURL: URL) throws {
        let parentDir = destinationURL.deletingLastPathComponent()
        if !FileManager.default.fileExists(atPath: parentDir.path) {
            try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true, attributes: nil)
        }

        let tempURL = parentDir.appendingPathComponent(".tmp_\(transactionID.uuidString)_\(UUID().uuidString)")
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601

        let data = try encoder.encode(self)
        try data.write(to: tempURL, options: .atomic)

        if FileManager.default.fileExists(atPath: destinationURL.path) {
            _ = try FileManager.default.replaceItemAt(destinationURL, withItemAt: tempURL)
        } else {
            try FileManager.default.moveItem(at: tempURL, to: destinationURL)
        }
    }

    public static func load(from fileURL: URL) throws -> PatchJournalManifest {
        let data = try Data(contentsOf: fileURL)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try decoder.decode(PatchJournalManifest.self, from: data)
    }
}
