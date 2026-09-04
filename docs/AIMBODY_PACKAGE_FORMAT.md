# BÁO CÁO KỸ THUẬT DỊCH NGƯỢC ĐỊNH DẠNG TỆP .3105 (PACKAGE SPECIFICATION)
## CẤU TRÚC CONTAINER NHỊ PHÂN, METADATA & BẢO MẬT MÃ HÓA

Tài liệu này trình bày chi tiết kết quả phân tích dịch ngược nhị phân (Reverse Engineering) cấu trúc định dạng tệp bản vá `.3105` từ 2 tệp thực tế trong dự án: **`FFTH AIMBODY.3105`** và **`FFMAX AIMBODY.3105`**.

---

## 1. Cấu Trúc Tổng Thể Tệp .3105 (File Layout)

Tệp `.3105` sử dụng cấu trúc đóng gói lai (Hybrid Encapsulated Container) gồm 2 phần liên tiếp:

```
+-------------------------------------------------------------------------+
| OFFSET 0x00 .. 0x09 (10 Bytes): MAGIC HEADER                           |
| ASCII: "3105PATCH\0"  (0x33 0x31 0x30 0x35 0x50 0x41 0x54 0x43 0x48 0x00)|
+-------------------------------------------------------------------------+
| OFFSET 0x0A .. END: APPLE BINARY PROPERTY LIST CONTAINER                |
| Magic nội bộ: "bplist00" (0x62 0x70 0x6C 0x69 0x73 0x74 0x30 0x30)     |
| Cấu trúc: Từ điển gốc (Root Dictionary) chuẩn Apple Foundation          |
| Chứa các trường Metadata, Khóa xác thực, Dấu vân tay và Encrypted Payload|
+-------------------------------------------------------------------------+
```

---

## 2. Từ Điển Siêu Dữ Liệu Gốc (Root Dictionary Specification)

Bên trong container `bplist00`, từ điển gốc chứa 6 trường dữ liệu cốt lõi:

| Khóa (Key) | Kiểu dữ liệu | Ý nghĩa kỹ thuật |
| :--- | :--- | :--- |
| `schemaVersion` | `Integer` | Phiên bản định dạng đặc tả container (giá trị hiện tại: `1`). |
| `packageID` | `String (UUID)` | Mã định danh duy nhất toàn cầu của gói bản vá. |
| `isPasswordProtected` | `Boolean` | Cờ báo hiệu tệp có yêu cầu mật khẩu người dùng thứ cấp hay không (giá trị: `false`). |
| `publicContentKey` | `Data (32 bytes)` | Khóa công khai 256-bit dùng trong cơ chế xác thực và giải mã gói nội dung. |
| `keyFingerprint` | `Data (32 bytes)` | Dấu vân tay kiểm tra tính toàn vẹn toán học của khóa công khai. |
| `encryptedPayload` | `Data` | Khối dữ liệu nhị phân đã được mã hóa chứa logic can thiệp thuật toán ghim tâm thân. |

---

## 3. Xác Thực Toán Học Toàn Vẹn Khóa (Cryptographic Verification)

Một phát hiện then chốt trong quá trình dịch ngược định dạng tệp là **mối liên hệ toán học chặt chẽ giữa `publicContentKey` và `keyFingerprint`**:

$$\text{keyFingerprint} = \text{SHA-256}(\text{publicContentKey})$$

Hệ thống thẩm định của Thanox iOS tự động tính toán mã băm SHA-256 trên 32 bytes của `publicContentKey` và so sánh trực tiếp với 32 bytes của `keyFingerprint`. Nếu kết quả không trùng khớp từng bit, tệp bị từ chối ngay lập tức để ngăn ngừa can thiệp giả mạo.

---

## 4. Bảng So Sánh Chi Tiết 2 Gói Gốc

