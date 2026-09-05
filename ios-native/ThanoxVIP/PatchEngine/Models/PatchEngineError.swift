//
//  PatchEngineError.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public enum PatchEngineError: Error, LocalizedError, Equatable {
    case invalidPackage(String)
    case checksumMismatch(expected: String, actual: String)
    case invalidTarget(String)
    case invalidPath(String)
    case destinationOutsideRoot(String)
    case backupFailed(String)
    case writeFailed(String)
    case verificationFailed(String)
    case rollbackFailed(String)
    case unsupportedProvider(String)
    case fileNotFound(String)

    public var errorDescription: String? {
        switch self {
        case .invalidPackage(let reason):
            return "Gói không hợp lệ: \(reason)"
        case .checksumMismatch(let expected, let actual):
            return "Mã băm SHA-256 không khớp (Kỳ vọng: \(expected), Thực tế: \(actual))"
        case .invalidTarget(let target):
            return "Mục tiêu không hợp lệ hoặc thiếu cấu hình: \(target)"
        case .invalidPath(let path):
            return "Đường dẫn không hợp lệ hoặc chứa ký tự traversal: \(path)"
        case .destinationOutsideRoot(let path):
            return "Đường dẫn đích nằm ngoài thư mục root cho phép: \(path)"
        case .backupFailed(let reason):
            return "Sao lưu thất bại: \(reason)"
        case .writeFailed(let reason):
            return "Ghi dữ liệu thất bại: \(reason)"
        case .verificationFailed(let reason):
            return "Xác thực tệp sau khi ghi thất bại: \(reason)"
        case .rollbackFailed(let reason):
            return "Hoàn tác (Rollback) thất bại: \(reason)"
        case .unsupportedProvider(let reason):
            return "Provider unavailable: \(reason)"
        case .fileNotFound(let path):
            return "Không tìm thấy tệp: \(path)"
        }
    }
}
