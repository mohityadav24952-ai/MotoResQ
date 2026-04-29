// ======================================================
// MOTORESQ - COMPLETE WITH 3 UIs (User + Provider + Delivery)
// ALL APIs WORKING - REQUEST FLOW FIXED
// ======================================================

#include <iostream>
#include <string>
#include <vector>
#include <cmath>
#include <algorithm>
#include <sstream>
#include <fstream>
#include <ctime>
#include <queue>
#include <map>
using namespace std;

// Windows Socket
#include <winsock2.h>
#pragma comment(lib, "ws2_32.lib")

const int PORT = 8080;
const double EARTH_RADIUS_KM = 6371.0;
const double PI = 3.14159265358979323846;

// ======================================================
// STRUCTURES
// ======================================================

struct Provider {
    string id;
    string name;
    string type;
    double lat;
    double lng;
    string phone;
    string address;
    double rating;
    double distance;
    double priority;
    
    Provider() : lat(0), lng(0), rating(0), distance(0), priority(0) {}
};

struct Request {
    string id;
    string userId;
    string userName;
    double userLat;
    double userLng;
    string type;
    string providerId;
    string providerName;
    double providerLat;
    double providerLng;
    string deliveryId;
    string status;  // pending, accepted, picked, delivered
    double distance;
};

// ======================================================
// GLOBAL DATA
// ======================================================

vector<Provider> providers;
vector<Request> requests;
int nextRequestId = 1;

// ======================================================
// DISTANCE CALCULATION (Haversine Formula)
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
// HEURISTIC & A* ALGORITHM
// ======================================================
double heuristic(double userLat, double userLng, double providerLat, double providerLng) {
    return calculateDistance(userLat, userLng, providerLat, providerLng);
}

vector<Provider> aStarFindNearest(double userLat, double userLng, 
                                   const string& type, int maxResults = 5) {
    vector<pair<double, Provider>> candidates;
    
    for (auto& p : providers) {
        if (p.type == type) {
            double g = calculateDistance(userLat, userLng, p.lat, p.lng);
            double h = heuristic(userLat, userLng, p.lat, p.lng);
            double f = g + h;
            p.distance = g;
            p.priority = f;
            candidates.push_back({f, p});
        }
    }
    
    sort(candidates.begin(), candidates.end(),
         [](const pair<double, Provider>& a, const pair<double, Provider>& b) {
             return a.first < b.first;
         });
    
    vector<Provider> results;
    for (int i = 0; i < min((int)candidates.size(), maxResults); i++) {
        results.push_back(candidates[i].second);
    }
    
    return results;
}

