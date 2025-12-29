# Sơ Đồ Liên Hệ Cơ Sở Dữ Liệu

## Tổng Quan

Cơ sở dữ liệu này được thiết kế cho một hệ thống Online Judge (OJ) - nền tảng luyện tập và thi đấu lập trình. Hệ thống bao gồm các chức năng chính: quản lý người dùng, đề bài, cuộc thi, nộp bài và chấm điểm tự động.

## Các Bảng Dữ Liệu

### 1. VaiTro (Vai Trò)
**Mục đích**: Quản lý các vai trò trong hệ thống (Admin, User, Moderator, ...)

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdVaiTro` | BIGINT (PK, AUTO_INCREMENT) | ID duy nhất của vai trò |
| `TenVaiTro` | VARCHAR(255) UNIQUE NOT NULL | Tên vai trò (ví dụ: Admin, User) |
| `MoTa` | TEXT | Mô tả về vai trò |

**Quan hệ**:
- Một vai trò có nhiều tài khoản (`TaiKhoan`)

---

### 2. TaiKhoan (Tài Khoản)
**Mục đích**: Lưu trữ thông tin người dùng trong hệ thống

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdTaiKhoan` | BIGINT (PK, AUTO_INCREMENT) | ID duy nhất của tài khoản |
| `IdVaiTro` | BIGINT NOT NULL (FK) | ID vai trò của tài khoản |
| `TenDangNhap` | VARCHAR(100) UNIQUE NOT NULL | Tên đăng nhập (username) |
| `MatKhau` | VARCHAR(255) NOT NULL | Mật khẩu (đã được hash) |
| `HoTen` | VARCHAR(50) NOT NULL | Họ và tên |
| `Email` | VARCHAR(255) UNIQUE NOT NULL | Email |
| `TrangThai` | BOOLEAN NOT NULL DEFAULT true | Trạng thái hoạt động |
| `NgayTao` | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | Ngày tạo tài khoản |

**Quan hệ**:
- Thuộc về một vai trò (`VaiTro`)
- Có thể tạo nhiều đề bài (`DeBai`)
- Có thể viết nhiều bình luận (`BinhLuan`)
- Có thể tạo nhiều cuộc thi (`CuocThi`)
- Có thể nộp nhiều bài (`BaiNop`)
- Có thể đăng ký nhiều cuộc thi (`CuocThi_DangKy`)

---

### 3. ChuDe (Chủ Đề)
**Mục đích**: Phân loại đề bài theo các chủ đề khác nhau (ví dụ: Dynamic Programming, Graph, String, ...)

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdChuDe` | BIGINT (PK, AUTO_INCREMENT) | ID duy nhất của chủ đề |
| `TenChuDe` | VARCHAR(255) UNIQUE NOT NULL | Tên chủ đề |
| `MoTa` | TEXT | Mô tả về chủ đề |

**Quan hệ**:
- Nhiều-nhiều với đề bài (`DeBai`) thông qua bảng trung gian `DeBai_ChuDe`

---

### 4. DeBai (Đề Bài)
**Mục đích**: Lưu trữ thông tin các bài tập lập trình

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdDeBai` | BIGINT (PK, AUTO_INCREMENT) | ID duy nhất của đề bài |
| `IdTaiKhoan` | BIGINT NOT NULL (FK) | ID người tạo đề bài |
| `TieuDe` | VARCHAR(255) NOT NULL | Tiêu đề đề bài |
| `NoiDungDeBai` | TEXT NOT NULL | Nội dung đề bài (mô tả, yêu cầu) |
| `DoKho` | VARCHAR(50) NOT NULL | Độ khó (ví dụ: Easy, Medium, Hard) |
| `GioiHanThoiGian` | INT NOT NULL | Giới hạn thời gian (giây) |
| `GioiHanBoNho` | INT NOT NULL | Giới hạn bộ nhớ (kb) |
| `DangCongKhai` | BOOLEAN NOT NULL DEFAULT true | Có công khai hay không |
| `NgayTao` | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | Ngày tạo đề bài |
| `TrangThai` | BOOLEAN NOT NULL DEFAULT true | Trạng thái đề bài |

