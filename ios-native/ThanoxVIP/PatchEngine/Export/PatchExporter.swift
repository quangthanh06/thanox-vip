//
//  PatchExporter.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class PatchExporter {
    public init() {}

    /// Xuất gói bản vá thành tệp nhị phân .3105 giữ nguyên metadata và checksum
    public func exportPackage(package: PatchPackage, to destinationURL: URL) throws {
        let data = try PatchPackageCodec.encode(package: package)
        let parentDir = destinationURL.deletingLastPathComponent()
        if !FileManager.default.fileExists(atPath: parentDir.path) {
            try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true, attributes: nil)
        }
        try data.write(to: destinationURL, options: .atomic)
    }

    /// Xuất thư mục thành tệp ZIP lưu trữ thông qua NSFileCoordinator chuẩn của Apple
    public func exportZIP(from sourceDirectoryURL: URL, to destinationZipURL: URL) throws {
        guard FileManager.default.fileExists(atPath: sourceDirectoryURL.path) else {
            throw PatchEngineError.fileNotFound(sourceDirectoryURL.path)
        }

        var coordinateError: NSError?
        var isSuccess = false

        let coordinator = NSFileCoordinator()
        coordinator.coordinate(
            readingItemAt: sourceDirectoryURL,
            options: .forUploading,
            error: &coordinateError
        ) { tempZipURL in
            do {
                if FileManager.default.fileExists(atPath: destinationZipURL.path) {
                    try FileManager.default.removeItem(at: destinationZipURL)
                }
                let parent = destinationZipURL.deletingLastPathComponent()
                if !FileManager.default.fileExists(atPath: parent.path) {
                    try FileManager.default.createDirectory(at: parent, withIntermediateDirectories: true, attributes: nil)
                }
                try FileManager.default.copyItem(at: tempZipURL, to: destinationZipURL)
                isSuccess = true
            } catch {
                isSuccess = false
            }
        }

        if let err = coordinateError {
            throw PatchEngineError.writeFailed("Lỗi tạo tệp ZIP: \(err.localizedDescription)")
        }
        guard isSuccess else {
            throw PatchEngineError.writeFailed("Không thể xuất tệp ZIP từ thư mục nguồn")
        }
    }
}