// ======================================================
// CREATE HARDCODED PROVIDERS (Dehradun)
// ======================================================
void createProviders() {
    cout << "\n📋 Creating provider database for Dehradun...\n";
    
    // FUEL STATIONS
    Provider f1; f1.id = "F1"; f1.name = "Indian Oil Petrol Pump"; f1.type = "fuel";
    f1.lat = 30.3165; f1.lng = 78.0322; f1.phone = "0135-2654321";
    f1.address = "Rajpur Road, Dehradun"; f1.rating = 4.5;
    providers.push_back(f1);
    
    Provider f2; f2.id = "F2"; f2.name = "HP Petrol Pump"; f2.type = "fuel";
    f2.lat = 30.3256; f2.lng = 78.0438; f2.phone = "0135-2712345";
    f2.address = "Clock Tower, Dehradun"; f2.rating = 4.3;
    providers.push_back(f2);
    
    Provider f3; f3.id = "F3"; f3.name = "Bharat Petroleum"; f3.type = "fuel";
    f3.lat = 30.3371; f3.lng = 78.0215; f3.phone = "0135-2623456";
    f3.address = "Saharanpur Road, Dehradun"; f3.rating = 4.6;
    providers.push_back(f3);
    
    Provider f4; f4.id = "F4"; f4.name = "Reliance Fuel Station"; f4.type = "fuel";
    f4.lat = 30.3098; f4.lng = 78.0089; f4.phone = "0135-2678901";
    f4.address = "Chakrata Road, Dehradun"; f4.rating = 4.4;
    providers.push_back(f4);
    
    Provider f5; f5.id = "F5"; f5.name = "Essar Oil Pump"; f5.type = "fuel";
    f5.lat = 30.3421; f5.lng = 78.0512; f5.phone = "0135-2745678";
    f5.address = "ISBT, Dehradun"; f5.rating = 4.2;
    providers.push_back(f5);
    
    Provider f6; f6.id = "F6"; f6.name = "Nayara Energy"; f6.type = "fuel";
    f6.lat = 30.3295; f6.lng = 78.0387; f6.phone = "0135-2789012";
    f6.address = "Ballupur, Dehradun"; f6.rating = 4.1;
    providers.push_back(f6);
    
    // MECHANICS
    Provider m1; m1.id = "M1"; m1.name = "Maruti Suzuki Service"; m1.type = "mechanic";
    m1.lat = 30.3201; m1.lng = 78.0412; m1.phone = "0135-2656789";
    m1.address = "Rajpur Road, Dehradun"; m1.rating = 4.7;
    providers.push_back(m1);
    
    Provider m2; m2.id = "M2"; m2.name = "Honda Car Care Center"; m2.type = "mechanic";
    m2.lat = 30.3345; m2.lng = 78.0298; m2.phone = "0135-2734567";
    m2.address = "Saharanpur Road, Dehradun"; m2.rating = 4.6;
    providers.push_back(m2);
    
    Provider m3; m3.id = "M3"; m3.name = "Mahindra Service"; m3.type = "mechanic";
    m3.lat = 30.3152; m3.lng = 78.0156; m3.phone = "0135-2678901";
    m3.address = "Chakrata Road, Dehradun"; m3.rating = 4.5;
    providers.push_back(m3);
    
    Provider m4; m4.id = "M4"; m4.name = "Tata Motors Service"; m4.type = "mechanic";
    m4.lat = 30.3402; m4.lng = 78.0456; m4.phone = "0135-2789012";
    m4.address = "ISBT Area, Dehradun"; m4.rating = 4.4;
    providers.push_back(m4);
    
    Provider m5; m5.id = "M5"; m5.name = "24x7 Roadside Assistance"; m5.type = "mechanic";
    m5.lat = 30.3255; m5.lng = 78.0523; m5.phone = "0135-2890123";
    m5.address = "Clock Tower, Dehradun"; m5.rating = 4.3;
    providers.push_back(m5);
    
    Provider m6; m6.id = "M6"; m6.name = "Hyundai Motor Plaza"; m6.type = "mechanic";
    m6.lat = 30.3289; m6.lng = 78.0345; m6.phone = "0135-2765432";
    m6.address = "Ballupur Chowk, Dehradun"; m6.rating = 4.5;
    providers.push_back(m6);
    
    Provider m7; m7.id = "M7"; m7.name = "Bosch Car Service"; m7.type = "mechanic";
    m7.lat = 30.3123; m7.lng = 78.0218; m7.phone = "0135-2654321";
    m7.address = "Garhi Cantt, Dehradun"; m7.rating = 4.6;
    providers.push_back(m7);
    
    cout << "   ✅ Created " << providers.size() << " providers\n";
    cout << "   ⛽ Fuel: 6, 🔧 Mechanics: 7\n";
}

// ======================================================
// UTILITY FUNCTIONS
// ======================================================
string getTime() {
    time_t now = time(nullptr);
    string dt = ctime(&now);
    dt.pop_back();
    return dt;
}

string readFile(string filename) {
    ifstream file(filename);
    if (!file.is_open()) return "";
    string content((istreambuf_iterator<char>(file)), istreambuf_iterator<char>());
    file.close();
    return content;
}

