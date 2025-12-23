-- File seed data để fake dữ liệu bình luận
-- Chạy file này sau khi đã chạy code.sql (đã có field IdBinhLuanCha)

-- Xóa dữ liệu cũ (nếu cần)
-- DELETE FROM BinhLuan;

-- Lấy ID của các users và đề bài
SET @user1_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'user1' LIMIT 1);
SET @user2_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'user2' LIMIT 1);
SET @user3_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'user3' LIMIT 1);
SET @user4_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'user4' LIMIT 1);
SET @admin_id = (SELECT IdTaiKhoan FROM TaiKhoan WHERE TenDangNhap = 'admin' LIMIT 1);

-- Lấy ID của các đề bài (chỉ lấy đề bài đã tồn tại)
SET @debai1_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'A + B Problem' LIMIT 1);
SET @debai2_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Tìm số lớn nhất' LIMIT 1);
SET @debai3_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Tính tổng mảng' LIMIT 1);
SET @debai4_id = (SELECT IdDeBai FROM DeBai WHERE TieuDe = 'Kiểm tra số nguyên tố' LIMIT 1);

-- Thêm bình luận gốc (không có IdBinhLuanCha) - chỉ thêm nếu có đề bài và user
INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user2_id, NULL, 'Bài này khá dễ, mình làm được trong 5 phút! 👍', DATE_SUB(NOW(), INTERVAL 5 DAY), TRUE
WHERE @debai1_id IS NOT NULL AND @user2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user3_id, NULL, 'Có ai giải thích cách làm bài này không? Mình mới học lập trình.', DATE_SUB(NOW(), INTERVAL 4 DAY), TRUE
WHERE @debai1_id IS NOT NULL AND @user3_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user4_id, NULL, 'Bài này là bài đầu tiên mình làm được trên platform này, cảm ơn admin!', DATE_SUB(NOW(), INTERVAL 3 DAY), TRUE
WHERE @debai1_id IS NOT NULL AND @user4_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user1_id, NULL, 'Bài này có thể dùng vòng lặp for đơn giản, hoặc dùng hàm max() nếu ngôn ngữ hỗ trợ.', DATE_SUB(NOW(), INTERVAL 6 DAY), TRUE
WHERE @debai2_id IS NOT NULL AND @user1_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user3_id, NULL, 'Mình nghĩ có thể optimize bằng cách chỉ duyệt một lần thôi.', DATE_SUB(NOW(), INTERVAL 5 DAY), TRUE
WHERE @debai2_id IS NOT NULL AND @user3_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @admin_id, NULL, 'Đúng rồi! Độ phức tạp O(n) là tối ưu cho bài này.', DATE_SUB(NOW(), INTERVAL 4 DAY), TRUE
WHERE @debai2_id IS NOT NULL AND @admin_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai3_id, @user2_id, NULL, 'Bài này tương tự bài trước, chỉ cần thay max() thành sum().', DATE_SUB(NOW(), INTERVAL 4 DAY), TRUE
WHERE @debai3_id IS NOT NULL AND @user2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai3_id, @user4_id, NULL, 'Có ai test với mảng rỗng chưa? Kết quả nên là 0 đúng không?', DATE_SUB(NOW(), INTERVAL 3 DAY), TRUE
WHERE @debai3_id IS NOT NULL AND @user4_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user1_id, NULL, 'Bài này cần kiến thức về số nguyên tố. Có thể dùng thuật toán Sieve of Eratosthenes để optimize.', DATE_SUB(NOW(), INTERVAL 7 DAY), TRUE
WHERE @debai4_id IS NOT NULL AND @user1_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user2_id, NULL, 'Mình làm bằng cách kiểm tra từ 2 đến sqrt(n), đã AC rồi!', DATE_SUB(NOW(), INTERVAL 6 DAY), TRUE
WHERE @debai4_id IS NOT NULL AND @user2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user3_id, NULL, 'Cảm ơn bạn user2, mình sẽ thử cách đó!', DATE_SUB(NOW(), INTERVAL 5 DAY), TRUE
WHERE @debai4_id IS NOT NULL AND @user3_id IS NOT NULL;

-- Lấy ID của các bình luận gốc vừa tạo để tạo replies
SET @comment2_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai1_id AND IdTaiKhoan = @user3_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);
SET @comment3_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai2_id AND IdTaiKhoan = @user1_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);
SET @comment4_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai2_id AND IdTaiKhoan = @user3_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);
SET @comment6_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai3_id AND IdTaiKhoan = @user4_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);
SET @comment7_id = (SELECT IdBinhLuan FROM BinhLuan WHERE IdDeBai = @debai4_id AND IdTaiKhoan = @user3_id AND IdBinhLuanCha IS NULL ORDER BY NgayTao DESC LIMIT 1);

