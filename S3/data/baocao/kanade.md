# Kanade's Perfect Multiples

> *"Chúng ta đã khắc sâu những ký ức đó vào chính mình... Dù chúng có khó khăn đến đâu, đó vẫn là cuộc đời mà chúng ta đã sống!"* > — **Angel Beats!**
---
## 📖 Mô tả bài toán
Trong ngôi trường ở thế giới bên kia, Kanade đang nghiên cứu một trò chơi số học đặc biệt. Cô ấy đưa cho bạn hai số nguyên $n$, $k$ và một mảng $a$ gồm $n$ số nguyên thỏa mãn $1 \le a_i \le k$.

Một tập hợp các số nguyên $B = \{b_1, b_2, \dots, b_m\}$ (với $1 \le b_i \le k$) được gọi là **hoàn hảo (complete)** nếu và chỉ nếu thỏa mãn cả hai điều kiện sau:
1.  **Tính bao phủ:** Với mỗi $1 \le i \le n$, mảng $a$ phải chứa ít nhất một phần tử $a_i$ là bội số của một số nào đó trong $B$ (nói cách khác, ít nhất một ước của $a_i$ nằm trong $B$).
2.  **Tính ràng buộc:** Với mỗi $b_j \in B$, **tất cả** các bội số dương của $b_j$ mà nhỏ hơn hoặc bằng $k$ phải xuất hiện trong mảng $a$ ít nhất một lần.

**Yêu cầu:** Hãy tìm một tập hợp $B$ hoàn hảo có **kích thước nhỏ nhất** ($m$ nhỏ nhất), hoặc xác định rằng không tồn tại tập hợp nào như vậy.

---
## 📥 Dữ liệu vào
Mỗi bộ dữ liệu chứa nhiều trường hợp thử nghiệm (test cases). Dòng đầu tiên chứa số lượng trường hợp thử nghiệm $t$ ($1 \le t \le 10^4$).

Mỗi trường hợp thử nghiệm bao gồm:
- Dòng đầu tiên chứa hai số nguyên $n$ và $k$ ($1 \le n \le 2 \cdot 10^5, 1 \le k \le 10^9$) — độ dài mảng $a$ và giới hạn trên của các phần tử.
- Dòng thứ hai chứa $n$ số nguyên $a_1, a_2, \dots, a_n$ ($1 \le a_i \le k$).

**Lưu ý:** Tổng của $n$ trên tất cả các trường hợp thử nghiệm không vượt quá $2 \cdot 10^5$.

---

## 📤 Dữ liệu ra

Với mỗi trường hợp thử nghiệm:
- Nếu không tồn tại tập hợp $B$ hoàn hảo, in ra một số nguyên duy nhất là `-1`.
- Nếu có tồn tại:
    - Dòng đầu tiên in ra số nguyên $m$ ($1 \le m \le n$) — kích thước nhỏ nhất của tập $B$.
    - Dòng thứ hai in ra $m$ số nguyên $b_1, b_2, \dots, b_m$ ($1 \le b_i \le k$).
- Nếu có nhiều đáp án cùng kích thước $m$, bạn có thể in ra bất kỳ đáp án nào.

---
## 📌 Ví dụ
**Input**
```text
4
4 6
3 2 4 6
5 5
1 2 3 4 5
3 6
2 3 6
1 2
2
```
**Output**
```text
2
2 3 
1
1 
-1
1
2 
```