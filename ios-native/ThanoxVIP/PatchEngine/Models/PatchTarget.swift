//
//  PatchTarget.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public struct PatchTarget: Codable, Hashable, Identifiable {
    public let id: String
    public let displayName: String
    public let bundleIdentifier: String
    public let relativeDirectory: String
    public let filename: String

    public var targetIdentifier: String { bundleIdentifier }

    public init(
        id: String,
        displayName: String,
        bundleIdentifier: String,
        relativeDirectory: String,
        filename: String
    ) {
        self.id = id
        self.displayName = displayName
        self.bundleIdentifier = bundleIdentifier
        self.relativeDirectory = relativeDirectory
        self.filename = filename
    }

    /// Mục tiêu mẫu cho môi trường thử nghiệm và self-test
    public static let testTargetA = PatchTarget(
        id: "test-game-a",
        displayName: "TestGameA",
        bundleIdentifier: "com.example.testgamea",
        relativeDirectory: "GameData/Assets",
        filename: "config_patch.bin"
    )

    public static let testTargetB = PatchTarget(
        id: "test-game-b",
        displayName: "TestGameB",
        bundleIdentifier: "com.example.testgameb",
        relativeDirectory: "Config/Patches",
        filename: "data_patch.bin"
    )

    public static let localSandboxTarget = PatchTarget(
        id: "local-sandbox",
        displayName: "LocalSandboxTarget",
        bundleIdentifier: "com.thanox.ios.vip",
        relativeDirectory: "LocalWorkspaces",
        filename: "sandbox_test.bin"
    )

    public static let houseArrestTarget = PatchTarget(
        id: "house-arrest",
        displayName: "MobileHouseArrest",
        bundleIdentifier: "com.apple.mobile.MobileHouseArrest",
        relativeDirectory: "Workspaces/MobileHouseArrest",
        filename: "payload.3105"
    )
}
