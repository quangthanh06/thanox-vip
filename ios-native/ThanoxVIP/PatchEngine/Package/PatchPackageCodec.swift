//
//  PatchPackageCodec.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public enum PatchPackageCodec {
    public static let magicHeader = Data("3105PATCH\0".utf8)
    public static let schemaVersion = 1

    private struct PackageEnvelope: Codable {
        let schema: Int
        let identifier: String
        let metadata: PatchMetadata
        let files: [PatchFile]
    }

    /// Đóng gói PatchPackage thành Data nhị phân có magic header
    public static func encode(package: PatchPackage) throws -> Data {
        let envelope = PackageEnvelope(
            schema: schemaVersion,
            identifier: package.identifier,
            metadata: package.metadata,
            files: package.files
        )

        let encoder = PropertyListEncoder()
        encoder.outputFormat = .binary
        let body = try encoder.encode(envelope)

        var result = magicHeader
        result.append(body)
        return result
    }

    /// Giải mã Data thành PatchPackage kèm thư mục payloadURL
    public static func decode(data: Data, payloadURL: URL) throws -> PatchPackage {
        // Kiểm tra magic header
        if data.count >= magicHeader.count && data.prefix(magicHeader.count) == magicHeader {
            let bodyData = data.suffix(from: magicHeader.count)
            let decoder = PropertyListDecoder()
            let envelope = try decoder.decode(PackageEnvelope.self, from: bodyData)

            return PatchPackage(
                identifier: envelope.identifier,
                version: envelope.metadata.version,
                metadata: envelope.metadata,
                payloadURL: payloadURL,
                files: envelope.files
            )
        }

        // Fallback: Thử giải mã định dạng JSON Manifest
        let jsonDecoder = JSONDecoder()
        jsonDecoder.dateDecodingStrategy = .iso8601
        if let jsonPackage = try? jsonDecoder.decode(PatchPackage.self, from: data) {
            return jsonPackage
        }

        throw PatchEngineError.invalidPackage("Header tệp không khớp chuẩn '3105PATCH\\0' hoặc cấu trúc JSON không hợp lệ")
    }
}
