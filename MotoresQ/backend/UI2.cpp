// ======================================================
// UI2.CPP - PROVIDER UI FOR ACCEPTING REQUESTS
// ======================================================

#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include <sstream>
#include <fstream>
#include <ctime>
#include <iomanip>
#include <windows.h>
using namespace std;

// Windows Socket
#include <winsock2.h>
#pragma comment(lib, "ws2_32.lib")

const int PORT = 8080;
const string SERVER_IP = "127.0.0.1";
const double EARTH_RADIUS_KM = 6371.0;
const double PI = 3.14159265358979323846;

// ======================================================
// REQUEST STRUCTURE (same as server)
// ======================================================
struct Request {
    string id;
    double userLat;
    double userLng;
    string type;
    string status;
    string assignedProviderId;
};

// ======================================================
// DISTANCE CALCULATION (taken from server)
// ======================================================
double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    double dLat = (lat2 - lat1) * PI / 180.0;
    double dLon = (lon2 - lon1) * PI / 180.0;
    double a = sin(dLat/2) * sin(dLat/2) +
               cos(lat1 * PI / 180.0) * cos(lat2 * PI / 180.0) *
               sin(dLon/2) * sin(dLon/2);
    double c = 2 * atan2(sqrt(a), sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

// ======================================================
// SIMPLE JSON PARSER FOR REQUESTS
// ======================================================
vector<Request> parseRequests(const string& json) {
    vector<Request> requests;
    size_t start = json.find("[");
    size_t end = json.find("]", start);
    if (start == string::npos || end == string::npos) return requests;

    string array = json.substr(start + 1, end - start - 1);
    size_t pos = 0;
    while ((pos = array.find("{", pos)) != string::npos) {
        size_t objEnd = array.find("}", pos);
        if (objEnd == string::npos) break;

        string obj = array.substr(pos, objEnd - pos + 1);
        Request req;

        // Simple parsing
        size_t idPos = obj.find("\"id\":\"");
        if (idPos != string::npos) {
            idPos += 6;
            size_t idEnd = obj.find("\"", idPos);
            req.id = obj.substr(idPos, idEnd - idPos);
        }

        size_t latPos = obj.find("\"userLat\":");
        if (latPos != string::npos) {
            latPos += 10;
            size_t latEnd = obj.find(",", latPos);
            req.userLat = stod(obj.substr(latPos, latEnd - latPos));
        }

        size_t lngPos = obj.find("\"userLng\":");
        if (lngPos != string::npos) {
            lngPos += 10;
            size_t lngEnd = obj.find(",", lngPos);
            req.userLng = stod(obj.substr(lngPos, lngEnd - lngPos));
        }

        size_t typePos = obj.find("\"type\":\"");
        if (typePos != string::npos) {
            typePos += 8;
            size_t typeEnd = obj.find("\"", typePos);
            req.type = obj.substr(typePos, typeEnd - typePos);
        }

        size_t statusPos = obj.find("\"status\":\"");
        if (statusPos != string::npos) {
            statusPos += 10;
            size_t statusEnd = obj.find("\"", statusPos);
            req.status = obj.substr(statusPos, statusEnd - statusPos);
        }

        if (!req.id.empty()) {
            requests.push_back(req);
        }

        pos = objEnd + 1;
    }

    return requests;
}

// ======================================================
// SEND HTTP REQUEST
// ======================================================
string sendHttpRequest(const string& request) {
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);

    SOCKET sock = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = inet_addr(SERVER_IP.c_str());
    addr.sin_port = htons(PORT);

    if (connect(sock, (sockaddr*)&addr, sizeof(addr)) != 0) {
        closesocket(sock);
        WSACleanup();
        return "";
    }

    send(sock, request.c_str(), request.length(), 0);

    char buffer[4096] = {0};
    int bytes = recv(sock, buffer, sizeof(buffer), 0);
    string response = (bytes > 0) ? string(buffer, bytes) : "";

    closesocket(sock);
    WSACleanup();

    // Extract body after headers
    size_t bodyPos = response.find("\r\n\r\n");
    if (bodyPos != string::npos) {
        response = response.substr(bodyPos + 4);
    }

    return response;
}

// ======================================================
// MAIN FUNCTION
// ======================================================
int main() {
    cout << "\n" << string(50, '=') << endl;
    cout << "   🚗  PROVIDER UI - MOTORESQ" << endl;
    cout << "   Accept Emergency Service Requests" << endl;
    cout << string(50, '=') << endl;

    // Provider location (hardcoded as F1 - Indian Oil)
    double providerLat = 30.3165;
    double providerLng = 78.0322;
    string providerType = "fuel"; // or "mechanic"

    cout << "   📍 Provider Location: " << providerLat << ", " << providerLng << endl;
    cout << "   🔧 Service Type: " << providerType << endl;
    cout << "\n   🔄 Polling for requests...\n" << endl;

    while (true) {
        // Get pending requests
        string httpRequest = "GET /api/getrequests HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n";
        string response = sendHttpRequest(httpRequest);

        if (response.empty()) {
            cout << "   ❌ Cannot connect to server. Retrying in 5 seconds..." << endl;
            Sleep(5000);
            continue;
        }

        vector<Request> requests = parseRequests(response);

        // Filter pending requests of our type
        vector<Request> relevantRequests;
        for (const auto& req : requests) {
            if (req.status == "pending" && req.type == providerType) {
                relevantRequests.push_back(req);
            }
        }

        if (!relevantRequests.empty()) {
            Request req = relevantRequests[0]; // Take first
            double distance = calculateDistance(providerLat, providerLng, req.userLat, req.userLng);

            cout << "\n" << string(50, '-') << endl;
            cout << "   🆕 NEW REQUEST RECEIVED!" << endl;
            cout << "   📋 Request ID: " << req.id << endl;
            cout << "   🚨 Type: " << req.type << endl;
            cout << "   📍 User Location: " << req.userLat << ", " << req.userLng << endl;
            cout << "   📏 Distance: " << fixed << setprecision(2) << distance << " km" << endl;
            cout << "   ❓ Accept this request? (y/n): ";

            string input;
            getline(cin, input);

            if (input == "y" || input == "Y") {
                // Accept request
                string acceptRequest = "GET /api/accept?id=" + req.id + " HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n";
                string acceptResponse = sendHttpRequest(acceptRequest);

                if (acceptResponse.find("\"status\":\"accepted\"") != string::npos) {
                    cout << "   ✅ Request ACCEPTED! Contact the user." << endl;
                } else {
                    cout << "   ❌ Failed to accept request." << endl;
                }
            } else {
                cout << "   ❌ Request DECLINED." << endl;
            }
        } else {
            cout << "   🔄 No pending requests. Checking again in 3 seconds..." << endl;
        }

        Sleep(3000);
    }

    return 0;
}
