//
//  PatchPackageImporter.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class PatchPackageImporter {
    public let packagesDirectoryURL: URL
    private let fileManager = FileManager.default

    public init(packagesDirectoryURL: URL) {
        self.packagesDirectoryURL = packagesDirectoryURL
    }

    /// Import một gói bản vá từ URL bên ngoài (hỗ trợ security-scoped URL từ Document Picker)
    public func importPackage(from sourceURL: URL) async throws -> PatchPackage {
        let isSecurityScoped = sourceURL.startAccessingSecurityScopedResource()
        defer {
            if isSecurityScoped {
                sourceURL.stopAccessingSecurityScopedResource()
            }
        }

        guard fileManager.fileExists(atPath: sourceURL.path) else {
            throw PatchEngineError.fileNotFound(sourceURL.path)
        }

        // Tạo thư mục đích riêng biệt theo UUID bên trong Packages/
        let packageID = UUID()
        let destinationDirURL = packagesDirectoryURL.appendingPathComponent(packageID.uuidString, isDirectory: true)
        let destinationFileURL = destinationDirURL.appendingPathComponent(sourceURL.lastPathComponent)

        try fileManager.createDirectory(at: destinationDirURL, withIntermediateDirectories: true, attributes: nil)

        // Sao chép an toàn vào sandbox
        if fileManager.fileExists(atPath: destinationFileURL.path) {
            try fileManager.removeItem(at: destinationFileURL)
        }
        try fileManager.copyItem(at: sourceURL, to: destinationFileURL)

        // Đọc dữ liệu và giải mã
        let packageData = try Data(contentsOf: destinationFileURL)
        let decodedPackage = try PatchPackageCodec.decode(data: packageData, payloadURL: destinationDirURL)

        // Xác thực tính toàn vẹn và quy chuẩn an toàn
        try PatchPackageValidator.validate(package: decodedPackage)

        return decodedPackage
    }
}
