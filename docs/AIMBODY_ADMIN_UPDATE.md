# QUY TRÌNH CẬP NHẬT GÓI AIM BODY (.3105) QUA GIAO DIỆN QUẢN TRỊ ADMIN
## HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN & NHÀ PHÁT TRIỂN (KHÔNG CẦN BUILD LẠI APP)

Tài liệu này hướng dẫn chi tiết toàn bộ chu trình phát hành phiên bản mới của module **AIM BODY** cho 2 phiên bản game **Free Fire Thường** và **Free Fire MAX** bằng tệp định dạng `.3105`. Với kiến trúc mới, toàn bộ quá trình cập nhật diễn ra thông qua giao diện quản trị mà **hoàn toàn không cần chạm vào mã nguồn hay biên dịch lại ứng dụng Thanox iOS**.

---

## 1. Tổng Quan Chu Trình Phát Hành (Release Pipeline)

```
[1. Chuẩn bị tệp .3105]
          │
          ▼
[2. Mở Admin Panel (Mã VIP: THANOX-VIP-2026)]
          │
          ▼
[3. Chuyển sang Tab: Quản Lý AIMBODY (.3105 OTA)]
          │
          ▼
[4. Chọn phân hệ game: FFTH hoặc FFMAX]
          │
          ▼
[5. Chọn tệp .3105 & Nhập số phiên bản (vd: 1.1.0)]
          │
          ▼
[6. Hệ thống tự động Thẩm Định Tính Toàn Vẹn (Validation)]
          ├─► Thất bại: Báo lỗi cụ thể (Sai Magic, sai Container, lỗi băm SHA-256)
          └─► Thành công: Lưu trữ bất biến ở trạng thái [READY]
          │
          ▼
[7. Quản trị viên bấm [PUBLISH]]
          │
          ▼
[8. Kích hoạt nguyên tử (Atomic Switch)]:
    - Bản mới trở thành [CURRENT ACTIVE]
    - Bản cũ được chuyển sang [ARCHIVED / ROLLBACK READY]
    - App Client cập nhật ngay lập tức mà không cần tải lại trang
```

---

## 2. Các Bước Thực Hiện Chi Tiết

### Bước 1: Mở Bảng Điều Khiển Quản Trị
1. Nhấn vào biểu tượng vương miện trên thanh điều hướng hoặc nút **QUẢN TRỊ VIÊN** trong tab Cài Đặt Cá Nhân.
2. Nhập mã kích hoạt quyền Master Admin:
   ```
   THANOX-VIP-2026
   ```
3. Sau khi xác thực thành công, cửa sổ Modal Quản Trị sẽ xuất hiện.

### Bước 2: Truy Cập Phân Hệ Quản Lý AIMBODY (.3105 OTA)
1. Trong cửa sổ Quản Trị, nhấn chọn tab **📦 QUẢN LÝ AIMBODY (.3105 OTA)**.
2. Chọn loại game muốn cập nhật:
   - **🔥 Free Fire Thường (FFTH)**: Áp dụng cho phiên bản game tiêu chuẩn `com.dts.freefireth`.
   - **⚡ Free Fire MAX (FFMAX)**: Áp dụng cho phiên bản game ProMotion đồ họa cao `com.dts.freefiremax`.

### Bước 3: Tải Lên và Thẩm Định Tệp Bản Vá
1. Tại khu vực **Tải Lên Bản .3105 Mới**:
   - Nhấn nút **[Chọn tệp .3105]** và trỏ đến tệp bản vá nhị phân vừa trích xuất (ví dụ: `FFTH AIMBODY.3105` hoặc `FFMAX AIMBODY.3105`).
   - Nhập chuỗi phiên bản ngữ nghĩa (Semantic Versioning), ví dụ: `1.1.0` hoặc `1.0.1`.
   - Nhập ghi chú phát hành ngắn gọn (Release Notes), ví dụ: *Cập nhật thuật toán ghim ngực chống giật OB53 mới*.
