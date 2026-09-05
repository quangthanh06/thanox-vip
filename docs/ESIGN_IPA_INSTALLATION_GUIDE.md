# HƯỚNG DẪN CÀI ĐẶT THANOX VIP IPA QUA ESIGN & CƠ CHẾ BẢO VỆ CHỐNG CRACK

Tài liệu này cung cấp hướng dẫn chi tiết quy trình ký và cài đặt tệp ứng dụng **`ThanoxVIP.ipa`** trực tiếp lên iPhone thông qua công cụ **ESign** (hoặc Scarlet, TrollStore, AltStore, Gbox) mà **không cần URL web**, hoạt động **ngoại tuyến 100%**.

---

## 1. THÔNG TIN GÓI CÀI ĐẶT IPA

* **Tên tệp**: `ThanoxVIP.ipa`
* **Vị trí lưu trữ**:
  - `c:\Users\Admin\Downloads\ANTIGRAVITY VIP\ThanoxVIP.ipa`
  - Thư mục `dist/` trong source code: `Thanox_iOS_App/dist/ThanoxVIP.ipa`
* **Bundle Identifier / AppID**: `com.apple.mobile.MobileHouseArrest`
* **Tên hiển thị trên iPhone**: `Thanox VIP`
* **Biểu tượng**: Flork Ruby Neon Edition
* **Kiến trúc nhị phân**: Apple ARM64 Mach-O
* **Hỗ trợ thiết bị**: iPhone 11, 12, 13, 14, 15, 16 Series (iOS 15.0 - iOS 18+)
* **Tần số quét màn hình**: Tối ưu hóa 120Hz ProMotion mượt mà tối đa

---

## 2. HỆ THỐNG LÁ CHẮN BẢO VỆ CHỐNG CRACK NATIVE (ANTI-CRACK SHIELD)

Gói IPA này được tích hợp 5 lớp bảo mật cấp độ nhị phân nhằm ngăn chặn triệt để hành vi giải nén trích xuất mã nguồn hoặc can thiệp bộ nhớ:

1. **Mã Hóa Tài Nguyên Nhị Phân Trong RAM (In-Memory AES-256-CBC Decryption)**:
   - Toàn bộ giao diện `index.html`, Javascript, cấu hình và thuật toán `.3105` được đóng gói thành tệp mã hóa nhị phân `assets.enc` (1.87 MB).
   - Kẻ bẻ khóa khi dùng WinRAR / 7-Zip giải nén file `.ipa` chỉ thấy các khối nhị phân mã hóa ngẫu nhiên, hoàn toàn không thể xem hoặc sửa code.
   - Khi chạy trên iPhone, bộ nạp `LocalSchemeHandler` sẽ giải mã trực tiếp trong bộ nhớ RAM, **tuyệt đối không ghi file đã giải mã ra bộ nhớ máy**.
2. **Lá Chắn Chống Trình Gỡ Lỗi (Anti-Ptrace / PT_DENY_ATTACH)**:
   - Hàm `main()` kích hoạt cơ chế từ chối `ptrace`. Bất kỳ công cụ debug nào (LLDB, GDB) cố gắng kết nối vào ứng dụng sẽ bị ngắt kết nối ngay tức khắc.
3. **Phát Hiện Trạng Thái Debug Từ Xa (`sysctl P_TRACED`)**:
   - Quét cờ hạt nhân `P_TRACED` liên tục trong suốt vòng đời ứng dụng để phát hiện việc gắn dò từ máy tính.
4. **Chống Tiêm Dylib & Can Thiệp Bộ Nhớ (Anti-Hook & Anti-Frida)**:
   - Quét danh sách Dynamic Libraries (`_dyld_image_count`) để phát hiện các thư viện can thiệp như `FridaGadget`, `CydiaSubstrate`, `Substitute`, `ElleKit`, `Shadow`, `CheatEngine`, `GameGem`.
   - Quét socket nội bộ cổng `27042` (Frida Server). Nếu phát hiện, tiến trình tự hủy ngay lập tức (`abort()`).
5. **Vô Hiệu Hóa Web Inspector**:
   - Khóa tính năng Safari Web Inspector trên iOS 16.4+ để ngăn chặn việc cắm cáp vào máy tính Mac để xem DOM hoặc console log.