**Quan hệ**:
- Thuộc về một tài khoản (`TaiKhoan`) - người tạo
- Có nhiều chủ đề (`ChuDe`) thông qua `DeBai_ChuDe`
- Có nhiều bình luận (`BinhLuan`)
- Có nhiều bộ test (`BoTest`)
- Có thể thuộc nhiều cuộc thi (`CuocThi`) thông qua `CuocThi_DeBai`
- Có nhiều bài nộp (`BaiNop`)

---

### 5. DeBai_ChuDe (Đề Bài - Chủ Đề)
**Mục đích**: Bảng trung gian thể hiện quan hệ nhiều-nhiều giữa đề bài và chủ đề

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdDeBai` | BIGINT NOT NULL (FK, PK) | ID đề bài |
| `IdChuDe` | BIGINT NOT NULL (FK, PK) | ID chủ đề |

**Quan hệ**:
- Liên kết `DeBai` và `ChuDe` (quan hệ nhiều-nhiều)

---

### 6. BinhLuan (Bình Luận)
**Mục đích**: Lưu trữ các bình luận của người dùng về đề bài

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdBinhLuan` | BIGINT (PK, AUTO_INCREMENT) | ID duy nhất của bình luận |
| `IdDeBai` | BIGINT NOT NULL (FK) | ID đề bài được bình luận |
| `IdTaiKhoan` | BIGINT NOT NULL (FK) | ID người viết bình luận |
| `NoiDung` | TEXT NOT NULL | Nội dung bình luận |
| `NgayTao` | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | Ngày tạo bình luận |
| `TrangThai` | BOOLEAN NOT NULL DEFAULT true | Trạng thái bình luận |

**Quan hệ**:
- Thuộc về một đề bài (`DeBai`)
- Thuộc về một tài khoản (`TaiKhoan`)

---

### 7. BoTest (Bộ Test)
**Mục đích**: Lưu trữ các test case để chấm điểm tự động

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdBoTest` | BIGINT (PK, AUTO_INCREMENT) | ID duy nhất của bộ test |
| `IdDeBai` | BIGINT NOT NULL (FK) | ID đề bài |
| `DuongDanInput` | TEXT NOT NULL | Đường dẫn file input |
| `DuongDanOutput` | TEXT NOT NULL | Đường dẫn file output mong đợi |
| `DuongDanCode` | TEXT NOT NULL | Đường dẫn file code mẫu (nếu có) |
| `NgayTao` | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | Ngày tạo bộ test |

**Quan hệ**:
- Thuộc về một đề bài (`DeBai`)

---

### 8. CuocThi (Cuộc Thi)
**Mục đích**: Quản lý các cuộc thi lập trình

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdCuocThi` | BIGINT (PK, AUTO_INCREMENT) | ID duy nhất của cuộc thi |
| `IdTaiKhoan` | BIGINT NOT NULL (FK) | ID người tạo cuộc thi |
| `TenCuocThi` | VARCHAR(255) NOT NULL | Tên cuộc thi |
| `MoTa` | TEXT NOT NULL | Mô tả cuộc thi |
| `ThoiGianBatDau` | DATETIME NOT NULL | Thời gian bắt đầu |
| `ThoiGianKetThuc` | DATETIME NOT NULL | Thời gian kết thúc |
| `TrangThai` | BOOLEAN NOT NULL DEFAULT true | Trạng thái cuộc thi |
| `NgayTao` | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | Ngày tạo cuộc thi |
| `ChuY` | TEXT | Các chú ý đặc biệt |

**Quan hệ**:
- Thuộc về một tài khoản (`TaiKhoan`) - người tạo
- Có nhiều đề bài (`DeBai`) thông qua `CuocThi_DeBai`
- Có nhiều người đăng ký (`TaiKhoan`) thông qua `CuocThi_DangKy`
- Có nhiều bài nộp (`BaiNop`)

---

