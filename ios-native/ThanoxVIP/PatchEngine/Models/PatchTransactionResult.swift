//
//  PatchTransactionResult.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public struct PatchTransactionResult: Codable {
    public let transactionID: UUID
    public let isSuccess: Bool
    public let targetIdentifier: String
    public let executionDuration: TimeInterval
    public let finalChecksum: String
    public let backupPath: String?
    public let message: String
    public let errorDescription: String?

    public init(
        transactionID: UUID,
        isSuccess: Bool,
        targetIdentifier: String,
        executionDuration: TimeInterval,
        finalChecksum: String,
        backupPath: String? = nil,
        message: String,
        errorDescription: String? = nil
    ) {
        self.transactionID = transactionID
        self.isSuccess = isSuccess
        self.targetIdentifier = targetIdentifier
        self.executionDuration = executionDuration
        self.finalChecksum = finalChecksum
        self.backupPath = backupPath
        self.message = message
        self.errorDescription = errorDescription
    }
}
