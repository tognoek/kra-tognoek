#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    long long k;
    if (!(cin >> n >> k)) return 0;

    long long tong = 0; 
    long long temp;

    for (int i = 0; i < n; i++) {
        cin >> temp;
        if (temp > k) {
            tong += temp;
        }
    }

    cout << tong << endl;

    return 0;
}