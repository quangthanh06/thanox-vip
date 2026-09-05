//
//  AimBodyPatchView.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import UIKit

@MainActor
public final class AimBodyPatchViewController: UIViewController, UIDocumentPickerDelegate {
    private let scrollView = UIScrollView()
    private let contentView = UIStackView()

    private let statusCard = PatchStatusView()
    private let progressView = PatchProgressView()

    private let targetSegmentedControl = UISegmentedControl(items: ["TestGameA", "TestGameB", "LocalSandbox"])
    private let packageInfoLabel = UILabel()
    private let shaLabel = UILabel()

    private let applyButton = UIButton(type: .system)
    private let restoreButton = UIButton(type: .system)
    private let selfTestButton = UIButton(type: .system)
    private let importButton = UIButton(type: .system)
    private let exportButton = UIButton(type: .system)

    private var currentPackage: PatchPackage?
    private var availableTargets: [PatchTarget] = [
        .testTargetA,
        .testTargetB,
        .localSandboxTarget
    ]
    private var selectedTarget: PatchTarget {
        let index = targetSegmentedControl.selectedSegmentIndex
        if index >= 0 && index < availableTargets.count {
            return availableTargets[index]
        }
        return .localSandboxTarget
    }

    private var lastTransactionID: UUID?

    public override func viewDidLoad() {
        super.viewDidLoad()
        title = "AIM BODY Patch Engine"
        view.backgroundColor = UIColor(red: 0.05, green: 0.06, blue: 0.08, alpha: 1.0)
        setupLayout()
        setupDefaultPackage()
        checkInterruptedTransactions()
    }

