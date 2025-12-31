#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

void solve() {
    int n;
    long long k;
    if (!(cin >> n >> k)) return;

    vector<int> a(n);
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
    }

    sort(a.begin(), a.end());
    a.erase(unique(a.begin(), a.end()), a.end());

    int m = a.size();
    if (m == 0) {
        cout << -1 << endl;
        return;
    }

    int max_val = a.back();
    vector<int> valid_candidates;

    for (int x : a) {
        long long last_multiple = (k / x) * x;
        if (last_multiple > max_val) {
            continue; 
        }

        bool is_valid = true;
        for (long long v = 2LL * x; v <= max_val; v += x) {
            if (!binary_search(a.begin(), a.end(), (int)v)) {
                is_valid = false;
                break;
            }
        }

        if (is_valid) {
            valid_candidates.push_back(x);
        }
    }

    vector<int> B;
    vector<bool> removed(valid_candidates.size(), false);

    for (int i = 0; i < valid_candidates.size(); ++i) {
        if (removed[i]) continue;
        
        int val = valid_candidates[i];
        B.push_back(val);

        for (long long v = 2LL * val; v <= max_val; v += val) {
            auto it = lower_bound(valid_candidates.begin() + i + 1, valid_candidates.end(), (int)v);
            if (it != valid_candidates.end() && *it == v) {
                removed[it - valid_candidates.begin()] = true;
            }
        }
    }

    vector<bool> is_covered(m, false);
    int covered_count = 0;

    for (int x : B) {
        for (long long v = x; v <= max_val; v += x) {
            auto it = lower_bound(a.begin(), a.end(), (int)v);
            if (it != a.end() && *it == v) {
                int idx = it - a.begin();
                if (!is_covered[idx]) {
                    is_covered[idx] = true;
                    covered_count++;
                }
            }
        }
    }

    if (covered_count == m) {
        cout << B.size() << endl;
        for (int x : B) {
            cout << x << " ";
        }
        cout << endl;
    } else {
        cout << -1 << endl;
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    int t;
    if (cin >> t) {
        while (t--) {
            solve();
        }
    }
    return 0;
}