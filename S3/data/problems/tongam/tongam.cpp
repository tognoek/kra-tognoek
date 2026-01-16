#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    long long tongAm = 0;
    long long temp;

    for (int i = 0; i < n; i++) {
        cin >> temp;
        if (temp < 0) {
            tongAm += temp;
        }
    }

    cout << tongAm << endl;

    return 0;
}