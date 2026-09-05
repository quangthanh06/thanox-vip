//
//  PatchTransaction.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public enum PatchTransactionState: String, Codable {
    case preparing
    case backingUp
    case applying
    case verifying
    case committed
    case rollingBack
    case rolledBack
    case failed
}

public struct PatchTransaction: Codable, Identifiable {
    public let id: UUID
    public let createdAt: Date
    public var updatedAt: Date
    public let targetIdentifier: String
    public let packageID: String
    public var state: PatchTransactionState
    public var backupPath: String?
    public var errorDescription: String?

    public init(
        id: UUID = UUID(),
        createdAt: Date = Date(),
        targetIdentifier: String,
        packageID: String,
        state: PatchTransactionState = .preparing,
        backupPath: String? = nil,
        errorDescription: String? = nil
    ) {
        self.id = id
        self.createdAt = createdAt
        self.updatedAt = createdAt
        self.targetIdentifier = targetIdentifier
        self.packageID = packageID
        self.state = state
        self.backupPath = backupPath
        self.errorDescription = errorDescription
    }
}
