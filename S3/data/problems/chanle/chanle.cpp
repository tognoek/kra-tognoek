#include <iostream>

using namespace std;

int main() {
    long long n;
    if (cin >> n) {
        if (n % 2 == 0) {
            cout << "EVEN" << endl;
        } else {
            cout << "ODD" << endl;
        }
    }
    return 0;
}