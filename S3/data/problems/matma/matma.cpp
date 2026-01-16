#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    vector<long long> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }

    bool isSymmetric = true;

    for (int i = 0; i < n / 2; i++) {
        if (a[i] != a[n - 1 - i]) {
            isSymmetric = false;
            break;
        }
    }

    if (isSymmetric) {
        cout << "YES" << endl;
    } else {
        cout << "NO" << endl;
    }

    return 0;
}