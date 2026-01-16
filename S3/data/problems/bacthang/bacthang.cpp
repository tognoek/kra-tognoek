#include <iostream>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    string n;
    cin >> n;

    bool isStepNumber = true;

    for (int i = 0; i < n.length() - 1; i++) {
        if (n[i] >= n[i+1]) {
            isStepNumber = false;
            break;
        }
    }

    if (isStepNumber) {
        cout << "YES" << endl;
    } else {
        cout << "NO" << endl;
    }

    return 0;
}