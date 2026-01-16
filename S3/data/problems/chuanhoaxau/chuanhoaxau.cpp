#include <iostream>
#include <string>
#include <sstream>
#include <vector>

using namespace std;

int main() {
    string s;
    if (!getline(cin, s)) return 0;

    stringstream ss(s);
    string word;
    vector<string> words;

    while (ss >> word) {
        word[0] = toupper(word[0]);
        for (int i = 1; i < word.length(); i++) {
            word[i] = tolower(word[i]);
        }
        words.push_back(word);
    }

    for (int i = 0; i < words.size(); i++) {
        cout << words[i];
        if (i != words.size() - 1) {
            cout << " ";
        }
    }

    return 0;
}