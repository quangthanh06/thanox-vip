//
//  PatchPackageTests.swift
//  ThanoxVIPTests
//
//  Created for PatchEngine Framework Tests.
//

import XCTest
@testable import ThanoxVIP

final class PatchPackageTests: XCTestCase {
    var tempDirectoryURL: URL!

    override func setUp() {
        super.setUp()
        tempDirectoryURL = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("PatchPackageTests_\(UUID().uuidString)")
        try? FileManager.default.createDirectory(at: tempDirectoryURL, withIntermediateDirectories: true)
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: tempDirectoryURL)
        super.tearDown()
    }

    func testValidPackageCodec() throws {
        let sampleData = "SAMPLE_CONTENT".data(using: .utf8)!
        let sampleFile = tempDirectoryURL.appendingPathComponent("sample.bin")
        try sampleData.write(to: sampleFile)

        let sha = try PatchPackageValidator.calculateSHA256(of: sampleFile)

        let originalPackage = PatchPackage(
            identifier: "TEST-01",
            version: "1.0.0",
            metadata: PatchMetadata(
                name: "Test Package",
                version: "1.0.0",
                targetIdentifier: "test-target",
                payloadSHA256: sha
            ),
            payloadURL: tempDirectoryURL,
            files: [
                PatchFile(relativePath: "sample.bin", sha256: sha, size: Int64(sampleData.count))
            ]
        )

        // Encode
        let encodedData = try PatchPackageCodec.encode(package: originalPackage)
        XCTAssertGreaterThan(encodedData.count, 10)

        // Decode
        let decodedPackage = try PatchPackageCodec.decode(data: encodedData, payloadURL: tempDirectoryURL)
        XCTAssertEqual(decodedPackage.identifier, originalPackage.identifier)
        XCTAssertEqual(decodedPackage.version, originalPackage.version)
        XCTAssertEqual(decodedPackage.metadata.name, originalPackage.metadata.name)
        XCTAssertEqual(decodedPackage.files.count, 1)
        XCTAssertEqual(decodedPackage.files.first?.sha256, sha)
    }

    func testMalformedPackageRejection() {
        let corruptedData = "NOT_A_VALID_HEADER".data(using: .utf8)!
        XCTAssertThrowsError(try PatchPackageCodec.decode(data: corruptedData, payloadURL: tempDirectoryURL)) { error in
            guard let patchError = error as? PatchEngineError else {
                XCTFail("Kỳ vọng lỗi PatchEngineError nhưng nhận được \(error)")
                return
            }
            if case .invalidPackage = patchError {
                // Passed
            } else {
                XCTFail("Kỳ vọng .invalidPackage nhưng nhận được \(patchError)")
            }
        }
    }

    func testDuplicateFileRejection() {
        let invalidPackage = PatchPackage(
            identifier: "DUP-TEST",
            version: "1.0.0",
            metadata: PatchMetadata(
                name: "Duplicate Test",
                version: "1.0.0",
                targetIdentifier: "test-target",
                payloadSHA256: String(repeating: "0", count: 64)
            ),
            payloadURL: tempDirectoryURL,
            files: [
                PatchFile(relativePath: "assets/data.bin", sha256: String(repeating: "a", count: 64)),
                PatchFile(relativePath: "assets/data.bin", sha256: String(repeating: "b", count: 64))
            ]
        )

        XCTAssertThrowsError(try PatchPackageValidator.validate(package: invalidPackage)) { error in
            guard let patchErr = error as? PatchEngineError else {
                XCTFail("Kỳ vọng PatchEngineError")
                return
            }
            if case .invalidPackage(let msg) = patchErr {
                XCTAssertTrue(msg.contains("trùng lặp"))
            } else {
                XCTFail("Kỳ vọng lỗi trùng lặp")
            }
        }
    }
}
