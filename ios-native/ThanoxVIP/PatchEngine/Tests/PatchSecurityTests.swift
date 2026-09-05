//
//  PatchSecurityTests.swift
//  ThanoxVIPTests
//
//  Created for PatchEngine Framework Tests.
//

#if canImport(XCTest)
import XCTest

final class PatchSecurityTests: XCTestCase {
    var rootURL: URL!
    var resolver: SecurePathResolver!

    override func setUp() {
        super.setUp()
        rootURL = URL(fileURLWithPath: NSTemporaryDirectory())
            .appendingPathComponent("PatchSecurityTests_\(UUID().uuidString)")
        try? FileManager.default.createDirectory(at: rootURL, withIntermediateDirectories: true)
        resolver = SecurePathResolver.shared
    }

    override func tearDown() {
        try? FileManager.default.removeItem(at: rootURL)
        super.tearDown()
    }

    func testRejectPathTraversalParentDirectory() {
        let maliciousPaths = [
            "../secret.txt",
            "../../private/var",
            "folder/../../escape.txt",
            "folder/../..",
            "subfolder/../../../root.txt"
        ]

        for path in maliciousPaths {
            XCTAssertThrowsError(try resolver.resolve(root: rootURL, relativePath: path)) { error in
                guard let patchError = error as? PatchEngineError else {
                    XCTFail("Kỳ vọng PatchEngineError cho đường dẫn: \(path)")
                    return
                }
                if case .invalidPath = patchError {
                    // Passed
                } else if case .destinationOutsideRoot = patchError {
                    // Also passed
                } else {
                    XCTFail("Kỳ vọng lỗi traversal nhưng nhận được: \(patchError)")
                }
            }
        }
    }

    func testRejectAbsolutePath() {
        let absolutePaths = [
            "/var/mobile/Containers",
            "/private/etc/passwd",
            "/Applications",
            "file:///var/mobile/test"
        ]

        for path in absolutePaths {
            XCTAssertThrowsError(try resolver.resolve(root: rootURL, relativePath: path)) { error in
                guard let patchError = error as? PatchEngineError else {
                    XCTFail("Kỳ vọng PatchEngineError cho absolute path: \(path)")
                    return
                }
                if case .invalidPath = patchError {
                    // Passed
                } else {
                    XCTFail("Kỳ vọng .invalidPath cho: \(path)")
                }
            }
        }
    }

    func testValidRelativePathsStayWithinRoot() throws {
        let safePaths = [
            "data/config.json",
            "assets/textures/player.png",
            "settings/prefs.plist"
        ]

        for path in safePaths {
            let resolved = try resolver.resolve(root: rootURL, relativePath: path)
            XCTAssertTrue(resolved.path.hasPrefix(rootURL.path), "Đường dẫn hợp lệ phải nằm trong root")
        }
    }
}
#endif
