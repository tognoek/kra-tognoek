#include <bits/stdc++.h>

using namespace std;

vector<string> read_all_strings(string filename) {
    vector<string> data;
    ifstream file(filename);
    
    if (!file.is_open()) {
        cerr << "[Checker Error] Khong mo duoc file: " << filename << endl;
        exit(1);
    }

    string val;
    while (file >> val) {
        data.push_back(val);
    }
    return data;
}

int solve(vector<string> user_out, vector<string> answer_res) {
    if (user_out.size() != answer_res.size()) {
        return 0;
    }

    for (size_t i = 0; i < user_out.size(); i++) {
        if (user_out[i] != answer_res[i]) {
            return 0;
        }
    }

    return 1;
}

int main(int argc, char* argv[]) {
    // argv[0]: Tên chương trình checker
    // argv[1]: File Input (đề bài)
    // argv[2]: File Output của thí sinh (.out)
    // argv[3]: File Đáp án chuẩn (.res)
    
    if (argc < 4) {
        cerr << "Loi: Thieu tham so dong lenh!" << endl;
        return 1;
    }

    vector<string> user_out = read_all_strings(argv[2]); 
    vector<string> answer_res = read_all_strings(argv[3]);

    cout << solve(user_out, answer_res);
    
    return 0;
}