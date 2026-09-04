# HƯỚNG DẪN ĐẶC QUYỀN DÀNH CHO CLAUDE OPUS (CLAUDE INSTRUCTIONS & SKILL)

## 📌 1. BỐI CẢNH DỰ ÁN (PROJECT CONTEXT)
- **Tên dự án**: Thanox VIP Pro - iOS 27 Liquid Edition (Tối ưu hóa game, cảm ứng và hỗ trợ tâm ngắm chuyên biệt cho Free Fire & FF MAX trên iOS).
- **Tệp chính cần chỉnh sửa**: `Thanox_iOS_App/index.html` (Single Page Application tích hợp đầy đủ HTML, Tailwind CSS, Lucide Icons và JavaScript Engine).
- **Hồ sơ cấu hình iOS**: `Thanox.mobileconfig` & `ThanoxRootCA.cer`.
- **Thiết bị người dùng**: **iPhone 16 Plus** (`Width: 414, Height: 896, Scale: 3x, Sensi: 1.07x, AimCenter: [207.0, 448.0], Offset: [0.94, 0.94]`).
- **Mã Admin Master Key**: `THANOX-VIP-2026`.

---

## 🚫 2. CÁC ĐIỀU CẤM TUYỆT ĐỐI (STRICT CONSTRAINTS)
1. **TUYỆT ĐỐI KHÔNG SỬ DỤNG CHỮ "AI"**:
   - Không được thêm từ "AI", "Trí tuệ nhân tạo" ở bất kỳ đâu trong giao diện, nhãn nút, thông báo toast, hoặc mã nguồn hiển thị cho người dùng.
   - Thay thế bằng: "Ultra Aimlock", "Khóa Tâm Tự Động", "Gia Tốc Phần Cứng", "Engine Thanox", "Hệ Thống Thuật Toán".
2. **KHÔNG PHÁ VỠ LAYOUT GIAO DIỆN (UI INTEGRITY)**:
   - Giữ nguyên giao diện Liquid Glass Ruby Neon màu đỏ/đen ngọc bích sang trọng chuẩn iOS 27.
   - Không làm lệch vị trí Avatar Flork, thanh Header thông tin máy trên đỉnh đầu, nút [X] đóng modal.
   - Luôn duy trì tỷ lệ khung hình 1:1 chuẩn squircle cho các icon game.
3. **KHÔNG SỬA SAI CHỖ (PRECISION EDITING)**:
   - Mọi logic phải gắn đúng vào các hàm và biến có sẵn: `DEVICE_HARDWARE_PROFILES`, `CODES_100_LIST`, `HeadLockEngine`, `SoftAimEngine`, `AimAssistEngine`, `EffectAmplifierX10Engine`, `selectDeviceModel()`, `downloadDeviceMobileConfig()`.

---

## 🎯 3. NHIỆM VỤ TRỌNG TÂM CẦN NÂNG CẤP (MAIN OBJECTIVES)

### Nhiệm Vụ 1: Hỗ Trợ Nạp File Patch Động (Dynamic Patch File Injector)
- **Vấn đề**: Người dùng có các file patch riêng (như `ULTRA OB53.txt`, `ĐẦM TÂM OB53.txt`, `FIX DELAY OB52.txt`, file hex bytecode, file `.plist`, `.dat`).
- **Yêu cầu thực hiện**:
  1. Thêm một Modal hoặc Nút: **"NẠP FILE PATCH TÙY BIẾN (CUSTOM PATCH INJECTOR)"** trên tab Game VIP hoặc Trang Chủ.
  2. Cho phép người dùng:
     - **Tải lên file** (`.txt`, `.plist`, `.dat`, `.ips`, `.json`) hoặc **Dán trực tiếp nội dung patch/bytecode**.
  3. Xây dựng hàm phân tích cú pháp thông minh (`parseCustomPatch(content)`):
     - Tự động nhận diện định dạng: XML Plist, Hex Stream (`72 61 49...`), Base64 Bytecode, Binary Bitstream (`00101111...`), hoặc C++ Config (`gain`, `smooth`, `deadZone`).
     - Trích xuất các hệ số độ nhạy, góc bù trừ tâm, triệt tiêu độ trễ.
  4. Nạp thẳng vào bộ nhớ:
     - Ghi đè trực tiếp vào `HeadLockEngine`, `SoftAimEngine` và `ACTIVE_DEVICE_PROFILE`.
     - Lưu trạng thái vào `localStorage.setItem("thanox_custom_patch", ...)`.
     - Cập nhật thông số trực tiếp lên **Bộ Hiệu Chuẩn Cảm Ứng & Radar** để người dùng thấy ngay hiệu quả bám tâm thay đổi theo patch vừa nạp!
     - Tự động bổ sung các khóa patch này vào tệp `.mobileconfig` khi người dùng bấm tải cấu hình về máy.

