//
//  PatchTransactionTests.swift
//  ThanoxVIPTests
//
//  Created for PatchEngine Framework Tests.
//

#if canImport(XCTest)
import XCTest

final class PatchTransactionTests: XCTestCase {
    var tempDirectoryURL: URL!
    var mockProvider: MockPatchFileProvider!
    var executor: PatchTransactionExecutor!
    var journalsDirURL: URL!
    var backupsDirURL: URL!

    override func setUp() {
        super.setUp()
        tempDirectoryURL = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("PatchTransactionTests_\(UUID().uuidString)")

        journalsDirURL = tempDirectoryURL.appendingPathComponent("Journals")
        backupsDirURL = tempDirectoryURL.appendingPathComponent("Backups")

        try? FileManager.default.createDirectory(at: journalsDirURL, withIntermediateDirectories: true)
        try? FileManager.default.createDirectory(at: backupsDirURL, withIntermediateDirectories: true)

        mockProvider = MockPatchFileProvider(customRoot: tempDirectoryURL.appendingPathComponent("Workspace"))
        executor = PatchTransactionExecutor(backupsBaseURL: backupsDirURL)
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: tempDirectoryURL)
        super.tearDown()
    }

    func testTransactionExecutionSuccess() async throws {
        // Tạo source file
        let sourceDir = tempDirectoryURL.appendingPathComponent("SourcePayload")
        try FileManager.default.createDirectory(at: sourceDir, withIntermediateDirectories: true)

        let payloadData = "TEST_TRANSACTION_PAYLOAD".data(using: .utf8)!
        let sourceFile = sourceDir.appendingPathComponent("asset.bin")
        try payloadData.write(to: sourceFile)

        let sha = try PatchPackageValidator.calculateSHA256(of: sourceFile)

        let package = PatchPackage(
            identifier: "TX-TEST-01",
            version: "1.0.0",
            metadata: PatchMetadata(
                name: "Transaction Test",
                version: "1.0.0",
                targetIdentifier: "test-game-a",
                payloadSHA256: sha
            ),
            payloadURL: sourceDir,
            files: [
                PatchFile(relativePath: "asset.bin", sha256: sha, size: Int64(payloadData.count))
            ]
        )

        let target = PatchTarget.testTargetA

        // Thực thi transaction
        let result = try await executor.execute(
            package: package,
            target: target,
            fileProvider: mockProvider,
            journalsDirectoryURL: journalsDirURL
        )

        XCTAssertTrue(result.isSuccess)
        XCTAssertEqual(result.finalChecksum, sha)

        // Kiểm tra file đích đã được tạo
        let destRelative = (target.relativeDirectory as NSString).appendingPathComponent("asset.bin")
        let destURL = mockProvider.rootURL.appendingPathComponent(destRelative)
        XCTAssertTrue(mockProvider.exists(destURL))

        let destData = try mockProvider.read(destURL)
        XCTAssertEqual(destData, payloadData)
    }
}
#endif