2. Nhấn nút **[🔍 KIỂM TRA & NẠP GÓI .3105]**.
3. Hệ thống sẽ tự động thực thi chuỗi kiểm định client-side:
   - **Kiểm tra Header Magic**: Xác thực chuỗi 10 bytes đầu tiên chính xác là `3105PATCH\0`.
   - **Kiểm tra Container**: Xác thực định dạng Apple Binary Property List (`bplist00`).
   - **Trích xuất Metadata**: Lấy `packageID`, `schemaVersion`, `publicContentKey`, `keyFingerprint`.
   - **Xác thực mã băm khóa**: Tính toán `SHA-256(publicContentKey)` và đối chiếu với `keyFingerprint`.
   - **Tính toán hàm băm toàn vẹn**: Tạo mã băm SHA-256 của toàn bộ tệp nhị phân.
4. Nếu tất cả các chỉ số đều đạt (Hiển thị 4 tích xanh), gói sẽ được lưu vào kho lưu trữ với trạng thái **`READY`**.

### Bước 4: Phát Hành Bản Mới (Atomic Publish)
1. Trong bảng **Lịch Sử Phiên Bản (Version History Table)** bên dưới, tìm hàng chứa phiên bản vừa nạp (đang có nhãn màu vàng `READY`).
2. Nhấn nút **[🚀 PUBLISH]**.
3. Hệ thống thực hiện chuyển đổi con trỏ nguyên tử:
   - Phiên bản được chọn chuyển sang trạng thái xanh neon **`PUBLISHED - ACTIVE`**.
   - Phiên bản đang chạy trước đó tự động lưu thành mục tiêu dự phòng (Rollback Target).
   - Thẻ thông tin phiên bản trên đầu lập tức cập nhật thông số của bản mới.
4. Lúc này, người dùng mở mục **AIM BODY** trong game sẽ thấy ngay nhãn phiên bản mới (ví dụ: `FFTH AIMBODY v1.1.0 • 3105 Active`) mà không hề xảy ra gián đoạn.

---

## 3. Quản Lý Phiên Bản Bất Biến & Không Cần Build Lại App

### Tại sao App Core không bao giờ phải build lại?
- **Khởi tạo động**: Khi ứng dụng khởi chạy hoặc khi chuyển đổi giữa các tựa game, `AimBodyRuntime` truy vấn con trỏ phiên bản hiện hành thông qua `AimBodyPackageManager`.
- **Dữ liệu cấu hình độc lập**: Toàn bộ tham số bù trừ tọa độ, bán kính khóa và hệ số giảm giật được giải mã trực tiếp từ payload của gói `.3105` được active, không hề phụ thuộc vào các hằng số tĩnh trong mã HTML/JS.
- **Lưu trữ phiên bản bất biến (Immutable Storage)**: Mỗi tệp `.3105` được định danh duy nhất theo cấu trúc `loại_game/phiên_bản`. Một khi đã được lưu, nội dung gói không bị sửa đổi, đảm bảo tính toàn vẹn 100%.

---

## 4. Bảng Kiểm Thẩm Định Lỗi Thường Gặp (Troubleshooting)

| Triệu chứng lỗi | Nguyên nhân | Biện pháp xử lý |
| :--- | :--- | :--- |
| *Lỗi Magic Header (Sai định dạng)* | Tệp không phải bản vá `.3105` hoặc bị thiếu 10 bytes đầu. | Đảm bảo tệp bắt đầu bằng chuỗi nhị phân `3105PATCH\x00`. |
| *Lỗi Container bplist00* | Tệp bị giải mã sai hoặc hỏng cấu trúc Binary Plist. | Trích xuất lại từ container gốc. |
| *Key Fingerprint Mismatch* | Khóa công khai bị chỉnh sửa hoặc giả mạo. | Kiểm tra lại tính toàn vẹn của tệp nguồn. |
| *Trùng lặp phiên bản đã có* | Số phiên bản đã tồn tại trong kho lưu trữ. | Tăng số hiệu phiên bản lên theo chuẩn SemVer (ví dụ từ `1.0.0` lên `1.1.0`). |