### 9. CuocThi_DeBai (Cuộc Thi - Đề Bài)
**Mục đích**: Bảng trung gian thể hiện quan hệ nhiều-nhiều giữa cuộc thi và đề bài

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdCuocThi` | BIGINT NOT NULL (FK, PK) | ID cuộc thi |
| `IdDeBai` | BIGINT NOT NULL (FK, PK) | ID đề bài |
| `TenHienThi` | TEXT | Tên hiển thị của đề bài trong cuộc thi (nếu khác với tên gốc) |

**Quan hệ**:
- Liên kết `CuocThi` và `DeBai` (quan hệ nhiều-nhiều)

---

### 10. CuocThi_DangKy (Cuộc Thi - Đăng Ký)
**Mục đích**: Quản lý việc đăng ký tham gia cuộc thi của người dùng

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdCuocThi` | BIGINT NOT NULL (FK, PK) | ID cuộc thi |
| `IdTaiKhoan` | BIGINT NOT NULL (FK, PK) | ID tài khoản đăng ký |
| `TrangThai` | BOOLEAN NOT NULL DEFAULT true | Trạng thái đăng ký |

**Quan hệ**:
- Liên kết `CuocThi` và `TaiKhoan` (quan hệ nhiều-nhiều)

---

### 11. NgonNgu (Ngôn Ngữ)
**Mục đích**: Quản lý các ngôn ngữ lập trình được hỗ trợ

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdNgonNgu` | BIGINT (PK, AUTO_INCREMENT) | ID duy nhất của ngôn ngữ |
| `TenNgonNgu` | VARCHAR(100) UNIQUE NOT NULL | Tên ngôn ngữ (ví dụ: C++, Python, Java) |
| `TenNhanDien` | VARCHAR(255) NOT NULL | Tên nhận diện cho compiler/interpreter |
| `TrangThai` | BOOLEAN NOT NULL DEFAULT true | Trạng thái hỗ trợ |

**Quan hệ**:
- Có nhiều bài nộp (`BaiNop`) sử dụng ngôn ngữ này

---

### 12. BaiNop (Bài Nộp)
**Mục đích**: Lưu trữ các bài giải của người dùng và kết quả chấm điểm

| Cột | Kiểu dữ liệu | Mô tả |
|-----|--------------|-------|
| `IdBaiNop` | BIGINT (PK, AUTO_INCREMENT) | ID duy nhất của bài nộp |
| `IdTaiKhoan` | BIGINT NOT NULL (FK) | ID người nộp bài |
| `IdDeBai` | BIGINT NOT NULL (FK) | ID đề bài |
| `IdNgonNgu` | BIGINT NOT NULL (FK) | ID ngôn ngữ lập trình |
| `IdCuocThi` | BIGINT (FK, NULL) | ID cuộc thi (nếu nộp trong cuộc thi) |
| `DuongDanCode` | TEXT NOT NULL | Đường dẫn file code đã nộp |
| `TrangThaiCham` | TEXT | Trạng thái chấm (ví dụ: AC, WA, TLE, MLE, RE) |
| `ThoiGianThucThi` | INT | Thời gian thực thi (ms) |
| `BoNhoSuDung` | INT | Bộ nhớ sử dụng (kb) |
| `NgayNop` | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | Ngày giờ nộp bài |

**Quan hệ**:
- Thuộc về một tài khoản (`TaiKhoan`)
- Thuộc về một đề bài (`DeBai`)
- Thuộc về một ngôn ngữ (`NgonNgu`)
- Có thể thuộc về một cuộc thi (`CuocThi`) - tùy chọn

---

## Sơ Đồ Quan Hệ (ER Diagram)

```
VaiTro (1) ────────< (N) TaiKhoan
                              │
                              ├───< (N) DeBai
                              ├───< (N) BinhLuan
                              ├───< (N) CuocThi
                              ├───< (N) BaiNop
                              └───< (N) CuocThi_DangKy

ChuDe (N) ────────< (N) DeBai_ChuDe ────────> (N) DeBai
                                                      │
                                                      ├───< (N) BinhLuan
                                                      ├───< (N) BoTest
                                                      ├───< (N) BaiNop
                                                      └───< (N) CuocThi_DeBai

CuocThi (1) ────────< (N) CuocThi_DeBai ────────> (N) DeBai
         │
         ├───< (N) CuocThi_DangKy ────────> (N) TaiKhoan
         └───< (N) BaiNop