---

## 3. CÁC BƯỚC CÀI ĐẶT VÀO IPHONE BẰNG ESIGN

### Bước 1: Chuyển file IPA vào iPhone
Bạn có thể chuyển file `ThanoxVIP.ipa` vào iPhone bằng một trong các cách:
* **AirDrop**: Nếu có máy tính Mac, chỉ cần bấm chuột phải chọn AirDrop sang iPhone.
* **Gửi qua Telegram / Google Drive / iCloud Drive / Zalo**: Tải file lên và mở ứng dụng Tệp (Files) trên iPhone để lưu về máy.
* **Tải từ mục Releases trên GitHub**: Kho lưu trữ đã được thiết lập GitHub Actions tự động build mỗi khi push code.

### Bước 2: Nhập vào ứng dụng ESign
1. Mở app **ESign** trên iPhone.
2. Nhấn vào biểu tượng dấu **Ba chấm (...)** hoặc **Dấu cộng (+)** ở góc trên bên phải màn hình $ightarrow$ Chọn **Nhập tệp (Import)**.
3. Tìm và chọn tệp `ThanoxVIP.ipa` đã lưu trong ứng dụng Tệp (Files).
4. File sẽ xuất hiện trong danh sách Quản lý tệp của ESign.

### Bước 3: Ký chứng chỉ Apple (Signing)
1. Trong ESign, chạm vào tệp `ThanoxVIP.ipa`.
2. Chọn mục **Ký (Signature)** trong bảng menu hiện lên.
3. Tại giao diện Ký:
   - **Tên ứng dụng**: Để mặc định `Thanox VIP`.
   - **Bundle ID / AppID**: `com.apple.mobile.MobileHouseArrest`.
   - **Chứng chỉ**: Chọn Chứng chỉ Doanh nghiệp (Enterprise) hoặc Chứng chỉ Cá nhân P12 kèm file Mobileprovision của bạn đã import sẵn trong ESign.
4. Nhấn nút **Ký** màu xanh ở dưới cùng. ESign sẽ tiến hành phân tích gói, nhúng chữ ký Apple và đóng gói lại trong 5-10 giây.

### Bước 4: Cài đặt lên màn hình chính
1. Sau khi ký xong, ESign sẽ hiển thị thông báo thành công cùng nút **Cài đặt (Install)**.
2. Nhấn **Cài đặt** $ightarrow$ Chọn **Cài đặt** trong hộp thoại xác nhận của iOS.
3. Trở về Màn hình chính của iPhone: Biểu tượng app **Thanox VIP** (Flork Ruby Neon) sẽ xuất hiện và cài đặt hoàn tất.
4. *Lưu ý (nếu dùng chứng chỉ Doanh nghiệp lần đầu)*: Vào `Cài đặt` trên iPhone $ightarrow$ `Cài đặt chung` $ightarrow$ `Quản lý VPN & Thiết bị` $ightarrow$ Chạm vào tên chứng chỉ $ightarrow$ Chọn **Tin cậy (Trust)**.

---

## 4. TỰ ĐỘNG HÓA BUILD IPA QUA GITHUB ACTIONS

Dự án đã được trang bị tệp cấu hình CI/CD tại [`.github/workflows/build_ipa.yml`](file:///c:/Users/Admin/Downloads/ANTIGRAVITY%20VIP/Thanox_iOS_App/.github/workflows/build_ipa.yml):
* Mỗi khi bạn push code mới lên nhánh `main`, máy chủ Apple Silicon (`macos-14`) của GitHub sẽ tự động:
  1. Nạp và mã hóa toàn bộ tài nguyên web + bản vá `.3105`.
  2. Dùng trình biên dịch chính thức `xcodebuild` của Apple để build mã nhị phân Mach-O ARM64 native.
  3. Đóng gói ra file `ThanoxVIP_v1.0.0_Offline_Protected.ipa`.
  4. Đính kèm tệp IPA vào mục **GitHub Releases** và **Artifacts** để bạn tải về trực tiếp từ Safari trên iPhone mà không cần dùng máy tính.
