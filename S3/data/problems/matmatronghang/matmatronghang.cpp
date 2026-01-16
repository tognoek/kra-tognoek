#include <iostream>
#include <string>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    unsigned long long n;
    if (!(cin >> n)) return 0;

    if (n == 0) {
        cout << 0 << endl;
        return 0;
    }

    string binary = "";
    
    while (n > 0) {
        if (n % 2 == 0) {
            binary += '0';
        } else {
            binary += '1';
        }
        n /= 2;
    }

    reverse(binary.begin(), binary.end());

    cout << binary << endl;

    return 0;
}