    private func setupLayout() {
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        contentView.translatesAutoresizingMaskIntoConstraints = false
        contentView.axis = .vertical
        contentView.spacing = 16
        contentView.alignment = .fill

        view.addSubview(scrollView)
        scrollView.addSubview(contentView)

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor, constant: 16),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor, constant: 16),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor, constant: -16),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor, constant: -16),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor, constant: -32)
        ])

        // 1. Status Card
        contentView.addArrangedSubview(statusCard)

        // 2. Target Selector
        let targetSection = UIStackView()
        targetSection.axis = .vertical
        targetSection.spacing = 6

        let targetTitle = UILabel()
        targetTitle.text = "MỤC TIÊU BẢN VÁ (TARGET)"
        targetTitle.font = UIFont.systemFont(ofSize: 11, weight: .bold)
        targetTitle.textColor = UIColor(white: 0.6, alpha: 1.0)

        targetSegmentedControl.selectedSegmentIndex = 2 // default local sandbox
        targetSegmentedControl.backgroundColor = UIColor(white: 0.15, alpha: 1.0)
        targetSegmentedControl.selectedSegmentTintColor = .systemTeal
        targetSegmentedControl.setTitleTextAttributes([.foregroundColor: UIColor.white], for: .normal)
        targetSegmentedControl.setTitleTextAttributes([.foregroundColor: UIColor.black], for: .selected)
        targetSegmentedControl.addTarget(self, action: #selector(targetChanged), for: .valueChanged)

        targetSection.addArrangedSubview(targetTitle)
        targetSection.addArrangedSubview(targetSegmentedControl)
        contentView.addArrangedSubview(targetSection)

        // 3. Package Info Box
        let infoBox = UIView()
        infoBox.backgroundColor = UIColor(white: 0.1, alpha: 0.8)
        infoBox.layer.cornerRadius = 12
        infoBox.layer.borderWidth = 1
        infoBox.layer.borderColor = UIColor(white: 0.2, alpha: 0.6).cgColor

        packageInfoLabel.translatesAutoresizingMaskIntoConstraints = false
        packageInfoLabel.font = UIFont.systemFont(ofSize: 12, weight: .semibold)
        packageInfoLabel.textColor = .white
        packageInfoLabel.text = "Package: Đang nạp..."

        shaLabel.translatesAutoresizingMaskIntoConstraints = false
        shaLabel.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .regular)
        shaLabel.textColor = .systemTeal
        shaLabel.text = "SHA-256: ..."

        infoBox.addSubview(packageInfoLabel)
        infoBox.addSubview(shaLabel)

        NSLayoutConstraint.activate([
            packageInfoLabel.topAnchor.constraint(equalTo: infoBox.topAnchor, constant: 12),
            packageInfoLabel.leadingAnchor.constraint(equalTo: infoBox.leadingAnchor, constant: 12),
            packageInfoLabel.trailingAnchor.constraint(equalTo: infoBox.trailingAnchor, constant: -12),

            shaLabel.topAnchor.constraint(equalTo: packageInfoLabel.bottomAnchor, constant: 4),
            shaLabel.leadingAnchor.constraint(equalTo: infoBox.leadingAnchor, constant: 12),
            shaLabel.trailingAnchor.constraint(equalTo: infoBox.trailingAnchor, constant: -12),
            shaLabel.bottomAnchor.constraint(equalTo: infoBox.bottomAnchor, constant: -12)
        ])

        contentView.addArrangedSubview(infoBox)

        // 4. Progress View
        progressView.isHidden = true
        contentView.addArrangedSubview(progressView)

        // 5. Apply Button
        applyButton.setTitle("ÁP DỤNG BẢN VÁ (APPLY)", for: .normal)
        applyButton.backgroundColor = .systemTeal
        applyButton.setTitleColor(.black, for: .normal)
        applyButton.titleLabel?.font = UIFont.systemFont(ofSize: 14, weight: .black)
        applyButton.layer.cornerRadius = 14
        applyButton.heightAnchor.constraint(equalToConstant: 48).isActive = true
        applyButton.addTarget(self, action: #selector(handleApply), for: .touchUpInside)
        contentView.addArrangedSubview(applyButton)

        // 6. Action buttons row: Restore & Import
        let actionRow = UIStackView()
        actionRow.axis = .horizontal
        actionRow.spacing = 10
        actionRow.distribution = .fillEqually

        importButton.setTitle("NẠP GÓI .3105", for: .normal)
        importButton.backgroundColor = UIColor(white: 0.2, alpha: 1.0)
        importButton.setTitleColor(.white, for: .normal)
        importButton.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: .bold)
        importButton.layer.cornerRadius = 10
        importButton.heightAnchor.constraint(equalToConstant: 40).isActive = true
        importButton.addTarget(self, action: #selector(handleImport), for: .touchUpInside)

        restoreButton.setTitle("KHÔI PHỤC (RESTORE)", for: .normal)
        restoreButton.backgroundColor = UIColor(white: 0.2, alpha: 1.0)
        restoreButton.setTitleColor(.systemOrange, for: .normal)
        restoreButton.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: .bold)
        restoreButton.layer.cornerRadius = 10
        restoreButton.heightAnchor.constraint(equalToConstant: 40).isActive = true
        restoreButton.addTarget(self, action: #selector(handleRestore), for: .touchUpInside)

        actionRow.addArrangedSubview(importButton)
        actionRow.addArrangedSubview(restoreButton)
        contentView.addArrangedSubview(actionRow)

        // 7. Diagnostics Self-Test Button
        selfTestButton.setTitle("⚡ RUN SELF TEST (KIỂM TRA THIẾT BỊ)", for: .normal)
        selfTestButton.backgroundColor = UIColor(red: 0.15, green: 0.25, blue: 0.2, alpha: 1.0)
        selfTestButton.setTitleColor(.systemGreen, for: .normal)
        selfTestButton.titleLabel?.font = UIFont.systemFont(ofSize: 12, weight: .bold)
        selfTestButton.layer.cornerRadius = 10
        selfTestButton.layer.borderWidth = 1
        selfTestButton.layer.borderColor = UIColor.systemGreen.withAlphaComponent(0.4).cgColor
        selfTestButton.heightAnchor.constraint(equalToConstant: 40).isActive = true
        selfTestButton.addTarget(self, action: #selector(handleRunSelfTest), for: .touchUpInside)
        contentView.addArrangedSubview(selfTestButton)
    }

    private func setupDefaultPackage() {
        let sampleData = "SAMPLE_PATCH_DATA_THAN_AIMBODY".data(using: .utf8)!
        let sampleSHA = "a6b68ca50ab4a1b4fa959ac5355050b41a08a1a9fd87c26898313ba9d6a88608"

        // Tạo tệp payload mẫu trong Packages/
        let pkgDir = PatchManager.shared.packagesDirectoryURL.appendingPathComponent("DefaultPackage", isDirectory: true)
        let payloadFile = pkgDir.appendingPathComponent("patch_payload.bin")
        try? FileManager.default.createDirectory(at: pkgDir, withIntermediateDirectories: true, attributes: nil)
        try? sampleData.write(to: payloadFile)

        let realSHA = (try? PatchPackageValidator.calculateSHA256(of: payloadFile)) ?? sampleSHA

        let pkg = PatchPackage(
            identifier: "AIMBODY-V1",
            version: "1.0.0",
            metadata: PatchMetadata(
                name: "AIM BODY Core v1.0.0",
                version: "1.0.0",
                targetIdentifier: selectedTarget.targetIdentifier,
                payloadSHA256: realSHA
            ),
            payloadURL: pkgDir,
            files: [
                PatchFile(relativePath: "patch_payload.bin", sha256: realSHA, size: Int64(sampleData.count))
            ]
        )

        self.currentPackage = pkg
        packageInfoLabel.text = "Package: \(pkg.metadata.name) v\(pkg.metadata.version)"
        shaLabel.text = "SHA-256: \(realSHA.prefix(16))...\(realSHA.suffix(8))"
        statusCard.update(status: "READY", details: "Mục tiêu: \(selectedTarget.displayName)", color: .systemTeal)
    }

    @objc private func targetChanged() {
        statusCard.update(status: "READY", details: "Mục tiêu: \(selectedTarget.displayName)", color: .systemTeal)
    }

    @objc private func handleApply() {
        guard let package = currentPackage else { return }

        applyButton.isEnabled = false
        progressView.isHidden = false

        Task {
            do {
                let result = try await PatchManager.shared.apply(package: package, target: selectedTarget) { [weak self] stage, msg in
                    Task { @MainActor in
                        self?.progressView.update(stage: stage, message: msg)
                    }
                }

                if result.isSuccess {
                    self.lastTransactionID = result.transactionID
                    self.statusCard.update(status: "APPLIED", details: "Áp dụng thành công cho \(self.selectedTarget.displayName)", color: .systemGreen)
                    self.showAlert(title: "Thành công", message: result.message)
                } else {
                    self.statusCard.update(status: "FAILED", details: result.errorDescription ?? "Lỗi không xác định", color: .systemRed)
                    self.showAlert(title: "Thất bại", message: result.errorDescription ?? "Lỗi giao dịch")
                }
            } catch {
                self.statusCard.update(status: "ERROR", details: error.localizedDescription, color: .systemRed)
                self.showAlert(title: "Lỗi", message: error.localizedDescription)
            }

            self.applyButton.isEnabled = true
        }
    }

    @objc private func handleRestore() {
        guard let txID = lastTransactionID else {
            showAlert(title: "Khôi phục", message: "Chưa có bản ghi giao dịch gần nhất để khôi phục.")
            return
        }

        do {
            try PatchManager.shared.restore(transactionID: txID, target: selectedTarget)
            statusCard.update(status: "RESTORED", details: "Đã hoàn trả trạng thái ban đầu", color: .systemOrange)
            showAlert(title: "Khôi phục", message: "Đã hoàn trả bản sao lưu thành công!")
        } catch {
            showAlert(title: "Lỗi khôi phục", message: error.localizedDescription)
        }
    }

    @objc private func handleRunSelfTest() {
        selfTestButton.isEnabled = false
        selfTestButton.setTitle("Đang kiểm tra...", for: .normal)

        Task {
            let report = await PatchEngineDiagnostics.runSelfTest()
            if report.isSuccess {
                self.statusCard.update(status: "SELF TEST PASSED", details: "\(report.totalPassed) kiểm thử đạt 100% OK", color: .systemGreen)
                let message = "Toàn bộ chu trình Patch Engine (Security Path Resolver, Codec, Transaction, Backup, Rollback) đã vượt qua kiểm thử thành công trên sandbox thiết bị thật!\n\n" + report.logs.joined(separator: "\n")
                self.showAlert(title: "Self-Test Thành Công (\(report.totalPassed)/\(report.totalPassed))", message: message)
            } else {
                self.statusCard.update(status: "SELF TEST FAILED", details: "\(report.totalFailed) kiểm thử thất bại", color: .systemRed)
                let message = "Phát hiện lỗi trong quy trình kiểm thử:\n\n" + report.logs.joined(separator: "\n")
                self.showAlert(title: "Self-Test Thất Bại", message: message)
            }

            self.selfTestButton.isEnabled = true
            self.selfTestButton.setTitle("⚡ RUN SELF TEST (KIỂM TRA THIẾT BỊ)", for: .normal)
        }
    }

    @objc private func handleImport() {
        PatchShareManager.shared.presentDocumentPicker(from: self, delegate: self)
    }

    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let pickedURL = urls.first else { return }

        Task {
            do {
                let imported = try await PatchManager.shared.importer.importPackage(from: pickedURL)
                self.currentPackage = imported
                self.packageInfoLabel.text = "Package: \(imported.metadata.name) v\(imported.metadata.version)"
                self.shaLabel.text = "SHA-256: \(imported.metadata.payloadSHA256.prefix(16))..."
                self.statusCard.update(status: "IMPORTED", details: "Đã nạp gói mới hợp lệ", color: .systemTeal)
                self.showAlert(title: "Nạp gói thành công", message: "Đã nạp gói: \(imported.metadata.name)")
            } catch {
                self.showAlert(title: "Lỗi nạp gói", message: error.localizedDescription)
            }
        }
    }

    private func checkInterruptedTransactions() {
        let interrupted = PatchManager.shared.recoveryManager.scanIncompleteTransactions()
        if let first = interrupted.first {
            statusCard.update(status: "RECOVERY NEEDED", details: "Phát hiện giao dịch chưa hoàn tất: \(first.transactionID.uuidString.prefix(8))", color: .systemYellow)
        }
    }

    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
        present(alert, animated: true, completion: nil)
    }
}
