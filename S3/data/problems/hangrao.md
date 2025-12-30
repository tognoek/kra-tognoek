# HÀNG RÀO BẢO VỆ

## 📖 Câu chuyện

Bác nông dân **John** vừa mua được **n** thanh gỗ có độ dài khác nhau. Bác muốn chọn ra **3 thanh gỗ** để dựng thành một chiếc khung hình tam giác nhằm bảo vệ vườn hoa nhỏ của mình.

Bác John muốn chiếc hàng rào này phải có **chu vi lớn nhất** có thể để bao quanh được nhiều diện tích nhất. Tuy nhiên, bác cũng biết rằng không phải cứ chọn đại 3 thanh gỗ là có thể ghép thành tam giác (tổng độ dài 2 cạnh bất kỳ phải luôn lớn hơn cạnh còn lại).

Hãy giúp bác John tìm ra chu vi lớn nhất của hàng rào mà bác có thể dựng được!



---

## 📝 Đề bài

Cho một mảng gồm **n** số nguyên dương $a_1, a_2, ..., a_n$ là độ dài của các thanh gỗ.  
Hãy tìm 3 thanh gỗ có thể tạo thành một tam giác sao cho **tổng độ dài của chúng là lớn nhất**.

---

## 📥 Dữ liệu vào

- Dòng đầu tiên chứa số nguyên dương **n** ($3 \le n \le 10^5$).
- Dòng thứ hai chứa **n** số nguyên dương $a_i$ ($1 \le a_i \le 10^9$), mỗi số cách nhau một khoảng trắng.

---

## 📤 Dữ liệu ra

- Một số nguyên duy nhất là chu vi lớn nhất tìm được. Nếu không thể tạo thành bất kỳ tam giác nào, in ra `-1`.

---

## 📌 Ví dụ

**Input**
```
5
2 1 2 10 1
```
**Output**
```
5
```