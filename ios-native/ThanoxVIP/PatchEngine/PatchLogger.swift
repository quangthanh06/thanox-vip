//
//  PatchLogger.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class PatchLogger {
    public static let shared = PatchLogger()

    private let logQueue = DispatchQueue(label: "com.thanox.patchlogger", qos: .utility)
    private var inMemoryLogs: [String] = []

    public init() {}

    public func log(
        transactionID: UUID,
        stage: String,
        targetIdentifier: String,
        filename: String? = nil,
        sha256: String? = nil,
        duration: TimeInterval? = nil,
        result: String
    ) {
        let timestamp = ISO8601DateFormatter().string(from: Date())
        var logMessage = "[\(timestamp)] [PatchEngine] [Tx: \(transactionID.uuidString.prefix(8))] [Stage: \(stage)] [Target: \(targetIdentifier)]"

        if let file = filename {
            logMessage += " [File: \(file)]"
        }
        if let hash = sha256 {
            logMessage += " [SHA: \(hash.prefix(12))...]"
        }
        if let dur = duration {
            logMessage += String(format: " [Duration: %.2fms]", dur * 1000)
        }
        logMessage += " [Result: \(result)]"

        logQueue.async {
            print(logMessage)
            self.inMemoryLogs.append(logMessage)
            if self.inMemoryLogs.count > 200 {
                self.inMemoryLogs.removeFirst(50)
            }
        }
    }

    public func getRecentLogs() -> [String] {
        logQueue.sync {
            return inMemoryLogs
        }
    }
}
