#include <iostream>
#include <cmath>
#include <vector>

using namespace std;

bool isPrime(long long n) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;
    
    for (long long i = 5; i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) {
            return false;
        }
    }
    return true;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    int count = 0;
    for (int i = 0; i < n; i++) {
        long long a;
        cin >> a;
        if (isPrime(a)) {
            count++;
        }
    }

    cout << count << endl;

    return 0;
}