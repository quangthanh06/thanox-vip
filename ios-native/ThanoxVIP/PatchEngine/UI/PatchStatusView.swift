//
//  PatchStatusView.swift
//  ThanoxVIP
//
//  Created for PatchEngine Framework.
//

import UIKit

public final class PatchStatusView: UIView {
    public let statusDot = UIView()
    public let statusLabel = UILabel()
    public let detailsLabel = UILabel()

    public override init(frame: CGRect) {
        super.init(frame: frame)
        setupView()
    }

    public required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupView()
    }

    private func setupView() {
        backgroundColor = UIColor(white: 0.1, alpha: 0.8)
        layer.cornerRadius = 14
        layer.borderWidth = 1
        layer.borderColor = UIColor(white: 0.25, alpha: 0.6).cgColor

        statusDot.translatesAutoresizingMaskIntoConstraints = false
        statusDot.layer.cornerRadius = 5
        statusDot.backgroundColor = .systemGray

        statusLabel.translatesAutoresizingMaskIntoConstraints = false
        statusLabel.font = UIFont.systemFont(ofSize: 13, weight: .bold)
        statusLabel.textColor = .white
        statusLabel.text = "READY"

        detailsLabel.translatesAutoresizingMaskIntoConstraints = false
        detailsLabel.font = UIFont.monospacedSystemFont(ofSize: 11, weight: .regular)
        detailsLabel.textColor = UIColor(white: 0.7, alpha: 1.0)
        detailsLabel.numberOfLines = 2
        detailsLabel.text = "Sẵn sàng áp dụng bản vá"

        addSubview(statusDot)
        addSubview(statusLabel)
        addSubview(detailsLabel)

        NSLayoutConstraint.activate([
            statusDot.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 14),
            statusDot.topAnchor.constraint(equalTo: topAnchor, constant: 16),
            statusDot.widthAnchor.constraint(equalToConstant: 10),
            statusDot.heightAnchor.constraint(equalToConstant: 10),

            statusLabel.leadingAnchor.constraint(equalTo: statusDot.trailingAnchor, constant: 8),
            statusLabel.centerYAnchor.constraint(equalTo: statusDot.centerYAnchor),
            statusLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -14),

            detailsLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 14),
            detailsLabel.topAnchor.constraint(equalTo: statusLabel.bottomAnchor, constant: 6),
            detailsLabel.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -14),
            detailsLabel.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -14)
        ])
    }

    public func update(status: String, details: String, color: UIColor) {
        statusLabel.text = status
        detailsLabel.text = details
        statusDot.backgroundColor = color
        layer.borderColor = color.withAlphaComponent(0.4).cgColor
    }
}
