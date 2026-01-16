#include <iostream>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    long long n;
    if (!(cin >> n)) return 0;

    long long sum = 0;

    while (n > 0) {
        sum += n % 10;
        n /= 10;
    }

    cout << sum << endl;

    return 0;
}