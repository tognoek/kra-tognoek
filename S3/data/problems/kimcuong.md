# NHÀ THÁM HIỂM VÀ NHỮNG VIÊN KIM CƯƠNG

## 📖 Kho báu

Nhà thám hiểm **Jones** vừa tìm thấy một hang động chứa đầy kim cương. Sau khi đo đạc kích thước của **n** viên kim cương tìm được, ông muốn chọn ra một viên để tặng cho viện bảo tàng quốc gia.

Tuy nhiên, viên kim cương lớn nhất đã được Jones quyết định giữ lại để nghiên cứu bí mật. Vì vậy, ông muốn tìm viên kim cương có **kích thước lớn thứ hai** để đem đi tặng.

Bạn hãy giúp Jones xác định kích thước của viên kim cương đặc biệt này nhé!

---

## 📝 Đề bài

Cho một mảng gồm **n** số nguyên dương $a_1, a_2, ..., a_n$ là kích thước của các viên kim cương.
Hãy tìm giá trị **lớn thứ nhì** trong mảng đó.

*Lưu ý: Nếu mảng có nhiều giá trị bằng nhau và là lớn nhất, giá trị lớn thứ nhì phải là giá trị nhỏ hơn giá trị lớn nhất đó.*

---

## 📥 Dữ liệu vào

- Dòng đầu tiên chứa số nguyên dương **n** (số lượng viên kim cương).
- Dòng thứ hai chứa **n** số nguyên dương $a_i$ ($1 \le a_i \le 10^9$), mỗi số cách nhau một khoảng trắng.

---

## 📤 Dữ liệu ra

- Một số nguyên duy nhất là giá trị lớn thứ nhì. Nếu không tồn tại giá trị lớn thứ nhì (ví dụ tất cả các số bằng nhau), in ra `NOT FOUND`.

---

## 📌 Ví dụ

**Input**
```
5
10 20 15 20 18
```
**Output**
```
18
```