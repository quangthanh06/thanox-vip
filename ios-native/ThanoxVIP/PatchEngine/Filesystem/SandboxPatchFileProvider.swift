//
//  SandboxPatchFileProvider.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class SandboxPatchFileProvider: PatchFileProvider {
    public let rootURL: URL
    private let pathResolver: SecurePathResolver
    private let fileManager = FileManager.default

    public init(rootURL: URL, pathResolver: SecurePathResolver = .shared) throws {
        self.rootURL = rootURL.resolvingSymlinksInPath().standardizedFileURL
        self.pathResolver = pathResolver

        if !fileManager.fileExists(atPath: self.rootURL.path) {
            try fileManager.createDirectory(at: self.rootURL, withIntermediateDirectories: true, attributes: nil)
        }
    }

    private func validateWithinRoot(_ url: URL) throws -> URL {
        let canonicalRoot = rootURL.resolvingSymlinksInPath().standardizedFileURL
        let canonicalURL = url.resolvingSymlinksInPath().standardizedFileURL

        let rootPath = canonicalRoot.path.hasSuffix("/") ? canonicalRoot.path : canonicalRoot.path + "/"
        let targetPath = canonicalURL.path

        guard targetPath == canonicalRoot.path || targetPath.hasPrefix(rootPath) else {
            throw PatchEngineError.destinationOutsideRoot("Thao tác ngoài root sandbox bị từ chối: \(targetPath)")
        }
        return canonicalURL
    }

    public func exists(_ url: URL) -> Bool {
        do {
            let validated = try validateWithinRoot(url)
            return fileManager.fileExists(atPath: validated.path)
        } catch {
            return false
        }
    }

    public func copy(from source: URL, to destination: URL) throws {
        let validatedDest = try validateWithinRoot(destination)

        guard fileManager.fileExists(atPath: source.path) else {
            throw PatchEngineError.fileNotFound(source.path)
        }

        let parentDir = validatedDest.deletingLastPathComponent()
        if !fileManager.fileExists(atPath: parentDir.path) {
            try fileManager.createDirectory(at: parentDir, withIntermediateDirectories: true, attributes: nil)
        }

        if fileManager.fileExists(atPath: validatedDest.path) {
            try fileManager.removeItem(at: validatedDest)
        }

        try fileManager.copyItem(at: source, to: validatedDest)
    }

    public func remove(_ url: URL) throws {
        let validated = try validateWithinRoot(url)
        if fileManager.fileExists(atPath: validated.path) {
            try fileManager.removeItem(at: validated)
        }
    }

    public func createDirectory(at url: URL) throws {
        let validated = try validateWithinRoot(url)
        if !fileManager.fileExists(atPath: validated.path) {
            try fileManager.createDirectory(at: validated, withIntermediateDirectories: true, attributes: nil)
        }
    }

    public func read(_ url: URL) throws -> Data {
        let validated = try validateWithinRoot(url)
        guard fileManager.fileExists(atPath: validated.path) else {
            throw PatchEngineError.fileNotFound(validated.path)
        }
        return try Data(contentsOf: validated)
    }

    public func write(_ data: Data, to url: URL) throws {
        let validated = try validateWithinRoot(url)
        let parentDir = validated.deletingLastPathComponent()
        if !fileManager.fileExists(atPath: parentDir.path) {
            try fileManager.createDirectory(at: parentDir, withIntermediateDirectories: true, attributes: nil)
        }
        try data.write(to: validated, options: .atomic)
    }
}