void sendResponse(SOCKET client, string response, string type) {
    string header = "HTTP/1.1 200 OK\r\n";
    header += "Content-Type: " + type + "\r\n";
    header += "Content-Length: " + to_string(response.length()) + "\r\n";
    header += "Access-Control-Allow-Origin: *\r\n";
    header += "Connection: close\r\n\r\n";
    send(client, (header + response).c_str(), (header + response).length(), 0);
}

// ======================================================
// MAIN FUNCTION
// ======================================================
int main() {
    cout << "\n" << string(60, '=') << endl;
    cout << "   🚗  M O T O R E S Q   (3 UIs - FULLY WORKING)" << endl;
    cout << "   Dehradun, Uttarakhand" << endl;
    cout << string(60, '=') << endl;
    
    createProviders();
    
    // Check files
    if (readFile("index.html").empty()) cout << "   ⚠️  index.html not found!\n";
    else cout << "   ✅ index.html found (UI 1 - User)\n";
    
    if (readFile("provider.html").empty()) cout << "   ⚠️  provider.html not found!\n";
    else cout << "   ✅ provider.html found (UI 2 - Provider)\n";
    
    if (readFile("delivery.html").empty()) cout << "   ⚠️  delivery.html not found!\n";
    else cout << "   ✅ delivery.html found (UI 3 - Delivery)\n";
    
    if (readFile("style.css").empty()) cout << "   ⚠️  style.css not found!\n";
    else cout << "   ✅ style.css found\n";
    
    if (readFile("script.js").empty()) cout << "   ⚠️  script.js not found!\n";
    else cout << "   ✅ script.js found\n";
    
    if (readFile("provider.js").empty()) cout << "   ⚠️  provider.js not found!\n";
    else cout << "   ✅ provider.js found\n";
    
    if (readFile("delivery.js").empty()) cout << "   ⚠️  delivery.js not found!\n";
    else cout << "   ✅ delivery.js found\n";
    
    // Start server
    WSADATA wsa;
    WSAStartup(MAKEWORD(2, 2), &wsa);
    
    SOCKET server = socket(AF_INET, SOCK_STREAM, 0);
    sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(PORT);
    
    bind(server, (sockaddr*)&addr, sizeof(addr));
    listen(server, 5);
    
    cout << "\n✅ SERVER RUNNING!\n";
    cout << "   🌐 http://localhost:" << PORT << " (UI 1 - USER)\n";
    cout << "   🌐 http://localhost:" << PORT << "/provider.html (UI 2 - PROVIDER)\n";
    cout << "   🌐 http://localhost:" << PORT << "/delivery.html (UI 3 - DELIVERY)\n";
    cout << "\n" << string(50, '-') << endl;
    cout << "Waiting for connections... (Ctrl+C to stop)\n";
    cout << string(50, '-') << endl;
    
    while (true) {
        sockaddr_in client;
        int clientSize = sizeof(client);
        SOCKET clientSock = accept(server, (sockaddr*)&client, &clientSize);
        
        char buffer[4096] = {0};
        recv(clientSock, buffer, sizeof(buffer), 0);
        
        string request(buffer);
        string method, path, version;
        istringstream requestStream(request);
        requestStream >> method >> path >> version;
        
        cout << "[" << getTime() << "] " << path << "\n";
        
        // ==========================================
        // UI 1: USER API - Get nearest providers
        // ==========================================
        if (path.find("/api/fuel") == 0 || path.find("/api/mechanic") == 0) {
            double userLat = 30.3165;
            double userLng = 78.0322;
            
            size_t qPos = path.find("?");
            if (qPos != string::npos) {
                string query = path.substr(qPos + 1);
                size_t latPos = query.find("lat=");
                size_t lngPos = query.find("lng=");
                
                if (latPos != string::npos) {
                    size_t latEnd = query.find("&", latPos);
                    string latStr = query.substr(latPos + 4, latEnd - (latPos + 4));
                    userLat = stod(latStr);
                }
                if (lngPos != string::npos) {
                    size_t lngEnd = query.find("&", lngPos);
                    string lngStr = query.substr(lngPos + 4, lngEnd - (lngPos + 4));
                    userLng = stod(lngStr);
                }
            }
            
            string type = (path.find("/api/fuel") == 0) ? "fuel" : "mechanic";
            vector<Provider> results = aStarFindNearest(userLat, userLng, type, 5);
            
            string json = "{\"type\":\"" + type + "\",\"count\":" + to_string(results.size()) + ",\"providers\":[";
            for (int i = 0; i < results.size(); i++) {
                Provider& p = results[i];
                json += "{";
                json += "\"id\":\"" + p.id + "\",";
                json += "\"name\":\"" + p.name + "\",";
                json += "\"address\":\"" + p.address + "\",";
                json += "\"phone\":\"" + p.phone + "\",";
                json += "\"distance\":" + to_string(p.distance).substr(0, 5) + ",";
                json += "\"rating\":" + to_string(p.rating) + ",";
                json += "\"lat\":" + to_string(p.lat) + ",";
                json += "\"lng\":" + to_string(p.lng);
                json += "}";
                if (i < results.size() - 1) json += ",";
            }
            json += "]}";
            sendResponse(clientSock, json, "application/json");
        }
        
        // ==========================================
        // UI 1: USER API - Send Request
        // ==========================================
        else if (path.find("/api/sendrequest") == 0) {
            size_t qPos = path.find("?");
            string requestId = "";
            if (qPos != string::npos) {
                string query = path.substr(qPos + 1);
                string providerId = "";
                string userName = "User";
                double userLat = 30.3165;
                double userLng = 78.0322;
                
                size_t providerPos = query.find("providerId=");
                if (providerPos != string::npos) {
                    size_t end = query.find("&", providerPos);
                    providerId = query.substr(providerPos + 11, end - (providerPos + 11));
                }
                
                size_t latPos = query.find("lat=");
                if (latPos != string::npos) {
                    size_t end = query.find("&", latPos);
                    userLat = stod(query.substr(latPos + 4, end - (latPos + 4)));
                }
                
                size_t lngPos = query.find("lng=");
                if (lngPos != string::npos) {
                    size_t end = query.find("&", lngPos);
                    userLng = stod(query.substr(lngPos + 4, end - (lngPos + 4)));
                }
                
                size_t namePos = query.find("userName=");
                if (namePos != string::npos) {
                    size_t end = query.find("&", namePos);
                    userName = query.substr(namePos + 9, end - (namePos + 9));
                }
                
                // Find provider and create request
                for (auto& p : providers) {
                    if (p.id == providerId) {
                        Request req;
                        requestId = "REQ" + to_string(nextRequestId++);
                        req.id = requestId;
                        req.userId = "USER1";
                        req.userName = userName;
                        req.userLat = userLat;
                        req.userLng = userLng;
                        req.type = p.type;
                        req.providerId = p.id;
                        req.providerName = p.name;
                        req.providerLat = p.lat;
                        req.providerLng = p.lng;
                        req.deliveryId = "";
                        req.status = "pending";
                        req.distance = calculateDistance(userLat, userLng, p.lat, p.lng);
                        requests.push_back(req);
                        cout << "   📝 New request created: " << req.id << " for " << p.name << endl;
                        break;
                    }
                }
            }
            string response = "{\"success\":true,\"requestId\":\"" + requestId + "\"}";
            sendResponse(clientSock, response, "application/json");
        }
        
        // ==========================================
        // UI 2: PROVIDER API - Get pending requests
        // ==========================================
        else if (path == "/api/provider/requests") {
            string json = "{\"requests\":[";
            bool first = true;
            for (auto& r : requests) {
                if (r.status == "pending") {
                    if (!first) json += ",";
                    json += "{";
                    json += "\"id\":\"" + r.id + "\",";
                    json += "\"userName\":\"" + r.userName + "\",";
                    json += "\"type\":\"" + r.type + "\",";
                    json += "\"userLat\":" + to_string(r.userLat) + ",";
                    json += "\"userLng\":" + to_string(r.userLng) + ",";
                    json += "\"petrolLat\":" + to_string(r.providerLat) + ",";
                    json += "\"petrolLng\":" + to_string(r.providerLng) + ",";
                    json += "\"petrolName\":\"" + r.providerName + "\",";
                    json += "\"distance\":" + to_string(r.distance) + ",";
                    json += "\"status\":\"" + r.status + "\"";
                    json += "}";
                    first = false;
                }
            }
            json += "]}";
            sendResponse(clientSock, json, "application/json");
        }
        
        // ==========================================
        // UI 2: PROVIDER API - Accept request
        // ==========================================
        else if (path.find("/api/provider/accept") == 0) {
            size_t qPos = path.find("?");
            bool success = false;
            if (qPos != string::npos) {
                string query = path.substr(qPos + 1);
                size_t idPos = query.find("id=");
                if (idPos != string::npos) {
                    string reqId = query.substr(idPos + 3);
                    for (auto& r : requests) {
                        if (r.id == reqId && r.status == "pending") {
                            r.status = "accepted";
                            success = true;
                            cout << "   ✅ Request " << reqId << " accepted by provider" << endl;
                            break;
                        }
                    }
                }
            }
            string response = "{\"success\":" + string(success ? "true" : "false") + "}";
            sendResponse(clientSock, response, "application/json");
        }
        
        // ==========================================
        // UI 2: PROVIDER API - Reject request
        // ==========================================
        else if (path.find("/api/provider/reject") == 0) {
            size_t qPos = path.find("?");
            bool success = false;
            if (qPos != string::npos) {
                string query = path.substr(qPos + 1);
                size_t idPos = query.find("id=");
                if (idPos != string::npos) {
                    string reqId = query.substr(idPos + 3);
                    for (auto it = requests.begin(); it != requests.end(); ++it) {
                        if (it->id == reqId && it->status == "pending") {
                            requests.erase(it);
                            success = true;
                            cout << "   ❌ Request " << reqId << " rejected by provider" << endl;
                            break;
                        }
                    }
                }
            }
            string response = "{\"success\":" + string(success ? "true" : "false") + "}";
            sendResponse(clientSock, response, "application/json");
        }
        
        // ==========================================
        // UI 3: DELIVERY API - Get requests for delivery
        // ==========================================
        else if (path == "/api/delivery/requests") {
            string json = "{\"requests\":[";
            bool first = true;
            for (auto& r : requests) {
                if (r.status == "accepted" || r.status == "picked") {
                    if (!first) json += ",";
                    json += "{";
                    json += "\"id\":\"" + r.id + "\",";
                    json += "\"userName\":\"" + r.userName + "\",";
                    json += "\"providerName\":\"" + r.providerName + "\",";
                    json += "\"userLat\":" + to_string(r.userLat) + ",";
                    json += "\"userLng\":" + to_string(r.userLng) + ",";
                    json += "\"providerLat\":" + to_string(r.providerLat) + ",";
                    json += "\"providerLng\":" + to_string(r.providerLng) + ",";
                    json += "\"distance\":" + to_string(r.distance) + ",";
                    json += "\"status\":\"" + r.status + "\"";
                    json += "}";
                    first = false;
                }
            }
            json += "]}";
            sendResponse(clientSock, json, "application/json");
        }
        
        // ==========================================
        // UI 3: DELIVERY API - Accept pickup (delivery person)
        // ==========================================
        else if (path.find("/api/delivery/accept") == 0) {
            size_t qPos = path.find("?");
            bool success = false;
            if (qPos != string::npos) {
                string query = path.substr(qPos + 1);
                size_t idPos = query.find("id=");
                if (idPos != string::npos) {
                    string reqId = query.substr(idPos + 3);
                    size_t delPos = query.find("deliveryId=");
                    string deliveryId = (delPos != string::npos) ? query.substr(delPos + 11) : "D1";
                    
                    for (auto& r : requests) {
                        if (r.id == reqId && r.status == "accepted") {
                            r.status = "picked";
                            r.deliveryId = deliveryId;
                            success = true;
                            cout << "   🛵 Request " << reqId << " picked by delivery person " << deliveryId << endl;
                            break;
                        }
                    }
                }
            }
            string response = "{\"success\":" + string(success ? "true" : "false") + "}";
            sendResponse(clientSock, response, "application/json");
        }
        
        // ==========================================
        // UI 3: DELIVERY API - Mark delivered
        // ==========================================
        else if (path.find("/api/delivery/deliver") == 0) {
            size_t qPos = path.find("?");
            bool success = false;
            if (qPos != string::npos) {
                string query = path.substr(qPos + 1);
                size_t idPos = query.find("id=");
                if (idPos != string::npos) {
                    string reqId = query.substr(idPos + 3);
                    for (auto& r : requests) {
                        if (r.id == reqId && r.status == "picked") {
                            r.status = "delivered";
                            success = true;
                            cout << "   ✅ Request " << reqId << " delivered successfully!" << endl;
                            break;
                        }
                    }
                }
            }
            string response = "{\"success\":" + string(success ? "true" : "false") + "}";
            sendResponse(clientSock, response, "application/json");
        }
        
        // ==========================================
        // UI 1: USER API - Get request status
        // ==========================================
        else if (path == "/api/user/status") {
            string json = "{\"requests\":[";
            bool first = true;
            for (auto& r : requests) {
                if (!first) json += ",";
                json += "{";
                json += "\"id\":\"" + r.id + "\",";
                json += "\"providerName\":\"" + r.providerName + "\",";
                json += "\"status\":\"" + r.status + "\"";
                json += "}";
                first = false;
            }
            json += "]}";
            sendResponse(clientSock, json, "application/json");
        }
        
        // ==========================================
// NOTIFICATION APIs
// ==========================================
else if (path == "/api/notify/user") {
    sendResponse(clientSock, "{\"success\":true}", "application/json");
}
else if (path == "/api/notify/provider") {
    sendResponse(clientSock, "{\"success\":true}", "application/json");
}
        
        // ==========================================
        // SERVE HTML/CSS/JS FILES
        // ==========================================
        else if (path == "/" || path == "/index.html") {
            string content = readFile("index.html");
            if (content.empty()) content = "<h1>Error: index.html not found</h1>";
            sendResponse(clientSock, content, "text/html");
        }
        else if (path == "/provider.html") {
            string content = readFile("provider.html");
            if (content.empty()) content = "<h1>Error: provider.html not found</h1>";
            sendResponse(clientSock, content, "text/html");
        }
        else if (path == "/delivery.html") {
            string content = readFile("delivery.html");
            if (content.empty()) content = "<h1>Error: delivery.html not found</h1>";
            sendResponse(clientSock, content, "text/html");
        }
        else if (path == "/style.css") {
            string content = readFile("style.css");
            if (content.empty()) content = "/* style.css not found */";
            sendResponse(clientSock, content, "text/css");
        }
        else if (path == "/script.js") {
            string content = readFile("script.js");
            if (content.empty()) content = "// script.js not found";
            sendResponse(clientSock, content, "application/javascript");
        }
        else if (path == "/provider.js") {
            string content = readFile("provider.js");
            if (content.empty()) content = "// provider.js not found";
            sendResponse(clientSock, content, "application/javascript");
        }
        else if (path == "/delivery.js") {
            string content = readFile("delivery.js");
            if (content.empty()) content = "// delivery.js not found";
            sendResponse(clientSock, content, "application/javascript");
        }
        else {
            sendResponse(clientSock, "<h1>404 Not Found</h1>", "text/html");
        }
        
        closesocket(clientSock);
    }
    
    closesocket(server);
    WSACleanup();
    return 0;
}