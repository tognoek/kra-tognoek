#include <iostream>
#include <algorithm>

using namespace std;

long long findGCD(long long a, long long b) {
    while (b != 0) {
        a = a % b; 
        swap(a, b); 
    }
    return a;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    long long a, b;
    if (cin >> a >> b) {
        cout << findGCD(a, b) << endl;
    }

    return 0;
}