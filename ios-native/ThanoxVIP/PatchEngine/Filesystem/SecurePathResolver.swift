//
//  SecurePathResolver.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import Foundation

public final class SecurePathResolver {
    public static let shared = SecurePathResolver()

    public init() {}

    /// Phân giải đường dẫn an toàn tuyệt đối, ngăn chặn mọi kỹ thuật Path Traversal và Symlink Escape
    public func resolve(root: URL, relativePath: String) throws -> URL {
        // 1. Kiểm tra chuỗi rỗng
        let trimmed = relativePath.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw PatchEngineError.invalidPath("Đường dẫn tương đối không được để trống")
        }

        // 2. Chặn các tiền tố nguy hiểm: file://, absolute path '/', traversal '../'
        if trimmed.hasPrefix("file://") || trimmed.hasPrefix("/") {
            throw PatchEngineError.invalidPath("Không được phép sử dụng đường dẫn tuyệt đối hoặc scheme file://: \(relativePath)")
        }

        if trimmed.contains("..") || trimmed.split(separator: "/").contains("..") {
            throw PatchEngineError.invalidPath("Phát hiện ký tự Path Traversal (..) trong đường dẫn: \(relativePath)")
        }

        // 3. Chuẩn hóa Root URL
        let canonicalRoot = root.resolvingSymlinksInPath().standardizedFileURL

        // 4. Tạo URL đích bằng cách nối tương đối
        let candidateURL = canonicalRoot.appendingPathComponent(trimmed).standardizedFileURL

        // 5. Phân giải symbolic links của candidate URL nếu có tệp/thư mục tồn tại
        let resolvedCandidate = candidateURL.resolvingSymlinksInPath().standardizedFileURL

        // 6. Đảm bảo đường dẫn đích bắt buộc phải có tiền tố nằm trong root
        let rootPath = canonicalRoot.path.hasSuffix("/") ? canonicalRoot.path : canonicalRoot.path + "/"
        let candidatePath = resolvedCandidate.path

        guard candidatePath == canonicalRoot.path || candidatePath.hasPrefix(rootPath) else {
            throw PatchEngineError.destinationOutsideRoot("Đường dẫn đích \(candidatePath) thoát khỏi thư mục root cho phép: \(canonicalRoot.path)")
        }

        return resolvedCandidate
    }
}
