//
//  MockPatchFileProvider.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class MockPatchFileProvider: PatchFileProvider {
    public let rootURL: URL
    private let fileManager = FileManager.default

    public init(customRoot: URL? = nil) {
        if let custom = customRoot {
            self.rootURL = custom
        } else {
            let tempDir = URL(fileURLWithPath: NSTemporaryDirectory())
                .appendingPathComponent("PatchEngineMock_\(UUID().uuidString)")
            self.rootURL = tempDir
        }
        try? fileManager.createDirectory(at: rootURL, withIntermediateDirectories: true, attributes: nil)
    }

    deinit {
        try? fileManager.removeItem(at: rootURL)
    }

    public func exists(_ url: URL) -> Bool {
        return fileManager.fileExists(atPath: url.path)
    }

    public func copy(from source: URL, to destination: URL) throws {
        guard fileManager.fileExists(atPath: source.path) else {
            throw PatchEngineError.fileNotFound(source.path)
        }
        let parent = destination.deletingLastPathComponent()
        if !fileManager.fileExists(atPath: parent.path) {
            try fileManager.createDirectory(at: parent, withIntermediateDirectories: true, attributes: nil)
        }
        if fileManager.fileExists(atPath: destination.path) {
            try fileManager.removeItem(at: destination)
        }
        try fileManager.copyItem(at: source, to: destination)
    }

    public func remove(_ url: URL) throws {
        if fileManager.fileExists(atPath: url.path) {
            try fileManager.removeItem(at: url)
        }
    }

    public func createDirectory(at url: URL) throws {
        if !fileManager.fileExists(atPath: url.path) {
            try fileManager.createDirectory(at: url, withIntermediateDirectories: true, attributes: nil)
        }
    }

    public func read(_ url: URL) throws -> Data {
        guard fileManager.fileExists(atPath: url.path) else {
            throw PatchEngineError.fileNotFound(url.path)
        }
        return try Data(contentsOf: url)
    }

    public func write(_ data: Data, to url: URL) throws {
        let parent = url.deletingLastPathComponent()
        if !fileManager.fileExists(atPath: parent.path) {
            try fileManager.createDirectory(at: parent, withIntermediateDirectories: true, attributes: nil)
        }
        try data.write(to: url, options: .atomic)
    }
}
