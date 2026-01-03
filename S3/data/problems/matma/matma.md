# MẬT MÃ CỦA ĐẠI ĐỘI TRƯỞNG
## 📖 Mật mã
Trong một cuộc hành quân bí mật, Đại đội trưởng cần gửi một dãy mật mã gồm **n** con số về căn cứ. Tuy nhiên, để tránh bị kẻ địch giả mạo, quân đội quy ước rằng: Một mật mã hợp lệ phải là một **mật mã đối xứng**.

Tức là nếu ta đọc dãy mật mã từ trái sang phải hay từ phải sang trái, dãy số đều phải hoàn toàn giống hệt nhau. Điều này giúp người nhận tin chắc chắn rằng thông tin không bị mất mát hay bị đảo lộn trong quá trình truyền đi.

Đại đội trưởng vừa nhận được một dãy số, bạn hãy giúp ông ấy kiểm tra xem đó có phải là mật mã hợp lệ hay không!

---
## 📝 Đề bài
Cho một dãy gồm **n** số nguyên $a_1, a_2, ..., a_n$.  
Hãy kiểm tra xem dãy số này có phải là **dãy đối xứng** hay không.

---
## 📥 Dữ liệu vào
- Dòng đầu tiên chứa số nguyên dương **n** (số lượng chữ số trong mật mã).
- Dòng thứ hai chứa **n** số nguyên $a_i$ ($0 \le a_i \le 10^9$), mỗi số cách nhau một khoảng trắng.
---
## 📤 Dữ liệu ra
- In ra `YES` nếu dãy số đối xứng.
- In ra `NO` nếu dãy số không đối xứng.
---
## 📌 Ví dụ
**Input**
```
5
1 2 3 2 1
```
**Output**
```
YES
```