-- Thêm replies (có IdBinhLuanCha) - chỉ thêm nếu có parent comment
INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user2_id, @comment2_id, 'Bạn có thể dùng phép cộng đơn giản: `a + b`. Nếu đọc từ input thì dùng scanf hoặc cin.', DATE_SUB(NOW(), INTERVAL 3 DAY) - INTERVAL 2 HOUR, TRUE
WHERE @debai1_id IS NOT NULL AND @user2_id IS NOT NULL AND @comment2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @admin_id, @comment2_id, 'Đúng rồi! Đây là bài cơ bản nhất, chỉ cần đọc 2 số và in ra tổng. Chúc bạn học tốt!', DATE_SUB(NOW(), INTERVAL 3 DAY) - INTERVAL 1 HOUR, TRUE
WHERE @debai1_id IS NOT NULL AND @admin_id IS NOT NULL AND @comment2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai1_id, @user4_id, @comment2_id, 'Mình cũng mới học, làm được rồi! Cảm ơn các bạn đã giúp đỡ.', DATE_SUB(NOW(), INTERVAL 2 DAY) - INTERVAL 12 HOUR, TRUE
WHERE @debai1_id IS NOT NULL AND @user4_id IS NOT NULL AND @comment2_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user2_id, @comment3_id, 'Cảm ơn bạn! Mình cũng nghĩ vậy, nhưng không chắc có cách nào tốt hơn không.', DATE_SUB(NOW(), INTERVAL 5 DAY) - INTERVAL 3 HOUR, TRUE
WHERE @debai2_id IS NOT NULL AND @user2_id IS NOT NULL AND @comment3_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user4_id, @comment3_id, 'Mình dùng vòng lặp for, code rất ngắn gọn!', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 8 HOUR, TRUE
WHERE @debai2_id IS NOT NULL AND @user4_id IS NOT NULL AND @comment3_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @user1_id, @comment4_id, 'Đúng rồi! Chỉ cần duyệt một lần là đủ, không cần sort hay làm gì phức tạp.', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 2 HOUR, TRUE
WHERE @debai2_id IS NOT NULL AND @user1_id IS NOT NULL AND @comment4_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai2_id, @admin_id, @comment4_id, 'Chính xác! Độ phức tạp O(n) là tối ưu cho bài này.', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 1 HOUR, TRUE
WHERE @debai2_id IS NOT NULL AND @admin_id IS NOT NULL AND @comment4_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai3_id, @user2_id, @comment6_id, 'Đúng rồi! Nếu mảng rỗng thì tổng là 0. Bạn nhớ xử lý edge case này nhé!', DATE_SUB(NOW(), INTERVAL 2 DAY) - INTERVAL 6 HOUR, TRUE
WHERE @debai3_id IS NOT NULL AND @user2_id IS NOT NULL AND @comment6_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai3_id, @user1_id, @comment6_id, 'Good catch! Luôn nhớ test với các trường hợp đặc biệt như mảng rỗng, mảng 1 phần tử, v.v.', DATE_SUB(NOW(), INTERVAL 2 DAY) - INTERVAL 4 HOUR, TRUE
WHERE @debai3_id IS NOT NULL AND @user1_id IS NOT NULL AND @comment6_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user2_id, @comment7_id, 'Không có gì! Chúc bạn làm được bài này. Nếu cần hỗ trợ thêm cứ hỏi nhé!', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 10 HOUR, TRUE
WHERE @debai4_id IS NOT NULL AND @user2_id IS NOT NULL AND @comment7_id IS NOT NULL;

INSERT INTO BinhLuan (IdDeBai, IdTaiKhoan, IdBinhLuanCha, NoiDung, NgayTao, TrangThai) 
SELECT @debai4_id, @user1_id, @comment7_id, 'Nếu bạn muốn tối ưu hơn nữa, có thể dùng Sieve of Eratosthenes để precompute các số nguyên tố.', DATE_SUB(NOW(), INTERVAL 4 DAY) - INTERVAL 8 HOUR, TRUE
WHERE @debai4_id IS NOT NULL AND @user1_id IS NOT NULL AND @comment7_id IS NOT NULL;
