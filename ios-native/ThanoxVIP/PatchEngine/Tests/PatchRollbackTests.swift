//
//  PatchRollbackTests.swift
//  ThanoxVIPTests
//
//  Created for PatchEngine Framework Tests.
//

import XCTest
@testable import ThanoxVIP

final class PatchRollbackTests: XCTestCase {
    var tempDirectoryURL: URL!
    var mockProvider: MockPatchFileProvider!
    var rollbackManager: PatchRollbackManager!

    override func setUp() {
        super.setUp()
        tempDirectoryURL = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("PatchRollbackTests_\(UUID().uuidString)")
        try? FileManager.default.createDirectory(at: tempDirectoryURL, withIntermediateDirectories: true)

        mockProvider = MockPatchFileProvider(customRoot: tempDirectoryURL.appendingPathComponent("TargetRoot"))
        rollbackManager = PatchRollbackManager()
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: tempDirectoryURL)
        super.tearDown()
    }

    func testRollbackRestoresOriginalFile() throws {
        let originalData = "ORIGINAL_VERSION".data(using: .utf8)!
        let modifiedData = "MODIFIED_VERSION".data(using: .utf8)!

        let targetRelPath = "Assets/config.bin"
        let targetURL = mockProvider.rootURL.appendingPathComponent(targetRelPath)

        // 1. Tạo file gốc
        try mockProvider.write(originalData, to: targetURL)
        let originalSHA = try PatchPackageValidator.calculateSHA256(of: targetURL)

        // 2. Tạo bản sao lưu
        let backupDir = tempDirectoryURL.appendingPathComponent("Backup")
        try FileManager.default.createDirectory(at: backupDir, withIntermediateDirectories: true)
        let backupURL = backupDir.appendingPathComponent(targetRelPath)
        try mockProvider.write(originalData, to: backupURL)

        // 3. Giả lập ghi đè bằng file mới
        try mockProvider.write(modifiedData, to: targetURL)
        let modifiedSHA = try PatchPackageValidator.calculateSHA256(of: targetURL)
        XCTAssertNotEqual(originalSHA, modifiedSHA)

        // 4. Tạo entry mô tả và thực thi rollback
        let entry = PatchJournalEntry(
            transactionID: UUID(),
            targetIdentifier: "test-target",
            destinationRelativePath: targetRelPath,
            originalSHA256: originalSHA,
            patchedSHA256: modifiedSHA,
            backupPath: backupURL.path,
            state: "applied",
            wasNewlyCreated: false
        )

        try rollbackManager.rollback(
            entries: [entry],
            backupDirectoryURL: backupDir,
            targetRootURL: mockProvider.rootURL,
            fileProvider: mockProvider
        )

        // 5. Kiểm tra file đích đã trở về nội dung gốc
        let restoredData = try mockProvider.read(targetURL)
        XCTAssertEqual(restoredData, originalData)
    }

    func testRollbackDeletesNewlyCreatedFiles() throws {
        let newlyCreatedRelPath = "NewFiles/patch.bin"
        let targetURL = mockProvider.rootURL.appendingPathComponent(newlyCreatedRelPath)

        let testData = "NEW_DATA".data(using: .utf8)!
        try mockProvider.write(testData, to: targetURL)
        XCTAssertTrue(mockProvider.exists(targetURL))

        let entry = PatchJournalEntry(
            transactionID: UUID(),
            targetIdentifier: "test-target",
            destinationRelativePath: newlyCreatedRelPath,
            originalSHA256: nil,
            patchedSHA256: "somehash",
            backupPath: nil,
            state: "applied",
            wasNewlyCreated: true
        )

        let backupDir = tempDirectoryURL.appendingPathComponent("BackupEmpty")
        try rollbackManager.rollback(
            entries: [entry],
            backupDirectoryURL: backupDir,
            targetRootURL: mockProvider.rootURL,
            fileProvider: mockProvider
        )

        XCTAssertFalse(mockProvider.exists(targetURL), "Tệp mới tạo phải bị xóa sạch sau rollback")
    }
}
