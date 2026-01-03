#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    long long firstNum;
    cin >> firstNum;
    long long maxVal = firstNum;

    for (int i = 1; i < n; i++) {
        long long current;
        cin >> current;
        if (current > maxVal) {
            maxVal = current;
        }
    }

    cout << maxVal << endl;

    return 0;
}