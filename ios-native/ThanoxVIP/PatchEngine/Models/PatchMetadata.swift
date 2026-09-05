//
//  PatchMetadata.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public struct PatchMetadata: Codable, Hashable {
    public let id: UUID
    public let name: String
    public let version: String
    public let targetIdentifier: String
    public let createdAt: Date
    public let payloadSHA256: String

    public init(
        id: UUID = UUID(),
        name: String,
        version: String,
        targetIdentifier: String,
        createdAt: Date = Date(),
        payloadSHA256: String
    ) {
        self.id = id
        self.name = name
        self.version = version
        self.targetIdentifier = targetIdentifier
        self.createdAt = createdAt
        self.payloadSHA256 = payloadSHA256
    }
}