NgonNgu (1) ────────< (N) BaiNop
```

## Mô Tả Quan Hệ Chi Tiết

### Quan Hệ Một-Nhiều (1:N)

1. **VaiTro → TaiKhoan**: Một vai trò có nhiều tài khoản
2. **TaiKhoan → DeBai**: Một người dùng có thể tạo nhiều đề bài
3. **TaiKhoan → BinhLuan**: Một người dùng có thể viết nhiều bình luận
4. **TaiKhoan → CuocThi**: Một người dùng có thể tạo nhiều cuộc thi
5. **TaiKhoan → BaiNop**: Một người dùng có thể nộp nhiều bài
6. **DeBai → BinhLuan**: Một đề bài có thể có nhiều bình luận
7. **DeBai → BoTest**: Một đề bài có nhiều bộ test case
8. **DeBai → BaiNop**: Một đề bài có thể có nhiều bài nộp
9. **CuocThi → BaiNop**: Một cuộc thi có nhiều bài nộp
10. **NgonNgu → BaiNop**: Một ngôn ngữ có thể được sử dụng trong nhiều bài nộp

### Quan Hệ Nhiều-Nhiều (N:N)

1. **DeBai ↔ ChuDe**: Một đề bài có thể thuộc nhiều chủ đề, một chủ đề có nhiều đề bài
   - Bảng trung gian: `DeBai_ChuDe`

2. **CuocThi ↔ DeBai**: Một cuộc thi có nhiều đề bài, một đề bài có thể thuộc nhiều cuộc thi
   - Bảng trung gian: `CuocThi_DeBai`

3. **CuocThi ↔ TaiKhoan**: Một cuộc thi có nhiều người đăng ký, một người có thể đăng ký nhiều cuộc thi
   - Bảng trung gian: `CuocThi_DangKy`

## Các Ràng Buộc và Quy Tắc

1. **Tính duy nhất (UNIQUE)**:
   - `TenDangNhap` và `Email` trong `TaiKhoan` phải duy nhất
   - `TenVaiTro` trong `VaiTro` phải duy nhất
   - `TenChuDe` trong `ChuDe` phải duy nhất
   - `TenNgonNgu` trong `NgonNgu` phải duy nhất

2. **Khóa ngoại (Foreign Keys)**:
   - Tất cả các khóa ngoại đều có ràng buộc tham chiếu để đảm bảo tính toàn vẹn dữ liệu
   - Khi xóa một bản ghi cha, cần xử lý các bản ghi con tương ứng

3. **Giá trị mặc định**:
   - `TrangThai`: Mặc định là `true` (hoạt động)
   - `NgayTao`, `NgayNop`: Mặc định là thời gian hiện tại
   - `DangCongKhai`: Mặc định là `true`

4. **Giá trị NULL**:
   - `IdCuocThi` trong `BaiNop` có thể NULL (bài nộp có thể không thuộc cuộc thi nào)
   - `MoTa` trong `VaiTro` và `ChuDe` có thể NULL
   - `ChuY` trong `CuocThi` có thể NULL
   - `TrangThaiCham`, `ThoiGianThucThi`, `BoNhoSuDung` trong `BaiNop` có thể NULL (khi chưa chấm)

## Luồng Dữ Liệu Chính

### 1. Luồng Tạo và Nộp Bài
```
TaiKhoan → Tạo DeBai → Thêm BoTest → 
Người dùng khác: Đọc DeBai → Nộp BaiNop → 
Hệ thống chấm → Cập nhật TrangThaiCham, ThoiGianThucThi, BoNhoSuDung
```

### 2. Luồng Cuộc Thi
```
TaiKhoan (Admin) → Tạo CuocThi → 
Thêm DeBai vào CuocThi (CuocThi_DeBai) → 
Người dùng đăng ký (CuocThi_DangKy) → 
Nộp bài trong cuộc thi (BaiNop với IdCuocThi)
```

### 3. Luồng Phân Loại Đề Bài
```
Tạo ChuDe → Gán ChuDe cho DeBai (DeBai_ChuDe) → 
Người dùng lọc đề bài theo ChuDe
```

## Ghi Chú Kỹ Thuật

- **Database Engine**: MySQL
- **Character Set**: UTF-8 (để hỗ trợ tiếng Việt)
- **Index**: Các cột UNIQUE tự động có index
- **Primary Keys**: Tất cả đều sử dụng AUTO_INCREMENT để tự động tăng
- **Foreign Keys**: Tất cả đều có ràng buộc để đảm bảo tính toàn vẹn tham chiếu

## File SQL

File `code.sql` chứa các câu lệnh CREATE TABLE và ALTER TABLE để tạo cấu trúc cơ sở dữ liệu này.

