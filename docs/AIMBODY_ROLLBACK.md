# QUY TRÌNH & CƠ CHẾ HOÀN TÁC KHẨN CẤP (INSTANT ROLLBACK SPECIFICATION)
## CƠ CHẾ BẢO VỆ PHỤC HỒI NGUYÊN TỬ CHO THUẬT TOÁN AIM BODY

Tài liệu này đặc tả quy trình và kiến trúc bảo vệ khôi phục khẩn cấp (**Rollback System**) trong trường hợp một bản cập nhật AIM BODY mới (`.3105`) được phát hành nhưng xảy ra tình trạng không tương thích trên thiết bị thực tế hoặc bị nhà phát hành game vá lỗi (hotfix).

---

## 1. Nguyên Lý Thiết Kế Con Trỏ Nguyên Tử (Atomic Pointer Swapping)

Hệ thống quản lý phiên bản AIM BODY của Thanox iOS sử dụng mô hình **Con trỏ phiên bản phân ly (Decoupled Version Pointers)**:

```
[Kho Lưu Trữ Bất Biến (Immutable Storage)]
  ├── FFTH/1.0.0 (Bản gốc đã được kiểm chứng hoạt động 100%)
  ├── FFTH/1.1.0 (Bản cập nhật vừa phát hành)
  └── FFTH/1.2.0 (Bản thử nghiệm)

[Con Trỏ Trạng Thái Hệ Thống]
  ├── CURRENT_ACTIVE  ────────► [FFTH / 1.1.0]
  └── PREVIOUS_ACTIVE ────────► [FFTH / 1.0.0]  <── Điểm tựa hoàn tác tức thì
```

- **Tính bất biến (Immutability)**: Khi bản mới `1.1.0` được cài đặt, bản cũ `1.0.0` không hề bị xóa hay ghi đè. Toàn bộ mã nhị phân, cấu hình tham số và mã băm SHA-256 của bản `1.0.0` vẫn được lưu trữ nguyên vẹn trong kho.
- **Hoán đổi con trỏ trong 1 chu kỳ vi lệnh (Zero Downtime)**: Thao tác Rollback chỉ đơn thuần thay đổi giá trị của con trỏ `CURRENT_ACTIVE` trỏ ngược lại `PREVIOUS_ACTIVE`.
- **Không yêu cầu tải lại ứng dụng**: Bộ điều vận `AimBodyRuntime` lập tức giải phóng instance của phiên bản lỗi và tái khởi động với dữ liệu của phiên bản ổn định.

---

## 2. Thao Tác Hoàn Tác 1-Click Trong Giao Diện Quản Trị

Khi phát hiện phiên bản mới gặp sự cố:

1. Quản trị viên mở cửa sổ **Quản Trị** (`THANOX-VIP-2026`).
2. Chuyển sang tab **📦 QUẢN LÝ AIMBODY (.3105 OTA)**.
3. Chọn loại game đang gặp sự cố (`FFTH` hoặc `FFMAX`).
4. Nhấn nút **[⏪ HOÀN TÁC VỀ BẢN CŨ (ROLLBACK)]** màu cam ở trên đầu bảng lịch sử.
   *(Hoặc tại bảng lịch sử phiên bản bên dưới, tìm phiên bản ổn định trước đó và nhấn nút **[Rollback]** trực tiếp trên hàng đó)*.
5. Hộp thoại xác nhận xuất hiện:
   > *"Bạn có chắc chắn muốn hoàn tác từ phiên bản hiện tại về phiên bản trước đó hay không?"*
6. Nhấn xác nhận. Hệ thống hoàn tất quá trình đảo con trỏ trong thời gian dưới **50 mili-giây**.
7. Thông báo thành công hiển thị:
   > *"✓ Đã hoàn tác thành công về phiên bản an toàn!"*

---

## 3. Cơ Chế Tự Động Phục Hồi Khi Ngoại Tuyến (Offline Self-Healing)

Trong trường hợp người dùng sử dụng ứng dụng khi không có mạng Internet hoặc kết nối máy chủ bị gián đoạn:

1. **Bộ Đệm Cục Bộ (LocalStorage & IndexedDB)**: Con trỏ phiên bản và gói nhị phân đã được lưu cục bộ trên thiết bị iOS của người dùng. Ứng dụng vẫn hoạt động bình thường 100%.
2. **Khởi Tạo Gốc Dự Phòng (Fallback Seed)**:
   - Trong App Core luôn tích hợp sẵn định danh và tham số của 2 bản gốc khởi tạo:
     - `FFTH v1.0.0` (Package ID: `4A9F3CCD-BA1B-47A3-A1DF-A803C2D97639`)
     - `FFMAX v1.0.0` (Package ID: `454A5B9B-3C77-4DF2-9B7B-8D1718A178CA`)
   - Nếu xảy ra lỗi nghiêm trọng khiến kho lưu trữ cục bộ bị hỏng hoặc dữ liệu tệp mới không đọc được, `AimBodyRuntime` tự động kích hoạt chế độ **Fail-Safe Fallback**, phục hồi con trỏ về bản `v1.0.0` gốc để đảm bảo ứng dụng không bao giờ bị văng (crash) hay ngừng hoạt động.

---

## 4. Ma Trận Xử Lý Sự Cố Khẩn Cấp (Incident Response Matrix)

| Tình huống sự cố | Thời gian phản ứng | Phương án giải quyết |
| :--- | :--- | :--- |
| Game cập nhật bản vá chống ghim tâm | Dưới 1 phút | Admin nhấn nút [Rollback] trên giao diện để đưa toàn bộ hệ thống về bản an toàn trước đó. |
| Bản .3105 mới nạp bị lỗi cấu trúc | Ngay tại khâu Upload | Bộ thẩm định tự động từ chối gói, không cho phép chuyển trạng thái sang READY. |
| Người dùng xóa bộ nhớ trình duyệt Safari | Tức thì | Hệ thống tự động nạp lại bản seed v1.0.0 và đồng bộ từ manifest máy chủ. |
