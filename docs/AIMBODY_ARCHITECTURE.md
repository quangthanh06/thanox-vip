# KIẾN TRÚC HỆ THỐNG AIM BODY RUNTIME & PACKAGE MANAGER
## THANOX VIP IOS ENGINE — GIẢI MÃ & TÍCH HỢP ĐỘC QUYỀN

Tài liệu đặc tả kiến trúc kỹ thuật toàn diện cho module **AIM BODY Runtime** và **AimBody Package Manager**. Hệ thống này được thiết kế theo nguyên lý **Decoupled Engine Lifecycle** (Vòng đời tách biệt hoàn toàn giữa App Core và Thuật toán can thiệp), đảm bảo **App Core của Thanox iOS không bao giờ phải build lại hay deploy lại mỗi khi có bản cập nhật AIM BODY (.3105) mới**.

---

## 1. Mục Tiêu & Nguyên Lý Thiết Kế

1. **Decoupled Architecture (Tách rời lõi ứng dụng)**:
   - App Core đóng vai trò là Host Runtime & Shell giao diện Liquid Glass Ruby Neon.
   - Logic can thiệp tọa độ, khử rung, đầm tâm và bù offset thân nằm hoàn toàn trong các gói nhị phân `.3105`.
   - Không hard-code các thông số phiên bản vào mã nguồn app.
2. **Zero-Rebuild OTA Updates**:
   - Khi có bản vá game mới (OB53, OB54...), Admin chỉ cần tải tệp `.3105` mới lên qua giao diện Quản Trị.
   - Hệ thống tự động thẩm định (validation) tính toàn vẹn và hợp lệ, đưa vào kho lưu trữ bất biến (Immutable Version Storage).
   - Khi Admin kích hoạt (Publish), App Core tức thì chuyển đổi con trỏ sang bản mới trong thời gian thực mà không cần reload trang hay biên dịch lại mã nguồn.
3. **Phân Tách Rõ Ràng Giữa 2 Phiên Bản Game**:
   - **Free Fire Thường (`com.dts.freefireth`)**: Sử dụng phân hệ gói **`FFTH AIMBODY`**.
   - **Free Fire MAX (`com.dts.freefiremax`)**: Sử dụng phân hệ gói **`FFMAX AIMBODY`**.
4. **An Toàn Tuyệt Đối & Khôi Phục Tức Thì (Instant Rollback)**:
   - Mọi phiên bản được lưu trữ bất biến kèm mã băm SHA-256 xác thực.
   - Con trỏ phiên bản trước đó (`previous_active`) luôn được bảo lưu để rollback chỉ với 1 click nếu bản mới có lỗi.

---

## 2. Sơ Đồ Kiến Trúc Hệ Thống (System Architecture)

```
+-------------------------------------------------------------------------+
|                           THANOX IOS APP CORE                           |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |                   GIAO DIỆN NGƯỜI DÙNG (UI)                      |   |
|   |  - Tab Game VIP: Free Fire Thường vs Free Fire MAX              |   |
|   |  - Switch 4: AIM BODY [Hiển thị Version Active động]            |   |
|   |  - Touch Calibration Arena (Radar mô phỏng thời gian thực)       |   |
|   +-----------------------------------------------------------------+   |
|                                    |                                    |
|                                    v                                    |
|   +-----------------------------------------------------------------+   |
|   |                     AIM BODY RUNTIME HOST                       |   |
|   |  - Interface chuẩn hóa: load, init, process, shutdown           |   |
|   |  - Tính toán độ lệch tâm ngực/thân (Y-Offset Compensation)      |   |
|   |  - Khử rung nòng súng & kẹp đường đạn vi điểm                    |   |
|   |  - Điều phối theo tần số quét màn hình (60Hz / 120Hz / 240Hz)   |   |
|   +-----------------------------------------------------------------+   |
|                                    ^                                    |
|                                    | (Load Active Package)              |
|   +-----------------------------------------------------------------+   |
|   |                   AIM BODY PACKAGE MANAGER                      |   |
|   |  - Con trỏ phiên bản: active_ffth / active_ffmax                |   |
|   |  - Kho lưu trữ cục bộ: IndexedDB & LocalStorage Database        |   |
|   |  - Đồng bộ OTA Manifest từ Server Backend                       |   |
|   +-----------------------------------------------------------------+   |
+-------------------------------------------------------------------------+
                                     ^
                                     | (OTA Publish & Manifest Sync)
+-------------------------------------------------------------------------+
|                        ADMIN MANAGEMENT SUBSYSTEM                       |
|                                                                         |
|   - Form Upload file .3105 mới qua giao diện Admin                      |
|   - Bộ thẩm định tệp nhị phân client-side (Magic, Container, SHA-256)   |
|   - Cơ chế phát hành Atomic Release: DRAFT -> READY -> PUBLISHED        |
|   - Nút hoàn tác khẩn cấp 1-Click Rollback                              |
+-------------------------------------------------------------------------+
```

---

## 3. Đặc Tả Giao Tiếp Module (Module Interface Specifications)

