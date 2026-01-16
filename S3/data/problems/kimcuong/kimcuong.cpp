#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    long long max1 = -1, max2 = -1;

    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;

        if (x > max1) {
            max2 = max1;
            max1 = x; 
        } 
        else if (x < max1 && x > max2) {
            max2 = x;
        }
    }

    cout << max2 << endl;

    return 0;
}