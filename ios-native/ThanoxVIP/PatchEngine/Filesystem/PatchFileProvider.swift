//
//  PatchFileProvider.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public protocol PatchFileProvider {
    var rootURL: URL { get }
    func exists(_ url: URL) -> Bool
    func copy(from source: URL, to destination: URL) throws
    func remove(_ url: URL) throws
    func createDirectory(at url: URL) throws
    func read(_ url: URL) throws -> Data
    func write(_ data: Data, to url: URL) throws
}
