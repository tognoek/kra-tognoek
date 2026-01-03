#include <iostream>
#include <vector>

using namespace std;

int cnt[1000001]; 

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    int max_id = 0;
    for (int i = 0; i < n; i++) {
        int id;
        cin >> id;
        cnt[id]++;
        if (id > max_id) max_id = id;
    }

    int result_id = 0;
    int maxFreq = 0;

    for (int i = 1; i <= max_id; i++) {
        if (cnt[i] > maxFreq) {
            maxFreq = cnt[i];
            result_id = i;
        }
    }

    cout << result_id << endl;

    return 0;
}