### Nhiệm Vụ 2: Gia Tăng Tác Dụng Thực Tế Nhờ Chứng Chỉ Tin Cậy
- Thêm cơ chế kích hoạt **High-Priority Touch Acceleration Loop**:
  - Đăng ký bộ lắng nghe cảm ứng nhanh trên Safari/WebKit: `{ passive: false, capture: true }`.
  - Giảm thiểu triệt để 300ms click delay của Safari trên iOS bằng thuộc tính `touch-action: manipulation`.
  - Tích hợp hướng dẫn trực quan dạng bước (Step-by-Step Badge) chỉ dẫn người dùng cách:
    * Bước 1: Cài đặt hồ sơ cấu hình đã tải về trong Cài đặt iPhone.
    * Bước 2: Vào *Cài đặt > Cài đặt chung > Giới thiệu > Cài đặt tin cậy chứng chỉ* để bật xanh cho **Thanox VIP Root CA Certificate**.
    * Bước 3: Quay lại app, bấm nút **"XÁC THỰC CHỨNG CHỈ"** để kích hoạt trạng thái `100% HOẠT ĐỘNG`.

### Nhiệm Vụ 3: Rà Soát Lỗi & Tinh Chỉnh (Bug Audit)
- Kiểm tra toàn bộ các nút bấm, modal, đóng mở mượt mà bằng nút [X] và chạm nền đen.
- Kiểm tra danh sách 34 dòng máy: đảm bảo khi chọn bất kỳ dòng máy nào (từ iPhone 6 đến 16 Pro Max), thông số 6 ô Telemetry thay đổi tức thì và file `.mobileconfig` tải về khớp đúng với dòng máy đó.

---

## 🛠️ 4. BẢNG THAM CHIẾU CÁC HÀM VÀ THUẬT TOÁN ĐANG CHẠY TRONG `index.html`

| Tên Đối Tượng / Hàm | Chức Năng | Tệp Gốc Tham Chiếu |
| :--- | :--- | :--- |
| `DEVICE_HARDWARE_PROFILES` | Từ điển 34 dòng máy iPhone | `Full Device Model Pixel Prime.zip` |
| `CODES_100_LIST` | Danh sách 100 mã can thiệp phần cứng | `100 Code .com New (1).txt` |
| `HeadLockEngine` | Thuật toán khóa tâm từ trường (`trackGain: 0.42, lockGain: 0.58`) | `BÁM ĐẦU.txt` |
| `SoftAimEngine` | Thuật toán làm êm và khử rung vi mô (`softness: 0.26`) | `Êm Tâm Súng.txt` |
| `AimAssistEngine` | Hệ thống hỗ trợ bám tâm theo bán kính (`radius: 65, strength: 0.35`) | `NHẸ TÂM.txt` |
| `EffectAmplifierX10Engine` | Bộ khuếch đại độ nhạy 10X (`gain: 10.0`) | `Tối Ưu Sensi.txt` |
| `initRadarArena()` | Bộ mô phỏng cảm ứng & radar bám tâm trực quan trên canvas | Tích hợp trực tiếp |
| `downloadDeviceMobileConfig()` | Xuất file `.mobileconfig` động nhúng Root CA + Profile máy | `Thanox.mobileconfig` |
| `injectAll100Codes()` | Biên dịch và nạp 100 mã vào RAM với terminal ảo | Tích hợp trực tiếp |