### 4.1. Gói `FFTH AIMBODY.3105` (Dành cho Free Fire Thường)
- **Tên tệp gốc**: `FFTH AIMBODY.3105`
- **Kích thước tệp**: 63,981 bytes
- **Mã băm SHA-256 toàn bộ tệp**:
  `a6b68ca50ab4a1b4fa959ac5355050b41a08a1a9fd87c26898313ba9d6a88608`
- **Mã định danh Package ID**:
  `4A9F3CCD-BA1B-47A3-A1DF-A803C2D97639`
- **Khóa Public Content Key (Hex 32 bytes)**:
  `e067c29be657dbfcefd4a434c7c88b0bf16259e86ff6c4062e742880c5e7ae2a`
- **Dấu vân tay Key Fingerprint (Hex 32 bytes)**:
  `268305c1dbe2258908f51aa6c4c95a56d9670ebca71db907d995cb4d5a9d8cbb`
  *(Khớp 100% với SHA-256 của publicContentKey)*
- **Kích thước Encrypted Payload**: 63,677 bytes
- **Mã băm SHA-256 của Payload**:
  `645da5fe6127bf79ff8cfcae9cba0ee24660e5015b6d91f24950e3346b9dc317`
- **Độ hỗn loạn Entropy**: ~7.9972 bits/byte (Đặc trưng của khối dữ liệu được mã hóa mạnh theo chuẩn AES-GCM).

### 4.2. Gói `FFMAX AIMBODY.3105` (Dành cho Free Fire MAX)
- **Tên tệp gốc**: `FFMAX AIMBODY.3105`
- **Kích thước tệp**: 63,984 bytes
- **Mã băm SHA-256 toàn bộ tệp**:
  `53c7f8848bd6fae9a46524f4abdb230a5c3d93552daff944ed1c7ed55e2c628d`
- **Mã định danh Package ID**:
  `454A5B9B-3C77-4DF2-9B7B-8D1718A178CA`
- **Khóa Public Content Key (Hex 32 bytes)**:
  `f535d2d0954b819f7ab2d677a29e46a78280f96894563a6288339b1a51cae5e1`
- **Dấu vân tay Key Fingerprint (Hex 32 bytes)**:
  `c3ee7963d41e7552554e2c90c7eeb7cb0fa0bfa9318182747cf9ea62886bc54a`
  *(Khớp 100% với SHA-256 của publicContentKey)*
- **Kích thước Encrypted Payload**: 63,680 bytes
- **Mã băm SHA-256 của Payload**:
  `2ee054c8feea6e4b8bc418a0029b466144da605f23cf5dcbb748a044ecb7b9cb`
- **Độ hỗn loạn Entropy**: ~7.9971 bits/byte.

---

## 5. Quy Trình Phân Tích & Xác Thực Client-Side

Khi người dùng hoặc quản trị viên nạp tệp `.3105`, thuật toán thực hiện:

1. Đọc 10 bytes đầu tiên của `ArrayBuffer`:
   ```javascript
   const magic = new TextDecoder().decode(buffer.slice(0, 9));
   const nullByte = new Uint8Array(buffer.slice(9, 10))[0];
   if (magic !== "3105PATCH" || nullByte !== 0x00) {
     throw new Error("Không đúng Magic Header 3105PATCH\\0");
   }
   ```
2. Đọc 8 bytes tiếp theo bắt đầu từ offset `0x0A`:
   ```javascript
   const containerTag = new TextDecoder().decode(buffer.slice(10, 18));
   if (containerTag !== "bplist00") {
     throw new Error("Không đúng định dạng Apple bplist00");
   }
   ```
3. Trích xuất các chuỗi khóa công khai và vân tay, thực thi phép băm SHA-256 qua Web Crypto API (`crypto.subtle.digest("SHA-256", keyBytes)`).
4. Đối chiếu mã định danh `packageID` để tự động định tuyến gói về đúng phân hệ **Free Fire Thường** hoặc **Free Fire MAX**.
