#include <iostream>
#include <vector>
#include <algorithm> 

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    int n;
    if (!(cin >> n)) return 0;

    long long weight;
    cin >> weight;
    
    long long minWeight = weight;

    for (int i = 1; i < n; i++) {
        cin >> weight;
        if (weight < minWeight) {
            minWeight = weight;
        }
    }

    cout << minWeight << endl;

    return 0;
}