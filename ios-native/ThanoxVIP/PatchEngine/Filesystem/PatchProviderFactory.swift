//
//  PatchProviderFactory.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class PatchProviderFactory {
    public static let shared = PatchProviderFactory()

    private var mockProviderOverride: PatchFileProvider?

    public init() {}

    /// Cho phép inject mock provider phục vụ unit tests
    public func setMockProviderOverride(_ provider: PatchFileProvider?) {
        self.mockProviderOverride = provider
    }

    /// Trả về File Provider phù hợp cho target
    public func provider(for target: PatchTarget) throws -> PatchFileProvider {
        if let mock = mockProviderOverride {
            return mock
        }

        // Kiểm tra xem target có phải là mục tiêu hợp lệ trong sandbox của Thanox không
        let docsURL = try FileManager.default.url(
            for: .documentDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )

        let targetRootURL = docsURL
            .appendingPathComponent("PortablePatches", isDirectory: true)
            .appendingPathComponent("Workspaces", isDirectory: true)
            .appendingPathComponent(target.id, isDirectory: true)

        // Nếu target thuộc phạm vi sandbox cho phép:
        if target.id.hasPrefix("local-") || target.id.hasPrefix("test-") || target.id.hasPrefix("house-arrest") || target.bundleIdentifier == "com.thanox.ios.vip" || target.bundleIdentifier == "com.apple.mobile.MobileHouseArrest" {
            return try SandboxPatchFileProvider(rootURL: targetRootURL)
        }

        // Đối với bất kỳ target nào ngoài sandbox mà không có quyền phân quyền hệ thống:
        throw PatchEngineError.unsupportedProvider(
            "Target '\(target.displayName)' (\(target.bundleIdentifier)) không có quyền truy cập filesystem trực tiếp trên thiết bị này."
        )
    }
}
