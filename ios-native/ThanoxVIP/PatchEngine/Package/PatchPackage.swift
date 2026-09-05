//
//  PatchPackage.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public struct PatchPackage: Codable, Hashable, Identifiable {
    public var id: UUID { metadata.id }
    public let identifier: String
    public let version: String
    public let metadata: PatchMetadata
    public let payloadURL: URL
    public let files: [PatchFile]

    public init(
        identifier: String,
        version: String,
        metadata: PatchMetadata,
        payloadURL: URL,
        files: [PatchFile]
    ) {
        self.identifier = identifier
        self.version = version
        self.metadata = metadata
        self.payloadURL = payloadURL
        self.files = files
    }
}
