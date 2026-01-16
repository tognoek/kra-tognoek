import random
from datetime import datetime, timedelta

# --- CẤU HÌNH THỜI GIAN BẮT ĐẦU ---
THOI_GIAN_BAT_DAU = datetime(2026, 1, 3, 20, 0, 0)
SO_LUONG_BAN_GHI = 15  
FILE_NAME = "insert_submissions.sql"

# --- CẤU HÌNH DỮ LIỆU ---
danh_sach_id_user = [2, 3, 4, 5, 6]
danh_sach_id_de_bai = [26]
danh_sach_id_ngon_ngu = [1]  
danh_sach_id_cuoc_thi = [2]

# mysqldump -u `root` -p `kra-tognoek` > ten_file_xuat.sql

# SỬ DỤNG TRIPLE QUOTES ĐỂ GIỮ ĐỊNH DẠNG CODE
CODE_MAC_DINH = """#include <iostream>

using namespace std;

int main() {
    cout << "Hello word!!";
    return 0;
}"""

# Hàm xử lý dấu nháy đơn để an toàn khi chèn vào SQL
def escape_sql(text):
    return text.replace("'", "''")

DUONG_DAN_MAC_DINH = "demo.cpp"

# Tỷ lệ Trạng thái: (Mã, Trọng số %)
cac_trang_thai = [
    ("[0,0,0]", 75),  # AC
    ("[-1]", 5),     # Compile Error
    ("[0,1,0]", 5),  # WA
    ("[1,0,1]", 5),   # TLE
    ("[0,0,1]", 5),   # MLE
    ("[4]", 5)        # RE
]

def lay_trang_thai_ngau_nhien():
    trang_thai_list = [t[0] for t in cac_trang_thai]
    weights = [t[1] for t in cac_trang_thai]
    return random.choices(trang_thai_list, weights=weights, k=1)[0]

# --- TIẾN HÀNH TẠO DỮ LIỆU ---
thoi_gian_chay = THOI_GIAN_BAT_DAU
sql_content = "-- Script chèn dữ liệu tự động cho bảng BaiNop\n"
sql_content += "INSERT INTO BaiNop (IdTaiKhoan, IdDeBai, IdNgonNgu, IdCuocThi, DuongDanCode, Code, TrangThaiCham, ThoiGianThucThi, BoNhoSuDung, NgayNop) VALUES\n"

values_list = []
# Escape code một lần duy nhất để dùng cho tất cả các dòng
code_safe = escape_sql(CODE_MAC_DINH)

for i in range(SO_LUONG_BAN_GHI):
    id_user = random.choice(danh_sach_id_user)
    id_de = random.choice(danh_sach_id_de_bai)
    id_lang = random.choice(danh_sach_id_ngon_ngu)
    id_contest = random.choice(danh_sach_id_cuoc_thi)
    trang_thai = lay_trang_thai_ngau_nhien()
    
    if trang_thai == "[-1]":
        time_run, mem_run = 0, 0
    else:
        time_run = random.randint(5, 1000)
        mem_run = random.randint(512, 128000)
    
    # Tăng thời gian nộp bài 2-4 phút
    thoi_gian_chay += timedelta(minutes=random.randint(2, 4))
    ngay_nop_str = thoi_gian_chay.strftime('%Y-%m-%d %H:%M:%S')
    
    contest_val = id_contest if id_contest == "NULL" else f"'{id_contest}'"
    
    line = f"({id_user}, {id_de}, {id_lang}, {contest_val}, '{DUONG_DAN_MAC_DINH}', '{code_safe}', '{trang_thai}', {time_run}, {mem_run}, '{ngay_nop_str}')"
    values_list.append(line)

sql_content += ",\n".join(values_list) + ";"

# --- GHI VÀO FILE ---
try:
    with open(FILE_NAME, "w", encoding="utf-8") as f:
        f.write(sql_content)
    print(f"✅ Thành công! Đã lưu {SO_LUONG_BAN_GHI} dòng vào file: {FILE_NAME}")
except Exception as e:
    print(f"❌ Lỗi khi lưu file: {e}")