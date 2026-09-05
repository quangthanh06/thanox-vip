//
//  PatchBackupManager.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public struct BackupRecord: Codable, Equatable {
    public let originalPath: String
    public let backupPath: String
    public let originalSHA256: String?
    public let wasNewlyCreated: Bool

    public init(
        originalPath: String,
        backupPath: String,
        originalSHA256: String?,
        wasNewlyCreated: Bool
    ) {
        self.originalPath = originalPath
        self.backupPath = backupPath
        self.originalSHA256 = originalSHA256
        self.wasNewlyCreated = wasNewlyCreated
    }
}

public final class PatchBackupManager {
    public let backupsBaseURL: URL
    private let fileManager = FileManager.default

    public init(backupsBaseURL: URL) {
        self.backupsBaseURL = backupsBaseURL
    }

    /// Trả về thư mục sao lưu riêng cho transaction ID
    public func backupDirectoryURL(for transactionID: UUID) throws -> URL {
        let url = backupsBaseURL.appendingPathComponent(transactionID.uuidString, isDirectory: true)
        if !fileManager.fileExists(atPath: url.path) {
            try fileManager.createDirectory(at: url, withIntermediateDirectories: true, attributes: nil)
        }
        return url
    }

    /// Sao lưu một tệp trước khi áp dụng bản vá
    public func backupFile(
        at sourceFileURL: URL,
        relativePath: String,
        transactionID: UUID,
        fileProvider: PatchFileProvider
    ) throws -> BackupRecord {
        let backupDir = try backupDirectoryURL(for: transactionID)
        let backupFileURL = backupDir.appendingPathComponent(relativePath)
        let backupParent = backupFileURL.deletingLastPathComponent()

        if !fileManager.fileExists(atPath: backupParent.path) {
            try fileManager.createDirectory(at: backupParent, withIntermediateDirectories: true, attributes: nil)
        }

        if fileProvider.exists(sourceFileURL) {
            let originalSHA = try PatchPackageValidator.calculateSHA256(of: sourceFileURL)
            if fileManager.fileExists(atPath: backupFileURL.path) {
                try fileManager.removeItem(at: backupFileURL)
            }
            try fileManager.copyItem(at: sourceFileURL, to: backupFileURL)

            return BackupRecord(
                originalPath: relativePath,
                backupPath: backupFileURL.path,
                originalSHA256: originalSHA,
                wasNewlyCreated: false
            )
        } else {
            // Tệp chưa từng tồn tại ở destination
            return BackupRecord(
                originalPath: relativePath,
                backupPath: backupFileURL.path,
                originalSHA256: nil,
                wasNewlyCreated: true
            )
        }
    }
}
