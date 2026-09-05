//
//  PatchProgressView.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import UIKit

public final class PatchProgressView: UIView {
    public let progressBar = UIProgressView(progressViewStyle: .default)
    public let stageLabel = UILabel()
    public let percentageLabel = UILabel()

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        backgroundColor = .clear

        stageLabel.translatesAutoresizingMaskIntoConstraints = false
        stageLabel.font = UIFont.systemFont(ofSize: 11, weight: .semibold)
        stageLabel.textColor = UIColor(white: 0.8, alpha: 1.0)
        stageLabel.text = "Khởi tạo..."

        percentageLabel.translatesAutoresizingMaskIntoConstraints = false
        percentageLabel.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .bold)
        percentageLabel.textColor = .systemTeal
        percentageLabel.text = "0%"

        progressBar.translatesAutoresizingMaskIntoConstraints = false
        progressBar.progressTintColor = .systemTeal
        progressBar.trackTintColor = UIColor(white: 0.2, alpha: 1.0)
        progressBar.layer.cornerRadius = 3
        progressBar.clipsToBounds = true

        addSubview(stageLabel)
        addSubview(percentageLabel)
        addSubview(progressBar)

        NSLayoutConstraint.activate([
            stageLabel.leadingAnchor.constraint(equalTo: leadingAnchor),
            stageLabel.topAnchor.constraint(equalTo: topAnchor),

            percentageLabel.trailingAnchor.constraint(equalTo: trailingAnchor),
            percentageLabel.centerYAnchor.constraint(equalTo: stageLabel.centerYAnchor),

            progressBar.leadingAnchor.constraint(equalTo: leadingAnchor),
            progressBar.trailingAnchor.constraint(equalTo: trailingAnchor),
            progressBar.topAnchor.constraint(equalTo: stageLabel.bottomAnchor, constant: 6),
            progressBar.heightAnchor.constraint(equalToConstant: 6),
            progressBar.bottomAnchor.constraint(equalTo: bottomAnchor)
        ])
    }

    public func update(stage: PatchTransactionState, message: String) {
        stageLabel.text = message
        let progressValue: Float
        switch stage {
        case .preparing:
            progressValue = 0.20
            progressBar.progressTintColor = .systemBlue
        case .backingUp:
            progressValue = 0.40
            progressBar.progressTintColor = .systemIndigo
        case .applying:
            progressValue = 0.70
            progressBar.progressTintColor = .systemTeal
        case .verifying:
            progressValue = 0.90
            progressBar.progressTintColor = .systemOrange
        case .committed:
            progressValue = 1.0
            progressBar.progressTintColor = .systemGreen
        case .rollingBack:
            progressValue = 0.50
            progressBar.progressTintColor = .systemYellow
        case .rolledBack:
            progressValue = 1.0
            progressBar.progressTintColor = .systemYellow
        case .failed:
            progressValue = 1.0
            progressBar.progressTintColor = .systemRed
        }

        progressBar.setProgress(progressValue, animated: true)
        percentageLabel.text = "\(Int(progressValue * 100))%"
    }
}
