//
//  PatchShareManager.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import UIKit
import UniformTypeIdentifiers

@MainActor
public final class PatchShareManager {
    public static let shared = PatchShareManager()

    public init() {}

    /// Chia sẻ tệp qua UIActivityViewController chuẩn của iOS (AirDrop, Files, Mail...)
    public func share(fileURL: URL, from viewController: UIViewController) {
        let activityVC = UIActivityViewController(activityItems: [fileURL], applicationActivities: nil)

        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = viewController.view
            popover.sourceRect = CGRect(
                x: viewController.view.bounds.midX,
                y: viewController.view.bounds.midY,
                width: 0,
                height: 0
            )
            popover.permittedArrowDirections = []
        }

        viewController.present(activityVC, animated: true, completion: nil)
    }

    /// Mở Document Picker để chọn tệp .3105 hoặc .bin
    public func presentDocumentPicker(
        forContentTypes types: [String] = ["public.data", "public.item"],
        from viewController: UIViewController,
        delegate: UIDocumentPickerDelegate
    ) {
        let utTypes = types.compactMap { UTType($0) }
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: utTypes.isEmpty ? [.data] : utTypes, asCopy: true)

        picker.delegate = delegate
        picker.allowsMultipleSelection = false
        viewController.present(picker, animated: true, completion: nil)
    }
}