### 3.1. Hợp Đồng Giao Diện `AimBodyRuntime`
Module `AimBodyRuntime` cung cấp các phương thức chuẩn hóa độc lập với phiên bản cụ thể:

```javascript
const AimBodyRuntime = {
  // Nạp dữ liệu gói nhị phân vào bộ nhớ RAM
  loadPackage(gameKey, packageMetadata, payloadBuffer),

  // Khởi tạo trạng thái bộ tính toán cho phiên bản game tương ứng
  initialize(gameKey),

  // Xử lý tọa độ cảm ứng và tính toán lực hút ghim tâm thân
  process(gameKey, curX, curY, targetX, targetY),

  // Trích xuất thông số cấu hình hoạt động hiện hành
  getConfig(gameKey),

  // Truy vấn phiên bản đang hoạt động
  getVersion(gameKey),

  // Kiểm tra tính tương thích phần cứng và phiên bản hệ điều hành
  isCompatible(gameKey),

  // Đóng bộ xử lý và giải phóng tài nguyên
  shutdown(gameKey),

  // Lấy trạng thái giám sát chi tiết
  getStatus(gameKey)
};
```

### 3.2. Hợp Đồng Giao Diện `AimBodyPackageManager`
Module `AimBodyPackageManager` chịu trách nhiệm quản lý vòng đời và lưu trữ các gói:

```javascript
const AimBodyPackageManager = {
  // Khởi tạo CSDL gói và nạp các bản ghi v1.0.0 khởi tạo gốc
  initDatabase(),

  // Thẩm định tệp .3105 upload (Magic 3105PATCH\0, bplist00, SHA-256)
  validatePackage(fileBuffer, fileName),

  // Lưu trữ gói mới vào kho phiên bản bất biến (Trạng thái READY)
  registerNewVersion(gameType, version, metadata, rawBytes, notes),

  // Phát hành phiên bản thành CURRENT ACTIVE
  publishVersion(gameType, version),

  // Hoàn tác về phiên bản trước đó
  rollbackVersion(gameType),

  // Lấy thông tin phiên bản đang active cho một game
  getActivePackage(gameType),

  // Lấy danh sách lịch sử tất cả các phiên bản
  getVersionHistory(gameType),

  // Đồng bộ trạng thái từ Server Manifest (nếu có kết nối mạng)
  syncFromRemoteServer()
};
```

---

## 4. Phân Định Hành Vi Giữa Free Fire Thường & Free Fire MAX

| Tiêu chí | Free Fire Thường (`FFTH`) | Free Fire MAX (`FFMAX`) |
| :--- | :--- | :--- |
| **Tên Gói Chuẩn** | `FFTH AIMBODY.3105` | `FFMAX AIMBODY.3105` |
| **Package ID** | `4A9F3CCD-BA1B-47A3-A1DF-A803C2D97639` | `454A5B9B-3C77-4DF2-9B7B-8D1718A178CA` |
| **Target App Bundle** | `com.dts.freefireth` | `com.dts.freefiremax` |
| **Dung Lượng Gói Gốc** | 63,981 bytes | 63,984 bytes |
| **Mã Băm SHA-256 Tệp Gốc** | `a6b68ca50ab4a1b4fa959ac5355050b41a08a1a9fd87c26898313ba9d6a88608` | `53c7f8848bd6fae9a46524f4abdb230a5c3d93552daff944ed1c7ed55e2c628d` |
| **Tâm Khóa Trọng Điểm** | Thân / Ngực (Tỉ lệ bù Y: `0.68f`) | Thân / Ngực Đồ Họa Cao (Tỉ lệ bù Y: `0.72f`) |
| **Bán Kính Bám Mục Tiêu** | 58px (Tối ưu vuốt nhẹ mượt) | 64px (Tối ưu màn hình độ phân giải siêu nét) |
| **Trọng Số Giảm Rung** | 0.76 (Khử giật súng tiêu chuẩn) | 0.84 (Khử phân tán đạn hạt và hiệu ứng bloom) |
| **Độ Nhạy Phản Hồi** | Tần số quét 60Hz - 120Hz | Tần số quét ProMotion 120Hz - 240Hz |

---

## 5. Tích Hợp Vào Giao Diện App

1. **Công tắc Switch 4 (`AIM BODY`)**:
   - Khi người dùng chuyển game trong Tab Game VIP:
     - Nếu chọn `Free Fire` -> Switch AIM BODY hiển thị nhãn: `FFTH AIMBODY v1.0.0 • 3105 Active`.
     - Nếu chọn `Free Fire MAX` -> Switch AIM BODY hiển thị nhãn: `FFMAX AIMBODY v1.0.0 • 3105 Active`.
   - Khi bật công tắc, hệ thống kích hoạt `AimBodyRuntime` tương ứng, cập nhật mục tiêu của Touch Arena sang tọa độ thân (`radarTargetBody`).
2. **Cơ Chế Khóa Đơn Nhất (Mutual Exclusion)**:
   - Nhằm đạt độ ổn định cao nhất, khi Switch AIM BODY được bật, các switch khác tự động chuyển về trạng thái tắt để đảm bảo tài nguyên xử lý dồn 100% vào thuật toán khóa thân.
