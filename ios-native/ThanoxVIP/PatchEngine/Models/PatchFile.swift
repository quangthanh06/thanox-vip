//
//  PatchFile.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public struct PatchFile: Codable, Hashable {
    public let relativePath: String
    public let sha256: String
    public let size: Int64

    public init(relativePath: String, sha256: String, size: Int64 = 0) {
        self.relativePath = relativePath
        self.sha256 = sha256
        self.size = size
    }
}
