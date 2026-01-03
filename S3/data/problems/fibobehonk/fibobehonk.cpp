#include <iostream>

using namespace std;

int main() {
    long long k;
    if (!(cin >> k)) return 0;

    cout << 0;

    if (k >= 1) {
        cout << " " << 1;
        
        long long f0 = 0;
        long long f1 = 1;
        long long fn = f0 + f1;

        while (fn <= k) {
            cout << " " << fn;
            
            f0 = f1;
            f1 = fn;
            fn = f0 + f1;
            
            if (fn < 0) break; 
        }
    }

    cout << endl;
    return 0;
}