#include <iostream>
#include <algorithm>

using namespace std;

long long findGCD(long long a, long long b) {
    while (b != 0) {
        a %= b;
        swap(a, b);
    }
    return a;
}

long long findLCM(long long a, long long b) {
    if (a == 0 || b == 0) return 0;
    return (a / findGCD(a, b)) * b;
}

int main() {
    long long a, b;
    if (cin >> a >> b) {
        cout << findLCM(a, b) << endl;
    }
    return 0;
}