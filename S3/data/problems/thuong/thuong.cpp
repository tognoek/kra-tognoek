#include <iostream>

using namespace std;

int main() {
    long long a, b;

    if (cin >> a >> b) {
        if (b != 0) {
            cout << a / b << endl;
        }
    }

    return 0;
}