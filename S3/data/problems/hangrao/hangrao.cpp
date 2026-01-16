#include <iostream>
#include <vector>
#include <algorithm>

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

    sort(a.begin(), a.end());

    for (int i = n - 1; i >= 2; i--) {
        if (a[i-2] + a[i-1] > a[i]) {
            cout << a[i-2] + a[i-1] + a[i] << endl;
            return 0;
        }
    }

    cout << -1 << endl;

    return 0;
}