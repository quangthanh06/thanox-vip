//
//  PatchRollbackManager.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class PatchRollbackManager {
    public init() {}

    /// Thực hiện hoàn tác (Rollback) toàn diện dựa trên danh sách entries và backup
    public func rollback(
        entries: [PatchJournalEntry],
        backupDirectoryURL: URL,
        targetRootURL: URL,
        fileProvider: PatchFileProvider
    ) throws {
        var rollbackErrors: [Error] = []

        for entry in entries.reversed() {
            let targetFileURL = targetRootURL.appendingPathComponent(entry.destinationRelativePath)

            if entry.wasNewlyCreated {
                // 1. Xóa tệp do transaction tạo mới
                do {
                    if fileProvider.exists(targetFileURL) {
                        try fileProvider.remove(targetFileURL)
                    }
                } catch {
                    rollbackErrors.append(error)
                }
            } else if let backupRelPath = entry.backupPath {
                // 2. Phục hồi tệp cũ từ bản sao lưu
                let backupFileURL = URL(fileURLWithPath: backupRelPath)
                do {
                    guard fileProvider.exists(backupFileURL) else {
                        throw PatchEngineError.backupFailed("Không tìm thấy tệp backup để rollback: \(backupFileURL.path)")
                    }
                    try fileProvider.copy(from: backupFileURL, to: targetFileURL)

                    // Đối soát lại SHA-256 sau khi phục hồi
                    if let originalSHA = entry.originalSHA256 {
                        let restoredSHA = try PatchPackageValidator.calculateSHA256(of: targetFileURL)
                        if restoredSHA.lowercased() != originalSHA.lowercased() {
                            throw PatchEngineError.checksumMismatch(expected: originalSHA, actual: restoredSHA)
                        }
                    }
                } catch {
                    rollbackErrors.append(error)
                }
            }
        }

        if let firstError = rollbackErrors.first {
            throw PatchEngineError.rollbackFailed("Hoàn tác gặp lỗi: \(firstError.localizedDescription)")
        }
    }
}
