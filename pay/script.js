/**
 * ==========================================================================
 * THANOX QR TERMINAL — MASTER CONTROLLER
 * Concept: Direct & Open-Amount VietQR Terminal
 * Features: Dynamic Transfer Code, Real VietQR, Floating Bottom Bill Sheet,
 *           VisionOS Focus Mode, Canvas Image Download
 * ==========================================================================
 */

(() => {
    'use strict';

    // --------------------------------------------------------------------------
    // 1. CONFIGURATION (Single Source of Truth)
    // --------------------------------------------------------------------------
    const CONFIG = {
        bankName: "MB Bank",
        bin: "970422",
        accountNumber: "0326884292",
        accountName: "TRAN QUANG THANH",
        expirySeconds: 1800, // 30 minutes
        zaloUrl: "https://zalo.me/0889696810",
        zaloPhone: "0889 696 810"
    };

    // --------------------------------------------------------------------------
    // 2. STATE MANAGEMENT
    // --------------------------------------------------------------------------
    const state = {
        transferCode: "",
        expiryRemaining: CONFIG.expirySeconds,
        timerInterval: null,
        toastTimeout: null
    };

    // --------------------------------------------------------------------------
    // 3. DOM ELEMENT REFERENCES
    // --------------------------------------------------------------------------
    const $ = (id) => document.getElementById(id);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        // Telemetry & Timers
        timerValue: $('timerValue'),
        terminalStateText: $('terminalStateText'),

        // QR Core & Code
        qrImage: $('qrImage'),
        qrLoader: $('qrLoader'),
        transferCodeText: $('transferCodeText'),
        btnCopyCode: $('btnCopyCode'),
        btnSaveQR: $('btnSaveQR'),
        btnExpandQR: $('btnExpandQR'),
        btnRefreshCode: $('btnRefreshCode'),

        // Specs & Copies
        specAccount: $('specAccount'),
        specAccountName: $('specAccountName'),
        miniCopyButtons: $$('.btn-mini-copy'),

        // Floating Bill Action Layer
        floatingBillLayer: $('floatingBillLayer'),
        floatingActionTitle: $('floatingActionTitle'),
        btnCloseBillLayer: $('btnCloseBillLayer'),
        btnSendBillAdmin: $('btnSendBillAdmin'),

        // Focus Mode Modal
        focusModeModal: $('focusModeModal'),
        modalBackdrop: $('modalBackdrop'),
        btnCloseModal: $('btnCloseModal'),
        modalQrImage: $('modalQrImage'),
        modalCode: $('modalCode'),
        btnModalSaveQR: $('btnModalSaveQR'),
        btnModalCopyCode: $('btnModalCopyCode'),

        // Toast & Cursor
        terminalToast: $('terminalToast'),
        toastText: $('toastText'),
        cursorSpotlight: $('cursorSpotlight')
    };

    // --------------------------------------------------------------------------
    // 4. CODE GENERATION & VIETQR BUILDER
    // --------------------------------------------------------------------------
    function generateTransferCode() {
        const prefixes = ["TANGQUA", "GUIQUA", "THANOX"];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const digits = Math.floor(1000 + Math.random() * 9000); // 4-digit code
        return `${prefix}${digits}`;
    }

    /**
     * Build authentic VietQR URL without preset amount.
     * The customer enters the amount directly in their banking app upon scanning!
     */
    function buildVietQRUrl(code) {
        const bin = CONFIG.bin;
        const acc = CONFIG.accountNumber;
        const name = encodeURIComponent(CONFIG.accountName);
        const memo = encodeURIComponent(code);
        return `https://img.vietqr.io/image/${bin}-${acc}-compact2.png?addInfo=${memo}&accountName=${name}`;
    }

    // --------------------------------------------------------------------------
    // 5. QR ENGINE & REFRESH LOGIC
    // --------------------------------------------------------------------------
    function refreshQR(regenerateCode = false) {
        if (regenerateCode || !state.transferCode) {
            state.transferCode = generateTransferCode();
            sessionStorage.setItem('thanox_terminal_code', state.transferCode);
        }

        if (dom.transferCodeText) {
            dom.transferCodeText.textContent = state.transferCode;
        }

        const qrUrl = buildVietQRUrl(state.transferCode);

        // Show loader spinner
        if (dom.qrLoader) dom.qrLoader.classList.add('active');

        // Preload image
        const preloader = new Image();
        preloader.crossOrigin = "anonymous";
        preloader.onload = () => {
            if (dom.qrImage) {
                dom.qrImage.src = qrUrl;
            }
            if (dom.qrLoader) dom.qrLoader.classList.remove('active');
        };
        preloader.onerror = () => {
            if (dom.qrLoader) dom.qrLoader.classList.remove('active');
            if (dom.qrImage) dom.qrImage.src = qrUrl;
        };
        preloader.src = qrUrl;
    }

    // --------------------------------------------------------------------------
    // 6. CLIPBOARD & TOAST SYSTEM
    // --------------------------------------------------------------------------
    async function copyToClipboard(text, customToastMsg = "Đã sao chép vào bộ nhớ tạm!", triggerBillNotice = true, actionTitle = "ĐÃ SAO CHÉP MÃ") {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }

            showToast(customToastMsg);

            if (triggerBillNotice) {
                triggerFloatingBillLayer(actionTitle);
            }
        } catch (err) {
            console.error('Copy error:', err);
            showToast("Vui lòng sao chép thủ công!");
        }
    }

    function showToast(message) {
        if (!dom.terminalToast || !dom.toastText) return;
        dom.toastText.textContent = message;
        dom.terminalToast.classList.add('active');

        clearTimeout(state.toastTimeout);
        state.toastTimeout = setTimeout(() => {
            dom.terminalToast.classList.remove('active');
        }, 2600);
    }

    // --------------------------------------------------------------------------
    // 7. FLOATING BOTTOM BILL ACTION LAYER (TRIGGERED AFTER COPY / SAVE)
    // --------------------------------------------------------------------------
    function triggerFloatingBillLayer(titleText = "ĐÃ SAO CHÉP / LƯU QR") {
        if (!dom.floatingBillLayer) return;
        if (dom.floatingActionTitle) {
            dom.floatingActionTitle.textContent = titleText;
        }

        dom.floatingBillLayer.classList.add('active');
        dom.floatingBillLayer.setAttribute('aria-hidden', 'false');
    }

    function closeFloatingBillLayer() {
        if (!dom.floatingBillLayer) return;
        dom.floatingBillLayer.classList.remove('active');
        dom.floatingBillLayer.setAttribute('aria-hidden', 'true');
    }

    // --------------------------------------------------------------------------
    // 8. SAVE QR AS HIGH-RESOLUTION PNG
    // --------------------------------------------------------------------------
    async function saveQRCodeImage() {
        try {
            showToast("Đang chuẩn bị file ảnh QR...");
            const qrUrl = buildVietQRUrl(state.transferCode);

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                canvas.width = img.naturalWidth || 600;
                canvas.height = img.naturalHeight || 600;

                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        window.open(qrUrl, '_blank');
                        return;
                    }
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Thanox-QR-${state.transferCode}.png`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);

                    showToast("✓ Đã tải ảnh QR thành công!");
                    triggerFloatingBillLayer("ĐÃ LƯU ẢNH QR THANH TOÁN");
                }, 'image/png');
            };

            img.onerror = () => {
                const link = document.createElement('a');
                link.href = qrUrl;
                link.target = '_blank';
                link.download = `Thanox-QR-${state.transferCode}.png`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                showToast("✓ Đã mở ảnh QR!");
                triggerFloatingBillLayer("ĐÃ LƯU ẢNH QR THANH TOÁN");
            };

            img.src = qrUrl;
        } catch (err) {
            console.error('Save QR error:', err);
            window.open(buildVietQRUrl(state.transferCode), '_blank');
        }
    }

    // --------------------------------------------------------------------------
    // 9. FULLSCREEN VISIONOS FOCUS MODE MODAL
    // --------------------------------------------------------------------------
    function openFocusMode() {
        if (!dom.focusModeModal) return;
        const qrUrl = buildVietQRUrl(state.transferCode);
        if (dom.modalQrImage) dom.modalQrImage.src = qrUrl;
        if (dom.modalCode) dom.modalCode.textContent = state.transferCode;

        dom.focusModeModal.classList.add('active');
        dom.focusModeModal.setAttribute('aria-hidden', 'false');
    }

    function closeFocusMode() {
        if (!dom.focusModeModal) return;
        dom.focusModeModal.classList.remove('active');
        dom.focusModeModal.setAttribute('aria-hidden', 'true');
    }

    // --------------------------------------------------------------------------
    // 10. SYSTEM EXPIRY COUNTDOWN
    // --------------------------------------------------------------------------
    function startCountdown() {
        if (state.timerInterval) clearInterval(state.timerInterval);

        state.timerInterval = setInterval(() => {
            state.expiryRemaining--;
            if (state.expiryRemaining <= 0) {
                clearInterval(state.timerInterval);
                if (dom.timerValue) dom.timerValue.textContent = "00:00";
                if (dom.terminalStateText) dom.terminalStateText.textContent = "SESSION EXPIRED";
                showToast("Mã QR đã hết hạn. Đang làm mới...");
                setTimeout(() => {
                    state.expiryRemaining = CONFIG.expirySeconds;
                    refreshQR(true);
                    startCountdown();
                }, 2000);
                return;
            }

            const minutes = Math.floor(state.expiryRemaining / 60);
            const seconds = state.expiryRemaining % 60;
            const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (dom.timerValue) {
                dom.timerValue.textContent = display;
            }
        }, 1000);
    }

    // --------------------------------------------------------------------------
    // 11. EVENT LISTENERS SETUP
    // --------------------------------------------------------------------------
    function bindEvents() {
        // Refresh Transfer Code
        if (dom.btnRefreshCode) {
            dom.btnRefreshCode.addEventListener('click', () => {
                refreshQR(true);
                showToast(`✓ Đã tạo mã mới: ${state.transferCode}`);
            });
        }

        // Copy Transfer Code
        if (dom.btnCopyCode) {
            dom.btnCopyCode.addEventListener('click', () => {
                copyToClipboard(
                    state.transferCode, 
                    `✓ Đã sao chép nội dung: ${state.transferCode}`, 
                    true, 
                    "ĐÃ SAO CHÉP MÃ CHUYỂN KHOẢN"
                );
            });
        }

        // Mini Copy Buttons (Account Number & Account Name)
        dom.miniCopyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const textToCopy = btn.getAttribute('data-copy');
                copyToClipboard(
                    textToCopy, 
                    `✓ Đã sao chép: ${textToCopy}`, 
                    true, 
                    "ĐÃ SAO CHÉP THÔNG TIN TÀI KHOẢN"
                );
            });
        });

        // Save QR Action
        if (dom.btnSaveQR) {
            dom.btnSaveQR.addEventListener('click', saveQRCodeImage);
        }

        // Expand QR Action
        if (dom.btnExpandQR) {
            dom.btnExpandQR.addEventListener('click', openFocusMode);
        }

        // Floating Bill Action Layer Close
        if (dom.btnCloseBillLayer) {
            dom.btnCloseBillLayer.addEventListener('click', closeFloatingBillLayer);
        }

        // Modal Controls
        if (dom.btnCloseModal) {
            dom.btnCloseModal.addEventListener('click', closeFocusMode);
        }
        if (dom.modalBackdrop) {
            dom.modalBackdrop.addEventListener('click', closeFocusMode);
        }
        if (dom.btnModalSaveQR) {
            dom.btnModalSaveQR.addEventListener('click', saveQRCodeImage);
        }
        if (dom.btnModalCopyCode) {
            dom.btnModalCopyCode.addEventListener('click', () => {
                copyToClipboard(
                    state.transferCode, 
                    `✓ Đã sao chép: ${state.transferCode}`, 
                    true, 
                    "ĐÃ SAO CHÉP MÃ CHUYỂN KHOẢN"
                );
            });
        }

        // Keyboard navigation (ESC to close modals)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeFocusMode();
                closeFloatingBillLayer();
            }
        });

        // Desktop Cursor Spotlight Follow
        window.addEventListener('pointermove', (e) => {
            if (dom.cursorSpotlight) {
                dom.cursorSpotlight.style.opacity = '1';
                dom.cursorSpotlight.style.left = `${e.clientX}px`;
                dom.cursorSpotlight.style.top = `${e.clientY}px`;
            }
        });

        // iOS 27 3D Spatial Gyro Tilt on Hardware QR Core
        const qrUnit = $('hardwareQRUnit');
        const chassis = qrUnit ? qrUnit.querySelector('.hardware-chassis') : null;
        if (qrUnit && chassis) {
            qrUnit.addEventListener('pointermove', (e) => {
                const rect = qrUnit.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const rotateX = -((y - cy) / cy) * 10;
                const rotateY = ((x - cx) / cx) * 10;
                chassis.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px)`;
            });

            qrUnit.addEventListener('pointerleave', () => {
                chassis.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translateY(0px)';
            });
        }

        // iOS Liquid Click Ripple on Buttons
        document.addEventListener('pointerdown', (e) => {
            const btn = e.target.closest('button, .btn-action-hardware, .btn-send-bill-cta, .btn-copy-code, .btn-mini-copy');
            if (!btn) return;

            const rect = btn.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ios-liquid-ripple';
            const size = Math.max(rect.width, rect.height) * 1.6;
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            btn.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });

        // 3D Spatial Orb Responsive Parallax
        const orbSphere = document.querySelector('.spatial-glass-sphere');
        if (orbSphere) {
            window.addEventListener('pointermove', (e) => {
                const normX = (e.clientX / window.innerWidth - 0.5) * 24;
                const normY = (e.clientY / window.innerHeight - 0.5) * 24;
                orbSphere.style.transform = `translate(${normX.toFixed(1)}px, ${normY.toFixed(1)}px) rotateX(${(-normY).toFixed(1)}deg) rotateY(${normX.toFixed(1)}deg)`;
            });
        }
    }

    // --------------------------------------------------------------------------
    // 12. INITIALIZATION
    // --------------------------------------------------------------------------
    function init() {
        const savedCode = sessionStorage.getItem('thanox_terminal_code');
        state.transferCode = savedCode || generateTransferCode();
        sessionStorage.setItem('thanox_terminal_code', state.transferCode);

        bindEvents();
        refreshQR(false);
        startCountdown();

        console.log('⚡ THANOX QR TERMINAL v2.7 — Direct & Open-Amount Mode Ready.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
